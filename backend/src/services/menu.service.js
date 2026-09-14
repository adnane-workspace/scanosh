import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { groupByParent } from '../utils/categoryTree.js';
import { normalizeMenuUi, normalizeSectionVisibility } from '../utils/menuUi.js';
import { readPublicMenuCache, writePublicMenuCache } from './menuCache.service.js';

function toPublicProduct(product, { hideDescription = false } = {}) {
  return {
    id: product.id,
    name: product.name,
    description: hideDescription ? '' : product.description || '',
    price: Number(product.price),
    image: product.image || '',
  };
}

function countNodeProducts(node) {
  const direct = node.products?.length || 0;
  const nested = (node.children || []).reduce((total, child) => total + countNodeProducts(child), 0);
  return direct + nested;
}

function buildPublicTree(categories, productsByCategory) {
  const byParent = groupByParent(categories);

  function buildNode(category, inheritedSectionKey = null) {
    const sectionKey = category.sectionKey || inheritedSectionKey;
    const hideDescription = sectionKey === 'cafe';
    const children = (byParent.get(category.id) || [])
      .map((child) => buildNode(child, sectionKey))
      .filter(Boolean);
    const products = (productsByCategory.get(category.id) || []).map((product) =>
      toPublicProduct(product, { hideDescription }),
    );

    if (children.length === 0 && products.length === 0) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      image: category.image || '',
      description: category.description || '',
      parentId: category.parentId || null,
      sectionKey: category.sectionKey || null,
      children,
      products,
    };
  }

  return (byParent.get('') || []).map(buildNode).filter(Boolean);
}

function buildPublicSections(tree, menuUi) {
  const visibility = normalizeSectionVisibility(menuUi?.sectionVisibility);

  return tree
    .filter((node) => node.sectionKey && visibility[node.sectionKey] !== false)
    .map((node) => ({
      key: node.sectionKey,
      id: node.id,
      name: node.name,
      image: node.image || '',
      description: node.description || '',
      childCount: node.children?.length || 0,
      productCount: countNodeProducts(node),
      children: node.children || [],
    }))
    .filter((section) => section.children.length > 0);
}

export async function getPublicMenu(slug) {
  const cached = readPublicMenuCache(slug);

  if (cached) {
    return cached.data;
  }

  const menu = await loadPublicMenu(slug);
  writePublicMenuCache(slug, menu.cafeId, menu.data);
  return menu.data;
}

async function loadPublicMenu(slug) {
  const cafe = await prisma.cafe.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      logo: true,
      cover: true,
      address: true,
      phone: true,
      latitude: true,
      longitude: true,
      menuUi: true,
      isActive: true,
    },
  });

  if (!cafe) {
    throw new ApiError(404, 'Menu not found', null, 'MENU_NOT_FOUND');
  }

  if (!cafe.isActive) {
    throw new ApiError(403, 'Menu unavailable', null, 'MENU_UNAVAILABLE');
  }

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { cafeId: cafe.id },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        order: true,
        parentId: true,
        sectionKey: true,
      },
    }),
    prisma.product.findMany({
      where: { cafeId: cafe.id, available: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        categoryId: true,
        order: true,
      },
    }),
  ]);

  const productsByCategory = new Map();

  for (const product of products) {
    const key = product.categoryId;

    if (!productsByCategory.has(key)) {
      productsByCategory.set(key, []);
    }

    productsByCategory.get(key).push(product);
  }

  const menuUi = normalizeMenuUi(cafe.menuUi);
  const categoryTree = buildPublicTree(categories, productsByCategory);
  const sections = buildPublicSections(categoryTree, menuUi);

  return {
    cafeId: cafe.id,
    data: {
      cafe: {
        name: cafe.name,
        description: cafe.description || '',
        logo: cafe.logo || '',
        cover: cafe.cover || categories.find((category) => category.image)?.image || '',
        address: cafe.address || '',
        phone: cafe.phone || '',
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        menuUi,
      },
      categories: categoryTree,
      sections,
    },
  };
}
