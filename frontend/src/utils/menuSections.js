import { normalizeSectionVisibility } from './menuUi.js';

export const DEFAULT_SECTION_DEFS = [
  { key: 'restaurant', name: 'Restaurant' },
  { key: 'cafe', name: 'Café' },
];

export const DEFAULT_SECTION_KEYS = DEFAULT_SECTION_DEFS.map((item) => item.key);

export const MAX_MENU_SECTIONS = 12;
export const SECTION_KEY_MAX_LENGTH = 40;

const SECTION_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function slugifySectionKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SECTION_KEY_MAX_LENGTH);
}

export function isMenuSectionKey(value) {
  const key = String(value || '').toLowerCase().trim();
  return Boolean(key) && key.length <= SECTION_KEY_MAX_LENGTH && SECTION_KEY_RE.test(key);
}

export function isLegacyCategoryId(value) {
  return UUID_RE.test(String(value || ''));
}

export function sectionIcon(sectionKey) {
  if (sectionKey === 'cafe') {
    return 'local_cafe';
  }

  if (sectionKey === 'restaurant') {
    return 'restaurant';
  }

  return 'grid_view';
}

export function getActiveSections(menu) {
  const visibility = normalizeSectionVisibility(menu?.cafe?.menuUi?.sectionVisibility);

  return (menu?.sections || []).filter(
    (section) => section.children?.length > 0 && visibility[section.key] !== false,
  );
}

export function getSectionMenuDestination(menu, paths) {
  const activeSections = getActiveSections(menu);

  if (activeSections.length > 1) {
    return paths.sections;
  }

  if (activeSections.length === 1) {
    const section = activeSections[0];
    const firstCategory = section.children?.[0];

    if (firstCategory?.id) {
      return paths.sectionCategory(section.key, firstCategory.id);
    }

    return paths.section(section.key);
  }

  return paths.categories;
}

export function countSectionProducts(section) {
  return (section?.children || []).reduce(
    (total, category) => total + (category.products?.length || 0),
    0,
  );
}

export function findSectionByKey(menu, sectionKey) {
  return getActiveSections(menu).find((section) => String(section.key) === String(sectionKey)) || null;
}

export function resolveSectionCategory(section, categoryId) {
  const children = section?.children || [];

  if (!children.length) {
    return { category: null, products: [], missing: true };
  }

  if (!categoryId) {
    const category = children[0];
    return { category, products: category.products || [], missing: false };
  }

  const category = children.find((item) => String(item.id) === String(categoryId));

  if (!category) {
    return { category: null, products: [], missing: true };
  }

  return { category, products: category.products || [], missing: false };
}

export function findSectionKeyForCategory(menu, categoryId) {
  for (const section of getActiveSections(menu)) {
    const match = section.children?.find((child) => String(child.id) === String(categoryId));

    if (match) {
      return section.key;
    }
  }

  return null;
}

export function getFlatCatalogCategories(categories) {
  const items = [];

  for (const root of categories || []) {
    if (root.sectionKey && root.children?.length) {
      items.push(...root.children);
      continue;
    }

    if (!root.sectionKey) {
      items.push(root);
    }
  }

  return items;
}

export function resolveFlatSelection(categories, categoryId) {
  const list = getFlatCatalogCategories(categories);

  if (!list.length) {
    return { category: null, products: [], missing: false };
  }

  if (!categoryId) {
    const category = list[0];
    return { category, products: category.products || [], missing: false };
  }

  const matched = list.find((item) => String(item.id) === String(categoryId));

  if (!matched) {
    return { category: null, products: [], missing: true };
  }

  return { category: matched, products: matched.products || [], missing: false };
}
