import { getPublicDemoMenu } from '../services/menu.service.js';
import { DEMO_MENU_SLUG, getPublicMenuUrl } from '../utils/constants.js';

let cachedSlug = '';
let inflight = null;

export function getDemoMenuUrl(slug = cachedSlug || DEMO_MENU_SLUG) {
  return getPublicMenuUrl(slug) || `/menu/${slug}`;
}

export function clearDemoMenuCache() {
  cachedSlug = '';
  inflight = null;
}

export async function resolveDemoMenuUrl() {
  if (cachedSlug) {
    return getDemoMenuUrl(cachedSlug);
  }

  if (!inflight) {
    inflight = getPublicDemoMenu()
      .then((demo) => {
        cachedSlug = demo?.slug || DEMO_MENU_SLUG;
        return getDemoMenuUrl(cachedSlug);
      })
      .catch(() => getDemoMenuUrl(DEMO_MENU_SLUG));
  }

  return inflight;
}
