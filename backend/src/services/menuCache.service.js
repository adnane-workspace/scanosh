const DEV_TTL_MS = 5 * 60 * 1000;
const PROD_TTL_MS = 30 * 1000;
const menus = new Map();

function cacheEnabled() {
  return process.env.NODE_ENV !== 'test';
}

function getTtlMs() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL ? PROD_TTL_MS : DEV_TTL_MS;
}

function buildKey(slug, subKey = 'full') {
  return subKey && subKey !== 'full' ? `${slug}|${subKey}` : slug;
}

export function readPublicMenuCache(slug, subKey = 'full') {
  if (!cacheEnabled()) {
    return null;
  }
  const key = buildKey(slug, subKey);
  const entry = menus.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.at > getTtlMs()) {
    menus.delete(key);
    return null;
  }

  return entry;
}

export function writePublicMenuCache(slug, cafeId, data, subKey = 'full') {
  if (!cacheEnabled()) {
    return;
  }

  menus.set(buildKey(slug, subKey), {
    cafeId,
    slug,
    data,
    at: Date.now(),
  });
}

export function invalidatePublicMenu(cafeId, slugs = []) {
  const slugSet = new Set(slugs.filter(Boolean));

  for (const [key, entry] of menus) {
    if (
      (cafeId && entry.cafeId === cafeId) ||
      (entry.slug && slugSet.has(entry.slug)) ||
      slugSet.has(key)
    ) {
      menus.delete(key);
    }
  }
}
