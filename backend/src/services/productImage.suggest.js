import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const RESULT_TTL_MS = 6 * 60 * 60 * 1000;
const LIBRARY_TTL_MS = 5 * 60 * 1000;
const RESULT_CACHE_MAX = 500;
const MATCH_MIN_SCORE = 86;
const LIBRARY_BROWSE_MAX = 500;

const resultCache = new Map();
let libraryState = {
  expiresAt: 0,
  items: [],
  byId: new Map(),
  /** @type {Map<string, string[]>} token -> media ids */
  inverted: new Map(),
};

const FR_TO_EN = [
  [/tajine|tagine/gi, 'tagine'],
  [/couscous/gi, 'couscous'],
  [/brochette/gi, 'kebab'],
  [/poulet/gi, 'chicken'],
  [/boeuf|bœuf/gi, 'beef'],
  [/agneau/gi, 'lamb'],
  [/poisson/gi, 'fish'],
  [/crevette|shrimp|prawn/gi, 'shrimp'],
  [/salade/gi, 'salad'],
  [/soupe/gi, 'soup'],
  [/dessert/gi, 'dessert'],
  [/gateau|gâteau/gi, 'cake'],
  [/glace|glaces/gi, 'ice cream'],
  [/jus\b/gi, 'juice'],
  [/thé|the\b/gi, 'tea'],
  [/café|cafe/gi, 'coffee'],
  [/lait/gi, 'milk'],
  [/chocolat/gi, 'chocolate'],
  [/fromage/gi, 'cheese'],
  [/oeuf|œuf/gi, 'egg'],
  [/pain/gi, 'bread'],
  [/frites/gi, 'fries'],
  [/sandwich/gi, 'sandwich'],
  [/pizza/gi, 'pizza'],
  [/burger|hamburger/gi, 'burger'],
  [/pates|pâtes|pasta/gi, 'pasta'],
  [/riz/gi, 'rice'],
  [/espresso|expresso/gi, 'espresso'],
  [/cappuccino|capuccino/gi, 'cappuccino'],
  [/latte/gi, 'latte'],
  [/smoothie/gi, 'smoothie'],
  [/omelette|omelet/gi, 'omelette'],
  [/croissant/gi, 'croissant'],
  [/menthe|mint/gi, 'mint'],
  [/orange/gi, 'orange'],
  [/citron|lemon/gi, 'lemon'],
  [/saumon|salmon/gi, 'salmon'],
  [/steak/gi, 'steak'],
  [/nugget/gi, 'nugget'],
  [/waffle|gaufre/gi, 'waffle'],
  [/pancake/gi, 'pancake'],
  [/tiramisu/gi, 'tiramisu'],
  [/brownie/gi, 'brownie'],
  [/cheesecake/gi, 'cheesecake'],
  [/margaritta|margarita/gi, 'margherita'],
  [/shawarma|chawarma/gi, 'shawarma'],
  [/kefta|kofta/gi, 'meatball'],
];

const STOPWORDS = new Set([
  'the',
  'and',
  'with',
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'un',
  'une',
  'au',
  'aux',
  'et',
  'a',
  'à',
  'of',
  'in',
  'on',
  'for',
  'hot',
  'iced',
  'fresh',
  'house',
  'special',
]);

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

export function normalizeSearchName(name = '') {
  let text = String(name || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  for (const [pattern, replacement] of FR_TO_EN) {
    text = text.replace(pattern, replacement);
  }

  return text.slice(0, 80);
}

function tokenize(name = '') {
  return normalizeSearchName(name)
    .split(/[\s/-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function looksLikeCafe(query, sectionKey) {
  if (sectionKey === 'cafe') return true;
  if (sectionKey === 'restaurant') return false;
  return /cafe|café|coffee|latte|espresso|cappuccino|thé|tea|jus|juice|boisson|drink|smoothie|matcha|mocha/i.test(
    query,
  );
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

function resultCacheGet(key) {
  const entry = resultCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    resultCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function resultCacheSet(key, value) {
  while (resultCache.size >= RESULT_CACHE_MAX) {
    const oldest = resultCache.keys().next().value;
    resultCache.delete(oldest);
  }
  resultCache.set(key, { value, expiresAt: Date.now() + RESULT_TTL_MS });
}

function rebuildIndex(items) {
  const byId = new Map();
  const inverted = new Map();

  for (const item of items) {
    const id = String(item?.id || '').trim();
    if (!id || !item?.image) continue;
    const title = String(item.title || item.name || '').trim();
    const normalizedTitle = normalizeSearchName(title);
    const tokens = tokenize(title);
    const record = {
      ...item,
      id,
      title,
      normalizedTitle,
      tokens,
      section: item.section || null,
    };
    byId.set(id, record);

    for (const token of tokens) {
      if (!inverted.has(token)) inverted.set(token, []);
      inverted.get(token).push(id);
    }
  }

  libraryState = {
    expiresAt: Date.now() + LIBRARY_TTL_MS,
    items: [...byId.values()],
    byId,
    inverted,
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
    inverted: new Map(),
  };
}

function toCandidate(item, source = 'menu-media') {
  if (!item?.image) return null;
  return {
    imageUrl: String(item.image).trim(),
    source,
    label: item.title || item.name || '',
    mediaId: String(item.id),
    // Already hosted by Menu Media / TheMealDB — no Cloudinary re-upload.
    reuseUrl: true,
  };
}

function scoreCandidate(queryNorm, queryTokens, item) {
  const title = item.normalizedTitle || '';
  if (!queryNorm || !title) return 0;
  if (title === queryNorm) return 100;
  if (title.includes(queryNorm) || queryNorm.includes(title)) return 92;

  // Any query token found as substring in title (e.g. "pizza" → "pizza margherita")
  if (queryTokens.length) {
    const titleHits = queryTokens.filter((token) => title.includes(token));
    if (titleHits.length === queryTokens.length) return 90;
    if (titleHits.length >= 1 && titleHits.length / queryTokens.length >= 0.5) {
      return 70 + Math.round((titleHits.length / queryTokens.length) * 15);
    }
  }

  if (!queryTokens.length || !item.tokens?.length) return 0;

  const itemSet = new Set(item.tokens);
  const hits = queryTokens.filter((token) => itemSet.has(token));
  if (!hits.length) return 0;

  if (hits.length === queryTokens.length) return 90;
  if (hits.length >= 2 && hits.length / queryTokens.length >= 0.75) return 86;
  if (hits.length === 1 && queryTokens.length === 1) return 80;

  return 0;
}

function applySectionBias(score, item, preferCafe) {
  if (!score) return 0;
  let next = score;
  if (item.section === 'cafe' && preferCafe) next += 2;
  if (item.section === 'restaurant' && !preferCafe) next += 2;
  if (item.section && preferCafe && item.section !== 'cafe') next -= 8;
  if (item.section && !preferCafe && item.section !== 'restaurant') next -= 8;
  return next;
}

function matchInIndex(productName, sectionKey, description = '') {
  const queryNorm = normalizeSearchName(productName);
  const queryTokens = tokenize(productName);
  if (!queryNorm) return null;

  const descTokens = tokenize(description);
  const preferCafe = looksLikeCafe(`${productName} ${description}`, sectionKey);
  const candidateIds = new Set();

  const seedTokens = queryTokens.length ? queryTokens : descTokens;
  if (seedTokens.length) {
    for (const token of seedTokens) {
      const ids = libraryState.inverted.get(token) || [];
      for (const id of ids) candidateIds.add(id);
    }
  } else {
    for (const item of libraryState.items) candidateIds.add(item.id);
  }

  let best = null;
  let bestScore = 0;

  for (const id of candidateIds) {
    const item = libraryState.byId.get(id);
    if (!item) continue;

    let score = scoreCandidate(queryNorm, queryTokens, item);
    if (!score && descTokens.length) {
      const combined = scoreCandidate(
        normalizeSearchName(`${productName} ${description}`),
        [...queryTokens, ...descTokens],
        item,
      );
      const nameHit = queryTokens.some(
        (token) => item.normalizedTitle?.includes(token) || item.tokens?.includes(token),
      );
      if (combined && nameHit) score = Math.min(combined, 88);
    }
    if (!score) continue;

    score = applySectionBias(score, item, preferCafe);

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (!best || bestScore < MATCH_MIN_SCORE) return null;
  return toCandidate(best);
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
 * Fast batch resolve: one library fetch (cached), local inverted-index match.
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

  for (const product of list) {
    const cacheKey = `${product.sectionKey || 'any'}::${normalizeSearchName(product.name)}::${normalizeSearchName(product.description).slice(0, 40)}`;
    const cached = resultCacheGet(cacheKey);
    if (cached !== undefined) {
      result.set(product.id, cached);
      continue;
    }

    const hit =
      matchInIndex(product.name, product.sectionKey, product.description) ||
      pollinationsFallback(product.name, product.sectionKey);
    resultCacheSet(cacheKey, hit);
    result.set(product.id, hit);
  }

  return result;
}

/**
 * Resolve an image for a product name (local index, no LLM).
 */
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

/**
 * Browse Menu Media library for the picker UI.
 * Returns the full filtered set (up to LIBRARY_BROWSE_MAX) so Scanosh mirrors the API catalog.
 */
export async function listMediaLibrary({
  section = '',
  search = '',
  limit = LIBRARY_BROWSE_MAX,
  refresh = false,
} = {}) {
  await ensureLibraryLoaded({ force: Boolean(refresh) });
  const q = normalizeSearchName(search);
  const tokens = tokenize(search);
  const sectionFilter = section === 'cafe' || section === 'restaurant' ? section : '';

  let items = libraryState.items;
  if (sectionFilter) {
    items = items.filter((item) => item.section === sectionFilter);
  }

  if (q) {
    const ranked = items
      .map((item) => ({
        item,
        score: scoreCandidate(q, tokens, item),
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

/**
 * Ranked candidates for a product (for manual picker).
 * Only real text matches — never inflate score with section alone.
 */
export async function listImageCandidatesForName(productName, { sectionKey = null, limit = 24 } = {}) {
  await ensureLibraryLoaded();
  const queryNorm = normalizeSearchName(productName);
  const queryTokens = tokenize(productName);
  const preferCafe = looksLikeCafe(productName, sectionKey);
  const PICKER_MIN_SCORE = 50;

  const scored = libraryState.items
    .map((item) => {
      let score = scoreCandidate(queryNorm, queryTokens, item);
      if (!score && queryNorm && item.normalizedTitle?.includes(queryNorm)) score = 70;
      // Soft typo help: margaritta ≈ margherita
      if (!score && queryTokens.length === 1 && queryTokens[0].length >= 5) {
        const token = queryTokens[0];
        for (const titleToken of item.tokens || []) {
          if (titleToken.startsWith(token.slice(0, 4)) || token.startsWith(titleToken.slice(0, 4))) {
            if (Math.abs(titleToken.length - token.length) <= 2) {
              score = 62;
              break;
            }
          }
        }
      }
      score = applySectionBias(score, item, preferCafe);
      return { item, score };
    })
    .filter((row) => row.score >= PICKER_MIN_SCORE)
    .sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title)));

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
