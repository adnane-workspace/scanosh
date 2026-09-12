import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import {
  findProductImageCandidate,
  findProductImageCandidatesBatch,
  getMediaItemById,
  isProductImageSuggestEnabled,
  listImageCandidatesForName,
  listMediaLibrary,
} from './productImage.suggest.js';
import { generateFluxProductImage, isFluxConfigured } from './productImage.flux.js';
import { invalidatePublicMenu } from './menuCache.service.js';
import {
  deleteReplacedImage,
  normalizeImageUrl,
  uploadImageFromBase64,
  uploadImageFromUrl,
} from './storage.service.js';

const BATCH_MAX = 20;
const FLUX_BATCH_MAX = 8;
const FLUX_CONCURRENCY = 3;

function requireCafeId(user) {
  if (!user.cafeId) {
    throw new ApiError(403, 'No cafe associated with this account', null, 'NO_CAFE');
  }
  return user.cafeId;
}

function toProductResponse(product) {
  const category = product.category;
  return {
    _id: product.id,
    cafeId: product.cafeId,
    categoryId: product.categoryId,
    categoryName: category?.name ?? null,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: product.image,
    available: product.available,
    order: product.order,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function loadProductWithSection(cafeId, productId) {
  const product = await prisma.product.findFirst({
    where: { id: productId, cafeId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          sectionKey: true,
          parentId: true,
          parent: { select: { sectionKey: true, name: true } },
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found', null, 'PRODUCT_NOT_FOUND');
  }

  return product;
}

function resolveSectionKey(product) {
  return product.category?.sectionKey || product.category?.parent?.sectionKey || null;
}

async function applyCandidate(product, candidate, { overwrite = false } = {}) {
  if (product.image && !overwrite) {
    return {
      product: toProductResponse(product),
      skipped: true,
      reason: 'already_has_image',
      source: null,
    };
  }

  if (!candidate?.imageUrl) {
    throw new ApiError(404, 'No image found for this product', null, 'IMAGE_SUGGEST_NOT_FOUND');
  }

  const previousImage = product.image;
  let cloudinaryUrl = '';
  if (candidate.base64 || String(candidate.imageUrl || '').startsWith('data:')) {
    cloudinaryUrl = await uploadImageFromBase64(candidate.base64 || candidate.imageUrl, {
      folder: 'products',
    });
  } else if (candidate.reuseUrl) {
    cloudinaryUrl = normalizeImageUrl(candidate.imageUrl);
  } else {
    cloudinaryUrl = await uploadImageFromUrl(candidate.imageUrl, { folder: 'products' });
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { image: normalizeImageUrl(cloudinaryUrl) },
    include: { category: { select: { name: true } } },
  });

  await deleteReplacedImage(previousImage, updated.image);
  invalidatePublicMenu(product.cafeId);

  return {
    product: toProductResponse(updated),
    skipped: false,
    source: candidate.source,
    label: candidate.label || null,
  };
}

async function applySuggestedImage(product, { overwrite = false } = {}) {
  if (!isProductImageSuggestEnabled()) {
    throw new ApiError(503, 'Product image suggest is disabled', null, 'IMAGE_SUGGEST_DISABLED');
  }

  if (product.image && !overwrite) {
    return {
      product: toProductResponse(product),
      skipped: true,
      reason: 'already_has_image',
      source: null,
    };
  }

  const candidate = await resolveProductImageCandidate(product, { stage: 'auto' });

  return applyCandidate(product, candidate, { overwrite });
}

export function getProductImageSuggestStatus() {
  return {
    enabled: isProductImageSuggestEnabled(),
    batchMax: BATCH_MAX,
    fluxBatchMax: FLUX_BATCH_MAX,
    fluxEnabled: isFluxConfigured(),
    mode: 'library-then-flux',
  };
}

async function resolveProductImageCandidate(product, { stage = 'auto' } = {}) {
  const sectionKey = resolveSectionKey(product);
  const doLibrary = stage === 'auto' || stage === 'library';
  const doFlux = stage === 'auto' || stage === 'flux';

  if (doLibrary) {
    const fromApi = await findProductImageCandidate(product.name, {
      sectionKey,
      cafeId: product.cafeId,
      productId: product.id,
      description: product.description,
    });
    if (fromApi) return fromApi;
  }

  if (doFlux && isFluxConfigured()) {
    return generateFluxProductImage({
      name: product.name,
      description: product.description,
      sectionKey,
    });
  }

  return null;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const pool = Math.min(Math.max(Number(limit) || 1, 1), items.length || 1);
  await Promise.all(Array.from({ length: pool }, () => run()));
  return results;
}

export async function browseMediaLibrary(user, query = {}) {
  requireCafeId(user);
  return listMediaLibrary(query);
}

export async function getProductImageCandidates(user, productId) {
  const cafeId = requireCafeId(user);
  const product = await loadProductWithSection(cafeId, productId);
  const sectionKey = resolveSectionKey(product);
  // Refresh catalog first so suggestions + browse see the latest Menu Media photos.
  const browse = await listMediaLibrary({
    section: sectionKey === 'cafe' || sectionKey === 'restaurant' ? sectionKey : '',
    search: '',
    limit: 500,
    refresh: true,
  });
  const ranked = await listImageCandidatesForName(product.name, { sectionKey, limit: 24 });

  return {
    product: toProductResponse(product),
    sectionKey,
    suggested: ranked.items,
    library: browse.items,
    libraryTotal: browse.total,
    libraryCount: browse.count,
  };
}

export async function applyMediaImageToProduct(user, productId, { mediaId = '', imageUrl = '' } = {}) {
  const cafeId = requireCafeId(user);
  const product = await loadProductWithSection(cafeId, productId);

  let sourceUrl = String(imageUrl || '').trim();
  let label = '';

  // Prefer client URL (instant) — only hit Menu Media library when needed.
  if (!/^https?:\/\//i.test(sourceUrl) && mediaId) {
    const item = await getMediaItemById(mediaId);
    if (!item?.image) {
      throw new ApiError(404, 'Media image not found', null, 'MEDIA_IMAGE_NOT_FOUND');
    }
    sourceUrl = item.image;
    label = item.title || item.name || '';
  }

  if (!/^https?:\/\//i.test(sourceUrl)) {
    throw new ApiError(400, 'Image URL is required', null, 'IMAGE_URL_INVALID');
  }

  const result = await applyCandidate(
    product,
    {
      imageUrl: sourceUrl,
      source: 'menu-media-pick',
      label,
      // Menu Media URLs are already hosted — skip Cloudinary re-upload (was ~2–10s).
      reuseUrl: true,
    },
    { overwrite: true },
  );

  return result;
}

export async function suggestProductImage(user, productId, { overwrite = false } = {}) {
  const cafeId = requireCafeId(user);
  const product = await loadProductWithSection(cafeId, productId);
  return applySuggestedImage(product, { overwrite });
}

export async function suggestProductImagesBatch(
  user,
  { productIds = [], onlyMissing = true, overwrite = false, limit = BATCH_MAX, stage = 'auto' } = {},
) {
  const cafeId = requireCafeId(user);

  if (!isProductImageSuggestEnabled()) {
    throw new ApiError(503, 'Product image suggest is disabled', null, 'IMAGE_SUGGEST_DISABLED');
  }

  const max = Math.min(Math.max(Number(limit) || BATCH_MAX, 1), BATCH_MAX);
  const ids = Array.isArray(productIds)
    ? [...new Set(productIds.map((id) => String(id)).filter(Boolean))].slice(0, max)
    : [];

  let products = [];

  if (ids.length) {
    products = await prisma.product.findMany({
      where: {
        cafeId,
        id: { in: ids },
        ...(onlyMissing && !overwrite ? { image: '' } : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            sectionKey: true,
            parentId: true,
            parent: { select: { sectionKey: true, name: true } },
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      take: max,
    });
  } else {
    products = await prisma.product.findMany({
      where: {
        cafeId,
        ...(onlyMissing && !overwrite ? { image: '' } : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            sectionKey: true,
            parentId: true,
            parent: { select: { sectionKey: true, name: true } },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: max,
    });
  }

  const pending = products.filter((product) => overwrite || !product.image);
  const doLibrary = stage === 'auto' || stage === 'library';
  const doFlux = stage === 'auto' || stage === 'flux';

  const candidates = doLibrary
    ? await findProductImageCandidatesBatch(
        pending.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          sectionKey: resolveSectionKey(product),
        })),
      )
    : new Map();

  const results = [];
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let fromLibrary = 0;
  let fromFlux = 0;
  let pendingFlux = 0;
  const fluxQueue = [];

  for (const product of products) {
    try {
      if (product.image && !overwrite) {
        skipped += 1;
        results.push({
          productId: product.id,
          ok: true,
          skipped: true,
          source: null,
          product: toProductResponse(product),
        });
        continue;
      }

      const candidate = candidates.get(product.id) || null;
      if (candidate) {
        const result = await applyCandidate(product, candidate, { overwrite });
        results.push({
          productId: product.id,
          ok: true,
          skipped: Boolean(result.skipped),
          source: result.source,
          product: result.product,
        });
        if (result.skipped) skipped += 1;
        else {
          updated += 1;
          if (result.source === 'menu-media' || result.source === 'pollinations') fromLibrary += 1;
        }
        continue;
      }

      if (doFlux && isFluxConfigured()) {
        fluxQueue.push(product);
        continue;
      }

      if (stage === 'library') {
        pendingFlux += 1;
        results.push({
          productId: product.id,
          ok: true,
          skipped: false,
          pending: true,
          source: null,
          product: toProductResponse(product),
        });
        continue;
      }

      failed += 1;
      results.push({
        productId: product.id,
        ok: false,
        skipped: false,
        source: null,
        error: 'IMAGE_SUGGEST_NOT_FOUND',
      });
    } catch (error) {
      failed += 1;
      results.push({
        productId: product.id,
        ok: false,
        skipped: false,
        source: null,
        error: error?.code || error?.message || 'IMAGE_SUGGEST_FAILED',
      });
    }
  }

  const fluxLimit = stage === 'flux' ? pending.length : FLUX_BATCH_MAX;
  const fluxTargets = fluxQueue.slice(0, fluxLimit);

  if (fluxTargets.length) {
    await mapLimit(fluxTargets, FLUX_CONCURRENCY, async (product) => {
      try {
        const generated = await generateFluxProductImage({
          name: product.name,
          description: product.description,
          sectionKey: resolveSectionKey(product),
        });
        const result = await applyCandidate(product, generated, { overwrite });
        results.push({
          productId: product.id,
          ok: true,
          skipped: Boolean(result.skipped),
          source: result.source,
          product: result.product,
        });
        if (result.skipped) skipped += 1;
        else {
          updated += 1;
          fromFlux += 1;
        }
      } catch (error) {
        failed += 1;
        results.push({
          productId: product.id,
          ok: false,
          skipped: false,
          source: null,
          error: error?.code || error?.message || 'FLUX_FAILED',
        });
      }
    });
  }

  return {
    summary: {
      requested: products.length,
      updated,
      skipped,
      failed,
      fromLibrary,
      fromFlux,
      pendingFlux,
      stage,
    },
    results,
  };
}
