import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { isMenuSectionKey } from '../utils/menuSections.js';
import { buildPaginationMeta, paginatedResult, parsePaginationQuery } from '../utils/pagination.js';
import { createCategory, ensureDefaultSections } from './category.service.js';
import { extractDraftMenu, normalizeDraftMenu } from './menuDraft.extractor.js';
import { extractDraftMenuWithLlm, isMenuLlmConfigured } from './menuDraft.llm.js';
import { isOcrConfigured, runOcrOnImage } from './ocr.client.js';
import { createProduct } from './product.service.js';
import { uploadProductImage } from './storage.service.js';

const MERGE_LEVELS = new Set(['word', 'sentence', 'paragraph']);

function requireCafeId(user) {
  if (!user.cafeId) {
    throw new ApiError(403, 'No cafe associated with this account', null, 'NO_CAFE');
  }
  return user.cafeId;
}

function toImportResponse(row) {
  return {
    _id: row.id,
    cafeId: row.cafeId,
    status: row.status,
    sourceImageUrl: row.sourceImageUrl || '',
    mergeLevel: row.mergeLevel,
    rawText: row.rawText || '',
    rawBlocks: Array.isArray(row.rawBlocks) ? row.rawBlocks : [],
    draftMenu: row.draftMenu ?? null,
    provider: row.provider || '',
    errorMessage: row.errorMessage || '',
    durationMs: row.durationMs ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findOwnedImport(cafeId, id) {
  const row = await prisma.menuImport.findFirst({
    where: { id, cafeId },
  });

  if (!row) {
    throw new ApiError(404, 'Menu import not found', null, 'MENU_IMPORT_NOT_FOUND');
  }

  return row;
}

async function buildDraftMenu(ocrResult) {
  const input = { text: ocrResult.text, blocks: ocrResult.blocks };

  if (isMenuLlmConfigured()) {
    try {
      return await extractDraftMenuWithLlm(input);
    } catch (error) {
      console.error('[menu-import] LLM structuring failed:', error?.code || '', error?.message || error);
      // Fallback heuristic keeps the flow usable if the LLM is down.
      const fallback = extractDraftMenu(input);
      fallback.meta = {
        ...fallback.meta,
        llmError: String(error?.message || 'LLM failed').slice(0, 200),
        parser: `${fallback.meta?.parser || 'heuristic-v1'}+llm-fallback`,
      };
      return fallback;
    }
  }

  return extractDraftMenu(input);
}

export function getMenuImportStatus() {
  return {
    configured: isOcrConfigured(),
    llmConfigured: isMenuLlmConfigured(),
    maxImageBytes: 4 * 1024 * 1024,
  };
}

export async function createMenuImport(user, file, { mergeLevel = 'paragraph' } = {}) {
  const cafeId = requireCafeId(user);

  if (!file?.buffer?.length) {
    throw new ApiError(400, 'An image is required', null, 'IMAGE_REQUIRED');
  }

  if (!isOcrConfigured()) {
    throw new ApiError(503, 'OCR service is not configured', null, 'OCR_NOT_CONFIGURED');
  }

  const level = MERGE_LEVELS.has(mergeLevel) ? mergeLevel : 'paragraph';

  let sourceImageUrl = '';
  try {
    sourceImageUrl = await uploadProductImage(file, { folder: 'menu-imports' });
  } catch {
    sourceImageUrl = '';
  }

  let ocrResult;
  try {
    ocrResult = await runOcrOnImage(file, { mergeLevel: level });
  } catch (error) {
    const failed = await prisma.menuImport.create({
      data: {
        cafeId,
        status: 'failed',
        sourceImageUrl,
        mergeLevel: level,
        errorMessage: String(error?.message || 'OCR failed').slice(0, 500),
      },
    });

    if (error instanceof ApiError) {
      error.details = { ...(error.details || {}), importId: failed.id };
      throw error;
    }
    throw error;
  }

  const draftMenu = await buildDraftMenu(ocrResult);

  const row = await prisma.menuImport.create({
    data: {
      cafeId,
      status: 'pending',
      sourceImageUrl,
      mergeLevel: ocrResult.mergeLevel || level,
      rawText: ocrResult.text,
      rawBlocks: ocrResult.blocks,
      draftMenu,
      provider: ocrResult.provider,
      durationMs: ocrResult.durationMs,
    },
  });

  return toImportResponse(row);
}

export async function listMenuImports(user, query = {}) {
  const cafeId = requireCafeId(user);
  const { page, limit, skip } = parsePaginationQuery(query);

  const where = { cafeId };
  const [total, items] = await Promise.all([
    prisma.menuImport.count({ where }),
    prisma.menuImport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return paginatedResult(
    items.map(toImportResponse),
    buildPaginationMeta({ page, limit, total }),
  );
}

export async function getMenuImportById(user, id) {
  const cafeId = requireCafeId(user);
  const row = await findOwnedImport(cafeId, id);
  return toImportResponse(row);
}

export async function updateMenuImportDraft(user, id, draftMenuInput) {
  const cafeId = requireCafeId(user);
  const row = await findOwnedImport(cafeId, id);

  if (row.status === 'published') {
    throw new ApiError(400, 'This import was already published', null, 'MENU_IMPORT_PUBLISHED');
  }

  if (row.status === 'failed') {
    throw new ApiError(400, 'Cannot edit a failed import', null, 'MENU_IMPORT_FAILED');
  }

  const draftMenu = normalizeDraftMenu(draftMenuInput);
  const updated = await prisma.menuImport.update({
    where: { id: row.id },
    data: {
      draftMenu,
      status: 'reviewed',
    },
  });

  return toImportResponse(updated);
}

export async function publishMenuImport(user, id, draftMenuInput = null) {
  const cafeId = requireCafeId(user);
  const row = await findOwnedImport(cafeId, id);

  if (row.status === 'published') {
    return {
      import: toImportResponse(row),
      summary: {
        categoriesCreated: 0,
        productsCreated: 0,
        categoriesReused: 0,
        alreadyPublished: true,
      },
    };
  }

  if (row.status === 'failed') {
    throw new ApiError(400, 'Cannot publish a failed import', null, 'MENU_IMPORT_FAILED');
  }

  const draft = normalizeDraftMenu(draftMenuInput || row.draftMenu);

  if (draftMenuInput) {
    await prisma.menuImport.update({
      where: { id: row.id },
      data: { draftMenu: draft, status: 'reviewed' },
    });
  }

  const selectedCategories = draft.categories.filter(
    (cat) => cat.selected && cat.products.some((p) => p.selected),
  );

  if (!selectedCategories.length) {
    throw new ApiError(400, 'Select at least one product to publish', null, 'MENU_IMPORT_EMPTY');
  }

  await ensureDefaultSections(cafeId);

  const sections = await prisma.category.findMany({
    where: { cafeId, sectionKey: { not: null }, parentId: null },
    orderBy: { order: 'asc' },
    include: { _count: { select: { products: true, children: true } } },
  });

  const sectionByKey = new Map(sections.map((item) => [item.sectionKey, item]));

  const usedSectionKeys = new Set(
    selectedCategories.map((cat) =>
      isMenuSectionKey(cat.sectionKey) ? cat.sectionKey : 'restaurant',
    ),
  );

  for (const key of usedSectionKeys) {
    const section = sectionByKey.get(key);
    if (section && section._count.products > 0) {
      throw new ApiError(
        400,
        `La section ${section.name} contient déjà des produits. Déplace-les dans une catégorie avant d’importer.`,
        { sectionKey: key },
        'CATEGORY_HAS_PRODUCTS',
      );
    }
  }

  let categoriesCreated = 0;
  let productsCreated = 0;

  for (const [index, cat] of selectedCategories.entries()) {
    const sectionKey = isMenuSectionKey(cat.sectionKey) ? cat.sectionKey : 'restaurant';
    const section = sectionByKey.get(sectionKey);

    if (!section) {
      throw new ApiError(
        400,
        `La section « ${sectionKey} » n’existe pas. Créez-la ou choisissez une autre section.`,
        { sectionKey },
        'SECTION_NOT_FOUND',
      );
    }

    const existing = await prisma.category.findFirst({
      where: {
        cafeId,
        parentId: section.id,
        sectionKey: null,
        name: { equals: String(cat.name).slice(0, 80), mode: 'insensitive' },
      },
      include: { _count: { select: { children: true } } },
    });

    let categoryId = null;
    if (existing && existing._count.children === 0) {
      categoryId = existing.id;
    } else {
      const created = await createCategory(user, {
        name: String(cat.name).slice(0, 80),
        parentId: section.id,
        order: index,
      });
      categoryId = created._id;
      categoriesCreated += 1;
    }

    const selectedProducts = cat.products.filter((p) => p.selected);
    for (const [pIndex, prod] of selectedProducts.entries()) {
      await createProduct(user, {
        name: String(prod.name).slice(0, 120),
        description: String(prod.description || '').slice(0, 500),
        price: Number(prod.price) || 0,
        categoryId,
        available: true,
        order: pIndex,
      });
      productsCreated += 1;
    }
  }

  const updated = await prisma.menuImport.update({
    where: { id: row.id },
    data: {
      status: 'published',
      draftMenu: draft,
    },
  });

  return {
    import: toImportResponse(updated),
    summary: {
      categoriesCreated,
      productsCreated,
      categoriesReused: selectedCategories.length - categoriesCreated,
      alreadyPublished: false,
    },
  };
}
