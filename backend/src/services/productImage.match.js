export const MATCH_MIN_SCORE = 78;
export const PICKER_MIN_SCORE = 48;

const GENERIC_TOKENS = new Set([
  'juice',
  'coffee',
  'tea',
  'salad',
  'soup',
  'pizza',
  'burger',
  'sandwich',
  'pasta',
  'rice',
  'cake',
  'bread',
  'chicken',
  'beef',
  'fish',
  'dessert',
  'smoothie',
  'milkshake',
  'water',
  'soda',
  'milk',
  'chocolate',
  'cheese',
  'egg',
  'fries',
]);

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
  'of',
  'in',
  'on',
  'for',
  'fresh',
  'house',
  'special',
  'maison',
  'style',
  'served',
  'made',
]);

/** Longer phrases first. Applied after accent-stripping. */
const PHRASES = [
  [/pain au chocolat|chocolatine/gi, 'painauchocolat'],
  [/the a la menthe|the menthe|atay nana|\batay\b/gi, 'minttea'],
  [/bubble tea|\bboba\b/gi, 'bubbletea'],
  [/quatre fromages|4 fromages|4 fromage/gi, 'quatrefromages'],
  [/flat white/gi, 'flatwhite'],
  [/cold brew|coldbrew|cafe infuse a froid|coffee infuse a froid/gi, 'coldbrew'],
  [/thai tea|the thai/gi, 'thaitea'],
  [/cafe glace|coffee glace|iced coffee/gi, 'icedcoffee'],
  [/latte glace|iced latte/gi, 'icedlatte'],
  [/the glace|iced tea/gi, 'icedtea'],
  [/expresso|espresso/gi, 'espresso'],
  [/cappuccino|capuccino|cappucino/gi, 'cappuccino'],
  [/citronnade|limonade|lemonade/gi, 'lemonade'],
  [/jus d orange|orange pressee|orange juice/gi, 'orangejuice'],
  [/petit dejeuner|petit-dejeuner|breakfast/gi, 'breakfast'],
  [/ice cream/gi, 'icecream'],
  [/hot chocolate|chocolat chaud/gi, 'hotchocolate'],
];

const WORD_MAP = [
  [/قهوة/g, 'coffee'],
  [/شاي/g, 'tea'],
  [/عصير/g, 'juice'],
  [/برتقال/g, 'orange'],
  [/نعناع/g, 'mint'],
  [/ليمون|حامض/g, 'lemon'],
  [/\btajine\b|\btagine\b/gi, 'tagine'],
  [/\bbrochette\b/gi, 'kebab'],
  [/\bpoulet\b/gi, 'chicken'],
  [/\bboeuf\b|\bbeef\b/gi, 'beef'],
  [/\bagneau\b/gi, 'lamb'],
  [/\bpoisson\b/gi, 'fish'],
  [/\bcrevette\b|\bprawn\b/gi, 'shrimp'],
  [/\bsalade\b/gi, 'salad'],
  [/\bsoupe\b/gi, 'soup'],
  [/\bgateau\b/gi, 'cake'],
  [/\bglaces?\b/gi, 'icecream'],
  [/\bjus\b/gi, 'juice'],
  [/\bthe\b/gi, 'tea'],
  [/\bcafe\b|\bcoffee\b/gi, 'coffee'],
  [/\blait\b/gi, 'milk'],
  [/\bchocolat\b/gi, 'chocolate'],
  [/\bfromages?\b/gi, 'cheese'],
  [/\boeufs?\b/gi, 'egg'],
  [/\bpain\b/gi, 'bread'],
  [/\bfrites\b/gi, 'fries'],
  [/\bpates\b|\bpasta\b/gi, 'pasta'],
  [/\briz\b/gi, 'rice'],
  [/\bmenthe\b/gi, 'mint'],
  [/\bcitron\b|\blemon\b/gi, 'lemon'],
  [/\bsaumon\b/gi, 'salmon'],
  [/\bgaufre\b/gi, 'waffle'],
  [/\bmargaritta\b|\bmargarita\b/gi, 'margherita'],
  [/\bchawarma\b/gi, 'shawarma'],
  [/\bkefta\b|\bkofta\b/gi, 'kefta'],
  [/\bpamplemousse\b/gi, 'grapefruit'],
  [/\bpasteque\b|\bwatermelon\b/gi, 'watermelon'],
  [/\bfraise\b|\bstrawberry\b/gi, 'strawberry'],
  [/\bpomme\b|\bapple\b/gi, 'apple'],
  [/\bananas\b|\bpineapple\b/gi, 'pineapple'],
  [/\bgrenade\b|\bpomegranate\b/gi, 'pomegranate'],
  [/\bbetterave\b|\bbeet\b/gi, 'beet'],
  [/\bcarotte\b|\bcarrot\b/gi, 'carrot'],
  [/\bmangue\b|\bmango\b/gi, 'mango'],
  [/\bpoire\b|\bpear\b/gi, 'pear'],
  [/\braisin\b|\bgrape\b/gi, 'grape'],
  [/\bkiwi\b/gi, 'kiwi'],
  [/\bcerise\b|\bcherry\b/gi, 'cherry'],
  [/\bpeche\b|\bpeach\b/gi, 'peach'],
  [/\bnoisette\b|\bhazelnut\b/gi, 'hazelnut'],
  [/\bvanille\b|\bvanilla\b/gi, 'vanilla'],
  [/\bglace\b|\bglaces\b|\bglacee?\b|\bglacees\b|\biced\b/gi, 'iced'],
  [/\bbastilla\b/gi, 'pastilla'],
  [/\bmsemen\b/gi, 'msemen'],
  [/\bbeghrir\b|\bbaghrir\b/gi, 'beghrir'],
  [/\ballonge\b/gi, 'americano'],
  [/\bdecafeine\b|\bdeca\b/gi, 'decaf'],
  [/\beau\b/gi, 'water'],
];

const TOKEN_SYNONYMS = {
  espresso: ['espresso'],
  orangejuice: ['orangejuice', 'orange', 'juice'],
  minttea: ['minttea'],
  bubbletea: ['bubbletea', 'boba', 'tapioca'],
  painauchocolat: ['painauchocolat', 'chocolatine'],
  pineapple: ['pineapple', 'ananas'],
  ananas: ['pineapple', 'ananas'],
  pomegranate: ['pomegranate', 'grenade'],
  strawberry: ['strawberry', 'fraise'],
  apple: ['apple', 'pomme'],
  mango: ['mango', 'mangue'],
  watermelon: ['watermelon', 'pasteque'],
  lemonade: ['lemonade', 'lemon', 'citronnade'],
  icedlatte: ['icedlatte', 'latte', 'iced'],
  icedcoffee: ['icedcoffee', 'coffee', 'iced'],
  icedtea: ['icedtea', 'tea', 'iced'],
  coldbrew: ['coldbrew', 'coffee'],
  kefta: ['kefta', 'meatball'],
  tagine: ['tagine', 'tajine'],
  kebab: ['kebab', 'brochette', 'skewer'],
  pastilla: ['pastilla', 'bastilla'],
  americano: ['americano'],
  waffle: ['waffle', 'gaufre'],
  hazelnut: ['hazelnut', 'noisette'],
};

function stripText(name = '') {
  return String(name || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeSearchName(name = '') {
  let text = stripText(name);
  for (const [pattern, replacement] of PHRASES) {
    text = text.replace(pattern, ` ${replacement} `);
  }
  for (const [pattern, replacement] of WORD_MAP) {
    text = text.replace(pattern, ` ${replacement} `);
  }
  return text.replace(/\s+/g, ' ').trim().slice(0, 96);
}

export function tokenize(name = '') {
  const seen = new Set();
  const tokens = [];
  for (const raw of normalizeSearchName(name).split(/[\s/]+/)) {
    const token = raw.replace(/-+/g, '').trim();
    if (token.length < 3 || STOPWORDS.has(token) || seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }
  return tokens;
}

function expandToken(token) {
  return TOKEN_SYNONYMS[token] || [token];
}

function expandTokenSet(tokens = []) {
  const set = new Set();
  for (const token of tokens) {
    for (const syn of expandToken(token)) set.add(syn);
  }
  return set;
}

export function looksLikeCafe(query, sectionKey) {
  if (sectionKey === 'cafe') return true;
  if (sectionKey === 'restaurant') return false;
  return /cafe|coffee|latte|espresso|cappuccino|tea|juice|boisson|drink|smoothie|matcha|mocha|milkshake|the |jus /i.test(
    String(query || ''),
  );
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 3) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

function tokensMatch(queryToken, titleSet, titleTokens) {
  for (const syn of expandToken(queryToken)) {
    if (titleSet.has(syn)) return 'exact';
  }
  if (queryToken.length >= 5) {
    const maxDist = queryToken.length >= 8 ? 2 : 1;
    for (const titleToken of titleTokens) {
      if (Math.abs(titleToken.length - queryToken.length) > maxDist) continue;
      if (levenshtein(queryToken, titleToken) <= maxDist) return 'fuzzy';
      for (const syn of expandToken(queryToken)) {
        if (levenshtein(syn, titleToken) <= maxDist) return 'fuzzy';
      }
    }
  }
  return null;
}

function extractKeywords(description = '') {
  const text = String(description || '');
  const tagged = text.match(/mot-cl[eé]s?\s*:\s*(.+)$/i);
  if (tagged) return tagged[1].split(/[,.]/).join(' ');
  if (text.length <= 90) return text;
  return '';
}

export function indexMediaItem(item) {
  const title = String(item?.title || item?.name || '').trim();
  const description = String(item?.description || '').trim();
  const extra = extractKeywords(description);
  return {
    ...item,
    id: String(item?.id || '').trim(),
    title,
    description,
    section: item.section || null,
    normalizedTitle: normalizeSearchName(title),
    tokens: tokenize(title),
    extraTokens: extra ? tokenize(extra) : [],
  };
}

const PLAIN_MODIFIERS = new Set([
  'filtre',
  'black',
  'chaud',
  'simple',
  'classique',
  'classic',
  'maison',
  'house',
  'nature',
  'plain',
  'noir',
]);

function isGenericToken(token) {
  return GENERIC_TOKENS.has(token);
}

function rawTokens(value) {
  return stripText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export function scoreMediaMatch({
  queryName,
  queryDescription = '',
  item,
  sectionKey = null,
} = {}) {
  const queryNorm = normalizeSearchName(queryName);
  const titleNorm = item?.normalizedTitle || normalizeSearchName(item?.title || '');
  if (!queryNorm || !titleNorm) return 0;

  const queryTokens = tokenize(queryName);
  const titleTokens = item?.tokens || tokenize(item?.title || '');
  const titleSet = expandTokenSet(titleTokens);
  const extraSet = expandTokenSet(item?.extraTokens || []);
  const preferCafe = looksLikeCafe(`${queryName} ${queryDescription}`, sectionKey);

  let score = 0;
  if (stripText(queryName) === stripText(item?.title || '')) {
    score = 100;
  } else if (titleNorm === queryNorm) {
    score = 96;
  } else if (titleNorm.startsWith(queryNorm) || queryNorm.startsWith(titleNorm)) {
    const ratio =
      Math.min(titleNorm.length, queryNorm.length) / Math.max(titleNorm.length, queryNorm.length);
    score = Math.round(86 + ratio * 10);
  } else if (titleNorm.includes(queryNorm) || queryNorm.includes(titleNorm)) {
    score = 90;
  } else if (queryTokens.length) {
    let exactHits = 0;
    let fuzzyHits = 0;
    let extraHits = 0;
    const distinctive = [];
    const distinctiveHits = [];

    for (const token of queryTokens) {
      const distinctiveToken = !isGenericToken(token);
      if (distinctiveToken) distinctive.push(token);
      const hit = tokensMatch(token, titleSet, titleTokens);
      if (hit === 'exact') {
        exactHits += 1;
        if (distinctiveToken) distinctiveHits.push(token);
      } else if (hit === 'fuzzy') {
        fuzzyHits += 1;
        if (distinctiveToken) distinctiveHits.push(token);
      } else if (distinctiveToken && tokensMatch(token, extraSet, item?.extraTokens || [])) {
        extraHits += 1;
        distinctiveHits.push(token);
      }
    }

    if (distinctive.length && distinctiveHits.length === 0) {
      score = 0;
    } else {
      const covered = exactHits + fuzzyHits * 0.75 + extraHits * 0.6;
      const coverage = covered / queryTokens.length;
      if (coverage >= 1 && fuzzyHits === 0 && extraHits === 0) score = 92;
      else if (coverage >= 0.99) score = 88;
      else if (coverage >= 0.66) score = 80 + Math.round(coverage * 8);
      else if (coverage >= 0.5 && distinctiveHits.length) score = 76 + Math.round(coverage * 6);
      else if (exactHits === 1 && queryTokens.length === 1) score = isGenericToken(queryTokens[0]) ? 74 : 84;
      else score = 0;
    }

    if (score && distinctive.length && distinctiveHits.length < distinctive.length && extraHits === 0) {
      score = Math.min(score, 76);
    }
  }

  if (!score && queryDescription) {
    const descTokens = tokenize(queryDescription).filter((token) => !isGenericToken(token));
    const titleHits = descTokens.filter((token) => tokensMatch(token, titleSet, titleTokens));
    const nameHit = queryTokens.some((token) => tokensMatch(token, titleSet, titleTokens));
    if (nameHit && titleHits.length && titleHits.length / Math.max(descTokens.length, 1) >= 0.5) {
      score = 80;
    }
  }

  if (!score) return 0;

  const queryRaw = rawTokens(queryName);
  const titleRaw = rawTokens(item?.title || '');
  const rawHits = queryRaw.filter((token) =>
    titleRaw.some((titleToken) => titleToken === token || titleToken.includes(token) || token.includes(titleToken)),
  );
  if (rawHits.length) score += Math.min(18, rawHits.length * 6);

  const extraHit = queryTokens.some((token) => tokensMatch(token, extraSet, item?.extraTokens || []));
  const extraRaw = stripText(extractKeywords(item?.description || ''));
  const rawExtraHit = Boolean(extraRaw) && queryRaw.some((token) => extraRaw.includes(token));
  if (extraHit || rawExtraHit) score += 3;

  const onlyGeneric = queryTokens.length > 0 && queryTokens.every(isGenericToken);
  if (onlyGeneric) {
    const querySet = expandTokenSet(queryTokens);
    const extraTitle = titleTokens.filter((token) => !querySet.has(token));
    const allowed = extraTitle.every((token) => PLAIN_MODIFIERS.has(token));
    if (!allowed && titleNorm !== queryNorm) {
      score = Math.min(score, 70);
    }
  }

  if (item.section === 'cafe' && preferCafe) score += 3;
  else if (item.section === 'restaurant' && !preferCafe) score += 3;
  else if (item.section && preferCafe && item.section !== 'cafe') score -= 10;
  else if (item.section && !preferCafe && item.section !== 'restaurant') score -= 10;

  return Math.max(0, score);
}

function toCandidate(item, source = 'menu-media') {
  if (!item?.image) return null;
  return {
    imageUrl: String(item.image).trim(),
    source,
    label: item.title || item.name || '',
    mediaId: String(item.id),
    reuseUrl: true,
  };
}

export function pickBestMediaMatch(productName, items, { sectionKey = null, description = '', minScore = MATCH_MIN_SCORE } = {}) {
  let best = null;
  let bestScore = 0;
  for (const item of items) {
    const score = scoreMediaMatch({
      queryName: productName,
      queryDescription: description,
      item,
      sectionKey,
    });
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  if (!best || bestScore < minScore) return null;
  return { item: best, score: bestScore, candidate: toCandidate(best) };
}

/**
 * Assign each product a unique library photo (same name may share).
 * @returns {Map<string, object|null>}
 */
export function assignLibraryMatches(products = [], items = [], { minScore = MATCH_MIN_SCORE } = {}) {
  const result = new Map();
  const list = Array.isArray(products) ? products : [];
  for (const product of list) result.set(String(product.id), null);
  if (!list.length || !items.length) return result;

  const pairs = [];
  for (const product of list) {
    const name = product.name;
    for (const item of items) {
      const score = scoreMediaMatch({
        queryName: name,
        queryDescription: product.description || '',
        item,
        sectionKey: product.sectionKey || null,
      });
      if (score < minScore) continue;
      pairs.push({
        productId: String(product.id),
        nameKey: normalizeSearchName(name),
        item,
        score,
        specificity: tokenize(name).filter((token) => !isGenericToken(token)).length,
      });
    }
  }

  pairs.sort(
    (a, b) =>
      b.score - a.score ||
      b.specificity - a.specificity ||
      String(a.item.title || '').length - String(b.item.title || '').length ||
      String(a.item.title).localeCompare(String(b.item.title)),
  );

  const usedProducts = new Set();
  const mediaOwnerName = new Map();

  for (const pair of pairs) {
    if (usedProducts.has(pair.productId)) continue;
    const owner = mediaOwnerName.get(pair.item.id);
    if (owner && owner !== pair.nameKey) continue;
    usedProducts.add(pair.productId);
    mediaOwnerName.set(pair.item.id, pair.nameKey);
    result.set(pair.productId, toCandidate(pair.item));
  }

  return result;
}

export function rankMediaItems(productName, items, { sectionKey = null, minScore = PICKER_MIN_SCORE } = {}) {
  return items
    .map((item) => ({
      item,
      score: scoreMediaMatch({ queryName: productName, item, sectionKey }),
    }))
    .filter((row) => row.score >= minScore)
    .sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title)));
}
