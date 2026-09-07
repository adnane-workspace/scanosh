import { DEFAULT_SECTION_KEYS, isMenuSectionKey } from './menuSections.js';

export const MENU_IMPORT_MERGE_LEVELS = ['word', 'sentence', 'paragraph'];
export const MENU_IMPORT_MERGE_LEVEL_SET = new Set(MENU_IMPORT_MERGE_LEVELS);
export const MENU_IMPORT_MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const DEFAULT_DRAFT_SECTION_KEY = DEFAULT_SECTION_KEYS[0] || 'restaurant';

export function normalizeMergeLevel(value) {
  return MENU_IMPORT_MERGE_LEVEL_SET.has(value) ? value : 'paragraph';
}

export function resolveDraftSectionKey(value) {
  return isMenuSectionKey(value) ? String(value).trim().toLowerCase() : DEFAULT_DRAFT_SECTION_KEY;
}
