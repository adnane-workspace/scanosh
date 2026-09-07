export const DEFAULT_SECTION_DEFS = [
  { key: 'restaurant', name: 'Restaurant' },
  { key: 'cafe', name: 'Café' },
];

export const DEFAULT_SECTION_KEYS = DEFAULT_SECTION_DEFS.map((item) => item.key);

export const SECTIONS_MAX_DEPTH = 2;
export const MAX_MENU_SECTIONS = 12;
export const SECTION_KEY_MAX_LENGTH = 40;

const SECTION_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
