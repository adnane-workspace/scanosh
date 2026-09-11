import { DEMO_MENU_SLUG, getPublicMenuUrl } from '../utils/constants.js';

export function getDemoMenuUrl() {
  return getPublicMenuUrl(DEMO_MENU_SLUG) || `/menu/${DEMO_MENU_SLUG}`;
}
