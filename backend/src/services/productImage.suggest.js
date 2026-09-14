import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import {
  assignLibraryMatches,
  indexMediaItem,
  looksLikeCafe,
  MATCH_MIN_SCORE,
  normalizeSearchName,
  PICKER_MIN_SCORE,
  rankMediaItems,
  scoreMediaMatch,
} from './productImage.match.js';

export { normalizeSearchName };

const LIBRARY_TTL_MS = 5 * 60 * 1000;
const LIBRARY_BROWSE_MAX = 500;

let libraryState = {
  expiresAt: 0,
  items: [],
  byId: new Map(),
};

export function isProductImageSuggestEnabled() {
  const raw = String(env.PRODUCT_IMAGE_SUGGEST ?? '1').trim().toLowerCase();
  return raw !== '0' && raw !== 'false' && raw !== 'off';
}

function allowPollinationsFallback() {
  const raw = String(env.PRODUCT_IMAGE_POLLINATIONS ?? '0').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on';
}

function menuMediaBaseUrl() {
  return String(env.MENU_MEDIA_API_URL || 'https://cafe-restau-images.vercel.app')
    .trim()
    .replace(/\/+$/, '');
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function buildPollinationsUrl(query, sectionKey) {
  const subject =
    sectionKey === 'cafe'
      ? `${query || 'coffee'} drink cafe menu photo`
      : `${query || 'restaurant dish'} plated food menu photo`;
  const prompt = encodeURIComponent(
    `appetizing professional food photography of ${subject}, soft restaurant lighting, high detail, no text`,
  );
  return `https://image.pollinations.ai/p/${prompt}?width=768&height=768&nologo=true&seed=${Math.abs(
    hashString(query || subject),
  )}`;
}

function rebuildIndex(items) {
  const byId = new Map();

  for (const item of items) {
    const id = String(item?.id || '').trim();
    if (!id || !item?.image) continue;
    const record = indexMediaItem({ ...item, id });
    if (!record.title) continue;
    byId.set(id, record);
  }

  libraryState = {
    expiresAt: Date.now() + LIBRARY_TTL_MS,
    items: [...byId.values()],
    byId,
  };
}

async function ensureLibraryLoaded({ force = false } = {}) {
  if (!force && libraryState.expiresAt > Date.now() && libraryState.items.length) {
    return libraryState;
  }

  const url = new URL(`${menuMediaBaseUrl()}/library`);
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Menu media library HTTP ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  rebuildIndex(items);
  return libraryState;
}

export function invalidateMediaLibraryCache() {
  libraryState = {
    expiresAt: 0,
    items: [],
    byId: new Map(),
  };
}

function pollinationsFallback(productName, sectionKey) {
  if (!allowPollinationsFallback()) return null;
  const query = normalizeSearchName(productName);
  if (!query) return null;
  const cafeLike = looksLikeCafe(query, sectionKey);
  return {
    imageUrl: buildPollinationsUrl(query, cafeLike ? 'cafe' : sectionKey),
    source: 'pollinations',
    label: query,
    reuseUrl: false,
  };
}

/**
 * One library fetch, unique assignment (same product name may share a photo).
 * @returns {Map<string, object|null>}
 */
export async function findProductImageCandidatesBatch(products = []) {
  const list = Array.isArray(products)
    ? products.filter((p) => p?.id && p?.name).map((p) => ({
        id: String(p.id),
        name: p.name,
        description: p.description || '',
        sectionKey: p.sectionKey || null,
      }))
    : [];

  const result = new Map();
  if (!list.length) return result;

  try {
    await ensureLibraryLoaded();
  } catch (error) {
    console.error('[product-image] library load failed:', error?.message || error);
    for (const product of list) result.set(product.id, null);
    return result;
  }

  const assigned = assignLibraryMatches(list, libraryState.items, { minScore: MATCH_MIN_SCORE });
  for (const product of list) {
    const hit = assigned.get(product.id) || pollinationsFallback(product.name, product.sectionKey);
    result.set(product.id, hit);
  }
  return result;
}

export async function findProductImageCandidate(
  productName,
  { sectionKey = null, cafeId = null, productId = 'single', description = '' } = {},
) {
  if (!isProductImageSuggestEnabled()) {
    throw new ApiError(503, 'Product image suggest is disabled', null, 'IMAGE_SUGGEST_DISABLED');
  }

  const query = normalizeSearchName(productName);
  if (!query) return null;

  const map = await findProductImageCandidatesBatch([
    { id: productId || 'single', name: productName, description, sectionKey },
  ]);
  return map.get(String(productId || 'single')) || null;
}

function itemToPickerCard(item, score = null) {
  return {
    id: String(item.id),
    title: item.title || item.name || '',
    section: item.section || null,
    image: item.image || '',
    score,
  };
}

export async function listMediaLibrary({
  section = '',
  search = '',
  limit = LIBRARY_BROWSE_MAX,
  refresh = false,
} = {}) {
  await ensureLibraryLoaded({ force: Boolean(refresh) });
  const sectionFilter = section === 'cafe' || section === 'restaurant' ? section : '';

  let items = libraryState.items;
  if (sectionFilter) {
    items = items.filter((item) => item.section === sectionFilter);
  }

  if (String(search || '').trim()) {
    const ranked = items
      .map((item) => ({
        item,
        score: scoreMediaMatch({ queryName: search, item, sectionKey: sectionFilter || null }),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title)));

    const max = Math.min(Math.max(Number(limit) || LIBRARY_BROWSE_MAX, 1), LIBRARY_BROWSE_MAX);
    return {
      total: libraryState.items.length,
      count: ranked.length,
      items: ranked.slice(0, max).map((row) => itemToPickerCard(row.item, row.score)),
    };
  }

  items = [...items].sort((a, b) => String(a.title).localeCompare(String(b.title)));

  const max = Math.min(Math.max(Number(limit) || LIBRARY_BROWSE_MAX, 1), LIBRARY_BROWSE_MAX);
  return {
    total: libraryState.items.length,
    count: items.length,
    items: items.slice(0, max).map((item) => itemToPickerCard(item)),
  };
}

export async function listImageCandidatesForName(productName, { sectionKey = null, limit = 24 } = {}) {
  await ensureLibraryLoaded();
  const scored = rankMediaItems(productName, libraryState.items, {
    sectionKey,
    minScore: PICKER_MIN_SCORE,
  });

  const max = Math.min(Math.max(Number(limit) || 24, 1), 48);
  return {
    productName,
    sectionKey,
    items: scored.slice(0, max).map((row) => itemToPickerCard(row.item, row.score)),
  };
}

export async function getMediaItemById(mediaId) {
  await ensureLibraryLoaded();
  return libraryState.byId.get(String(mediaId || '')) || null;
}
