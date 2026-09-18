import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, paginatedResult, parsePaginationQuery } from '../utils/pagination.js';
import { recordActivity } from './activity.service.js';
import { invalidatePublicMenu } from './menuCache.service.js';
import { deleteCloudinaryImage, deleteReplacedImage, normalizeImageUrl } from './storage.service.js';
import { assertLeafCategory } from './category.service.js';
import { collectDescendantIds } from '../utils/categoryTree.js';
import { productSearchWhere } from '../utils/productSearch.js';

function requireCafeId(user) {
  if (!user.cafeId) {
    throw new ApiError(403, 'No cafe associated with this account', null, 'NO_CAFE');
  }

  return user.cafeId;
}

function categoryInclude() {
  return {
    category: {
      select: {
        name: true,
        sectionKey: true,
        parent: { select: { sectionKey: true } },
      },
    },
  };
}

function productSectionKey(product) {
  return product.category?.sectionKey || product.category?.parent?.sectionKey || null;
}

function toProductResponse(product) {
  const category = product.category;
  const sectionKey = productSectionKey(product);
  const cafeSection = sectionKey === 'cafe';

  return {
    _id: product.id,
    cafeId: product.cafeId,
    categoryId: product.categoryId,
    categoryName: category?.name ?? null,
    sectionKey,
    name: product.name,
    description: cafeSection ? '' : product.description,
    price: Number(product.price),
    image: product.image,
    available: product.available,
    order: product.order,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function assertOwnedCategory(cafeId, categoryId) {
  return assertLeafCategory(cafeId, categoryId);
}

async function findOwnedProduct(cafeId, productId) {
  const product = await prisma.product.findFirst({
    where: { id: productId, cafeId },
    include: categoryInclude(),
  });

  if (!product) {
    throw new ApiError(404, 'Product not found', null, 'PRODUCT_NOT_FOUND');
  }

  return product;
}

async function isCafeCategory(cafeId, categoryId) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, cafeId },
    select: { sectionKey: true, parent: { select: { sectionKey: true } } },
  });
  return (category?.sectionKey || category?.parent?.sectionKey) === 'cafe';
}

export async function createProduct(user, payload) {
  const cafeId = requireCafeId(user);
  await assertOwnedCategory(cafeId, payload.categoryId);
  const hideDescription = await isCafeCategory(cafeId, payload.categoryId);

  const product = await prisma.product.create({
    data: {
      cafeId,
      categoryId: payload.categoryId,
      name: payload.name,
      description: hideDescription ? '' : payload.description ?? '',
      price: payload.price,
      image: normalizeImageUrl(payload.image),
      available: payload.available ?? true,
      order: payload.order ?? 0,
    },
    include: categoryInclude(),
  });

  invalidatePublicMenu(cafeId);
  return toProductResponse(product);
}

export async function listProducts(user, query = {}) {
  const cafeId = requireCafeId(user);
  const { page, limit, skip } = parsePaginationQuery(query);
  const search = String(query.search || '').trim();
  const availability = query.availability;
  const searchWhere = productSearchWhere(search);

  const where = { cafeId };

  if (searchWhere) {
    Object.assign(where, searchWhere);
  }

  if (availability === 'available') {
    where.available = true;
  } else if (availability === 'unavailable') {
    where.available = false;
  }

  if (query.missingImage) {
    where.image = '';
  }

  if (query.categoryId) {
    const categories = await prisma.category.findMany({
      where: { cafeId },
      select: { id: true, parentId: true },
    });

    const allowedIds = collectDescendantIds(categories, query.categoryId);
    allowedIds.push(query.categoryId);
    where.categoryId = { in: allowedIds };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: categoryInclude(),
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const pagination = buildPaginationMeta({ page, limit, total });

  return paginatedResult(products.map(toProductResponse), pagination);
}

export async function getProductById(user, productId) {
  const cafeId = requireCafeId(user);
  const product = await findOwnedProduct(cafeId, productId);

  return toProductResponse(product);
}

export async function updateProduct(user, productId, payload) {
  const cafeId = requireCafeId(user);
  const current = await findOwnedProduct(cafeId, productId);

  if (payload.categoryId !== undefined) {
    await assertOwnedCategory(cafeId, payload.categoryId);
  }

  const data = {
    ...(payload.categoryId !== undefined && { categoryId: payload.categoryId }),
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...(payload.price !== undefined && { price: payload.price }),
    ...(payload.available !== undefined && { available: payload.available }),
    ...(payload.order !== undefined && { order: payload.order }),
  };

  if (payload.image !== undefined) {
    data.image = normalizeImageUrl(payload.image);
  }

  const categoryId = payload.categoryId !== undefined ? payload.categoryId : current.categoryId;
  if (await isCafeCategory(cafeId, categoryId)) {
    data.description = '';
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data,
    include: categoryInclude(),
  });

  if (payload.image !== undefined) {
    await deleteReplacedImage(current.image, product.image);
  }

  invalidatePublicMenu(cafeId);
  return toProductResponse(product);
}

export async function deleteProduct(user, productId) {
  const cafeId = requireCafeId(user);
  const product = await findOwnedProduct(cafeId, productId);

  await prisma.product.delete({ where: { id: productId } });
  await deleteCloudinaryImage(product.image);
  invalidatePublicMenu(cafeId);

  await recordActivity({
    action: 'product_deleted',
    actorId: user.id,
    cafeId,
    metadata: {
      productName: product.name,
      categoryName: product.category?.name,
    },
  });
}
