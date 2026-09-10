import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { subtreeProductCounts } from '../utils/categoryTree.js';
import { toQrStatus } from './qr.service.js';

function requireCafeId(user) {
  if (!user.cafeId) {
    throw new ApiError(403, 'No cafe associated with this account', null, 'NO_CAFE');
  }

  return user.cafeId;
}

function toRecentProduct(product) {
  return {
    _id: product.id,
    name: product.name,
    price: Number(product.price),
    image: product.image,
    available: product.available,
    categoryName: product.category?.name ?? null,
    createdAt: product.createdAt,
  };
}

export async function getDashboardStats(user) {
  const cafeId = requireCafeId(user);

  const [availability, recentProducts, categoryDocs, productCounts, productsWithoutImage, cafe] =
    await Promise.all([
      prisma.product.groupBy({
        by: ['available'],
        where: { cafeId },
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: { cafeId },
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.category.findMany({
        where: { cafeId },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, parentId: true },
      }),
      prisma.product.groupBy({
        by: ['categoryId'],
        where: { cafeId },
        _count: { _all: true },
      }),
      prisma.product.count({
        where: { cafeId, image: '' },
      }),
      prisma.cafe.findUnique({
        where: { id: cafeId },
        select: {
          name: true,
          slug: true,
          logo: true,
          cover: true,
          address: true,
          phone: true,
          latitude: true,
          longitude: true,
          qrGeneratedAt: true,
        },
      }),
    ]);

  const availableProducts = availability.find((row) => row.available)?._count._all || 0;
  const unavailableProducts = availability.find((row) => !row.available)?._count._all || 0;
  const totalProducts = availableProducts + unavailableProducts;
  const directCounts = new Map(productCounts.map((item) => [item.categoryId, item._count._all]));
  const countByCategory = subtreeProductCounts(categoryDocs, directCounts);

  return {
    totalProducts,
    totalCategories: categoryDocs.length,
    availableProducts,
    unavailableProducts,
    recentProducts: recentProducts.map(toRecentProduct),
    productsWithoutImage,
    categories: categoryDocs.map((category) => ({
      _id: category.id,
      name: category.name,
      productCount: countByCategory.get(category.id) || 0,
    })),
    cafe: cafe
      ? {
          name: cafe.name,
          slug: cafe.slug,
          logo: cafe.logo || '',
          cover: cafe.cover || '',
          address: cafe.address || '',
          phone: cafe.phone || '',
          latitude: cafe.latitude,
          longitude: cafe.longitude,
          qr: toQrStatus(cafe),
        }
      : null,
  };
}
