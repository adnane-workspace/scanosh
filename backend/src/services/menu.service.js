import { env } from '../config/env.js';
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

function buildOutline(categories, categoryIdsWithProducts) {
  const byParent = groupByParent(categories);

  function buildNode(category, inheritedSectionKey = null) {
    const menuSectionKey = category.sectionKey || inheritedSectionKey;
    const children = (byParent.get(category.id) || [])
      .map((child) => buildNode(child, menuSectionKey))
      .filter(Boolean);

    if (children.length === 0 && !categoryIdsWithProducts.has(category.id)) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      image: category.image || '',
      description: category.description || '',
      parentId: category.parentId || null,
      sectionKey: category.sectionKey || null,
      menuSectionKey,
      children,
      products: [],
    };
  }

  return (byParent.get('') || []).map(buildNode).filter(Boolean);
}

function findOutlineNode(nodes, categoryId) {
  for (const node of nodes || []) {
    if (String(node.id) === String(categoryId)) {
      return node;
    }

    const nested = findOutlineNode(node.children, categoryId);

    if (nested) {
      return nested;
    }
  }

  return null;
}

function toPublicCafe(cafe, categories, { contact = false, feedback = false } = {}) {
  const menuUi = normalizeMenuUi(cafe.menuUi);
  if (!menuUi.wifi.enabled || !menuUi.wifi.ssid) {
    menuUi.wifi = { enabled: false, ssid: '', password: '', security: menuUi.wifi.security };
  } else if (menuUi.wifi.security === 'nopass') {
    menuUi.wifi.password = '';
  }
  const payload = {
    name: cafe.name,
    description: cafe.description || '',
    logo: cafe.logo || '',
    cover: cafe.cover || categories.find((category) => category.image)?.image || '',
    menuUi,
  };

  if (contact) {
    payload.address = cafe.address || '';
    payload.phone = cafe.phone || '';
    payload.latitude = cafe.latitude;
    payload.longitude = cafe.longitude;
  }

  if (feedback) {
    payload.feedbackEnabled = cafe.feedbackEnabled !== false;
    payload.googleReviewUrl = cafe.feedbackEnabled === false ? '' : cafe.googleReviewUrl || '';
  }

  return payload;
}

function firstChildRef(section) {
  const first = section.children?.[0];
  return first?.id ? [{ id: first.id }] : [];
}

async function loadCafeOutline(slug) {
  const cached = readPublicMenuCache(slug, 'outline');

  if (cached) {
    const { cafe, categories, categoryIds, productCount } = cached.data;
    return {
      cafe,
      categories,
      productCount,
      tree: buildOutline(categories, new Set(categoryIds)),
    };
  }

  const [cafeRecord, productGroups] = await Promise.all([
    prisma.cafe.findUnique({
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
        feedbackEnabled: true,
        googleReviewUrl: true,
        categories: {
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            parentId: true,
            sectionKey: true,
          },
        },
      },
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { cafe: { slug }, available: true },
      _count: { _all: true },
    }),
  ]);

  if (!cafeRecord) {
    throw new ApiError(404, 'Menu not found', null, 'MENU_NOT_FOUND');
  }

  if (!cafeRecord.isActive) {
    throw new ApiError(403, 'Menu unavailable', null, 'MENU_UNAVAILABLE');
  }

  const { categories, ...cafe } = cafeRecord;
  const categoryIds = productGroups.map((group) => group.categoryId);
  const productCount = productGroups.reduce((sum, group) => sum + (group._count?._all || 0), 0);

  writePublicMenuCache(
    slug,
    cafe.id,
    { cafe, categories, categoryIds, productCount },
    'outline',
  );

  return {
    cafe,
    categories,
    productCount,
    tree: buildOutline(categories, new Set(categoryIds)),
  };
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

export async function getPublicMenuLanding(slug) {
  const cached = readPublicMenuCache(slug, 'landing');

  if (cached) {
    return cached.data;
  }

  const { cafe, categories, tree, productCount } = await loadCafeOutline(slug);
  const sections = buildPublicSections(tree, normalizeMenuUi(cafe.menuUi));

  const data = {
    cafe: toPublicCafe(cafe, categories, { contact: true }),
    productCount,
    sections: sections.map((section) => ({
      key: section.key,
      children: firstChildRef(section),
    })),
  };

  writePublicMenuCache(slug, cafe.id, data, 'landing');
  return data;
}

export async function getPublicMenuSections(slug) {
  const cached = readPublicMenuCache(slug, 'sections');

  if (cached) {
    return cached.data;
  }

  const { cafe, categories, tree } = await loadCafeOutline(slug);
  const sections = buildPublicSections(tree, normalizeMenuUi(cafe.menuUi));

  const data = {
    cafe: toPublicCafe(cafe, categories),
    sections: sections.map((section) => ({
      key: section.key,
      name: section.name,
      image: section.image || '',
      description: section.description || '',
      children: firstChildRef(section),
    })),
  };

  writePublicMenuCache(slug, cafe.id, data, 'sections');
  return data;
}

export async function getPublicMenuCategory(slug, { section = '', categoryId = '' } = {}) {
  const subKey = `category|${section}|${categoryId}`;
  const cached = readPublicMenuCache(slug, subKey);

  if (cached) {
    return cached.data;
  }

  const { cafe, categories, tree } = await loadCafeOutline(slug);
  const menuUi = normalizeMenuUi(cafe.menuUi);
  let loadedCategoryId = null;

  if (categoryId) {
    const node = findOutlineNode(tree, categoryId);

    if (node) {
      const rows = await prisma.product.findMany({
        where: { cafeId: cafe.id, categoryId, available: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
        },
      });

      node.products = rows
        .filter((product) => product.image)
        .map((product) => toPublicProduct(product, { hideDescription: node.menuSectionKey === 'cafe' }));
      loadedCategoryId = categoryId;
    }
  }

  const sections = buildPublicSections(tree, menuUi);
  const visibleKeys = new Set(sections.map((item) => item.key));
  const visibleTree = tree.filter((node) => !node.sectionKey || visibleKeys.has(node.sectionKey));

  const categorySections = slimCategorySections(sections);
  const categoryRoots = slimCategoryRoots(visibleTree);

  if (section) {
    for (const root of categoryRoots) {
      root.products = [];

      for (const child of root.children) {
        child.products = [];
      }
    }
  } else {
    for (const item of categorySections) {
      for (const child of item.children) {
        child.products = [];
      }
    }
  }

  const data = {
    cafe: toPublicCafe(cafe, categories, { feedback: true }),
    categories: categoryRoots,
    sections: categorySections,
    loadedCategoryId,
  };

  writePublicMenuCache(slug, cafe.id, data, subKey);
  return data;
}

function slimCategoryRoots(tree) {
  return tree.map((root) => ({
    id: root.id,
    name: root.name,
    sectionKey: root.sectionKey,
    products: root.products || [],
    children: (root.children || []).map((child) => ({
      id: child.id,
      name: child.name,
      products: child.products || [],
    })),
  }));
}

function slimCategorySections(sections) {
  return sections.map((section) => ({
    key: section.key,
    name: section.name,
    children: (section.children || []).map((child) => ({
      id: child.id,
      name: child.name,
      products: child.products || [],
    })),
  }));
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
      feedbackEnabled: true,
      googleReviewUrl: true,
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
        feedbackEnabled: cafe.feedbackEnabled !== false,
        googleReviewUrl: cafe.feedbackEnabled === false ? '' : cafe.googleReviewUrl || '',
        menuUi,
      },
      categories: categoryTree,
      sections,
    },
  };
}

export async function getPublicDemoMenu() {
  const cafe = await prisma.cafe.findFirst({
    where: { isDemo: true, isActive: true },
    select: { slug: true, name: true },
  });

  if (cafe) {
    return { slug: cafe.slug, name: cafe.name };
  }

  const slug = env.DEMO_MENU_SLUG || 'seven';
  return { slug, name: '' };
}
