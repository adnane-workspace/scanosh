/**
 * Heuristic menu extraction from OCR text/blocks.
 * Produces a draft the manager can edit before publish.
 */

import { isMenuSectionKey } from '../utils/menuSections.js';

const PRICE_RE =
  /(?<![A-Za-z0-9])(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:dh|mad|dhs|€|\$|د\.?\s*م\.?|درهم)?\s*$/iu;

const CATEGORY_KEYWORDS = [
  'entree',
  'entrees',
  'entrée',
  'entrées',
  'plat',
  'plats',
  'dessert',
  'desserts',
  'boisson',
  'boissons',
  'drink',
  'drinks',
  'sandwich',
  'sandwichs',
  'burger',
  'burgers',
  'pizza',
  'pizzas',
  'salade',
  'salades',
  'petit dejeuner',
  'petit-dejeuner',
  'breakfast',
  'cafe',
  'café',
  'the',
  'thé',
  'jus',
  'menu',
  'menus',
  'formule',
  'formules',
  'specialite',
  'spécialités',
  'تقديمات',
  'مشروبات',
  'أطباق',
  'مقبلات',
  'حلويات',
  'ساندويتش',
  'بيتزا',
  'سلطات',
];

function normalizeSpaces(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

const CAFE_SECTION_HINTS = [
  'cafe',
  'café',
  'coffee',
  'boisson',
  'drink',
  'jus',
  'the',
  'thé',
  'espresso',
  'cappuccino',
  'latte',
  'smoothie',
  'milkshake',
  'petit dejeuner',
  'petit-dejeuner',
  'breakfast',
  'patisserie',
  'pâtisserie',
  'viennoiserie',
  'croissant',
  'gateau',
  'gâteau',
  'cha',
  'شاي',
  'قهوة',
  'مشروب',
  'عصير',
];

const RESTAURANT_SECTION_HINTS = [
  'plat',
  'entree',
  'entrée',
  'dessert',
  'salade',
  'salad',
  'soup',
  'soupe',
  'pizza',
  'burger',
  'sandwich',
  'tajine',
  'grill',
  'viande',
  'poisson',
  'pasta',
  'pates',
  'pâtes',
  'riz',
  'main',
  'meal',
  'food',
  'طبق',
  'مقبل',
  'حلويات',
  'سلطة',
];

/**
 * Guess Scanosh menu section for a draft category.
 * @returns {'cafe' | 'restaurant'}
 */
function guessSectionKey(categoryName = '', products = []) {
  const blob = [
    categoryName,
    ...products.map((p) => `${p?.name || ''} ${p?.description || ''}`),
  ]
    .join(' ')
    .toLowerCase();

  const cafeScore = CAFE_SECTION_HINTS.reduce(
    (sum, hint) => sum + (blob.includes(hint) ? 1 : 0),
    0,
  );
  const restaurantScore = RESTAURANT_SECTION_HINTS.reduce(
    (sum, hint) => sum + (blob.includes(hint) ? 1 : 0),
    0,
  );

  if (cafeScore > restaurantScore) return 'cafe';
  if (restaurantScore > cafeScore) return 'restaurant';
  return 'restaurant';
}

function normalizeSectionKey(value, fallbackName = '', products = []) {
  const key = String(value || '')
    .trim()
    .toLowerCase();
  if (isMenuSectionKey(key)) return key;
  return guessSectionKey(fallbackName, products);
}

function parsePrice(raw) {
  const value = Number.parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function stripPrice(line) {
  const text = normalizeSpaces(line);
  if (!text) {
    return { name: '', price: null, hasPrice: false };
  }

  // Trailing price: "Margherita 45" / "Café 12 DH"
  const trailing = text.match(PRICE_RE);
  if (trailing) {
    const price = parsePrice(trailing[1]);
    const name = normalizeSpaces(text.slice(0, trailing.index));
    return { name, price, hasPrice: true };
  }

  // Leading price: "45 Margherita" / "70 Blanco"
  const leading = text.match(
    /^(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:dh|mad|dhs|€|\$|د\.?\s*م\.?|درهم)?\s+(.+)$/iu,
  );
  if (leading) {
    return {
      name: normalizeSpaces(leading[2]),
      price: parsePrice(leading[1]),
      hasPrice: true,
    };
  }

  // Price-only line
  if (/^\d{1,4}(?:[.,]\d{1,2})?\s*(?:dh|mad|dhs|€|\$|د\.?\s*م\.?|درهم)?$/iu.test(text)) {
    const only = text.match(/(\d{1,4}(?:[.,]\d{1,2})?)/);
    return { name: '', price: parsePrice(only?.[1]), hasPrice: true };
  }

  return { name: text, price: null, hasPrice: false };
}

function looksLikeCategory(line, { hasPrice }) {
  if (hasPrice) return false;
  const cleaned = normalizeSpaces(line);
  if (!cleaned || cleaned.length > 40) return false;
  if (/^\d+([.,]\d+)?$/.test(cleaned)) return false;

  const lower = cleaned.toLowerCase();
  if (CATEGORY_KEYWORDS.some((key) => lower === key || lower.includes(key))) {
    return true;
  }

  const letters = cleaned.replace(/[^A-Za-zÀ-ÿ\u0600-\u06FF]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase() && cleaned.length <= 32) {
    return true;
  }

  // Short ALL-CAPS / keyword titles mark sections; avoid treating every short line as category
  if (cleaned.length <= 24 && !/\d/.test(cleaned) && !/[.!?:,;]$/.test(cleaned)) {
    const words = cleaned.split(' ');
    if (words.length <= 3 && cleaned === cleaned.toUpperCase()) return true;
  }

  return false;
}

function linesFromOcr({ text, blocks }) {
  if (Array.isArray(blocks) && blocks.length) {
    return blocks
      .map((block) => ({
        text: normalizeSpaces(block?.text),
        confidence: typeof block?.confidence === 'number' ? block.confidence : null,
      }))
      .filter((item) => item.text);
  }

  return String(text || '')
    .split(/\r?\n|•|·|\u2022/g)
    .map((line) => ({ text: normalizeSpaces(line), confidence: null }))
    .filter((item) => item.text);
}

function newCategory(name, index) {
  return {
    id: `cat-${index}`,
    name: String(name || '').slice(0, 80),
    // Temporary; re-scored after products are filled
    sectionKey: guessSectionKey(name),
    selected: true,
    products: [],
  };
}

function newProduct({ name, description, price, confidence, catIndex, prodIndex }) {
  const needsReview =
    price === null ||
    price === undefined ||
    !name ||
    (typeof confidence === 'number' && confidence < 0.55);

  return {
    id: `prod-${catIndex}-${prodIndex}`,
    name: String(name || '').slice(0, 120),
    description: String(description || '').slice(0, 500),
    price: price === null || price === undefined ? 0 : price,
    selected: Boolean(name),
    needsReview,
    confidence,
  };
}

function isPlaceholderName(name) {
  return /^article\s*\d+$/i.test(normalizeSpaces(name));
}

function looksLikeProductName(text) {
  const value = normalizeSpaces(text);
  if (!value || value.length > 60) return false;
  if (/[.!?]/.test(value)) return false;
  const words = value.split(/\s+/);
  return words.length >= 1 && words.length <= 6;
}

/**
 * Repair common OCR ordering issues: price then name → Article N + description.
 */
function repairDraftProducts(categories) {
  for (const cat of categories) {
    for (const prod of cat.products || []) {
      if (isPlaceholderName(prod.name) && looksLikeProductName(prod.description)) {
        prod.name = normalizeSpaces(prod.description).slice(0, 120);
        prod.description = '';
        prod.needsReview = true;
        prod.selected = true;
      } else if (isPlaceholderName(prod.name)) {
        prod.needsReview = true;
      }
    }
    cat.sectionKey = guessSectionKey(cat.name, cat.products);
  }
  return categories;
}

/**
 * @param {{ text?: string, blocks?: unknown[] }} input
 */
export function extractDraftMenu(input = {}) {
  const lines = linesFromOcr(input);
  const categories = [];
  let current = null;
  let pendingName = '';
  let pendingDescription = '';
  let pendingPrice = null;

  const ensureCategory = (name) => {
    if (!current) {
      current = newCategory(name || 'Menu importé', categories.length);
      categories.push(current);
    }
    return current;
  };

  const pushProduct = ({ name, description, price, confidence }) => {
    const cat = ensureCategory('Menu importé');
    const productName = normalizeSpaces(name);
    cat.products.push(
      newProduct({
        name: productName || `Article ${cat.products.length + 1}`,
        description: normalizeSpaces(description || ''),
        price,
        confidence,
        catIndex: categories.indexOf(cat),
        prodIndex: cat.products.length,
      }),
    );
  };

  const flushPending = () => {
    if (pendingName && pendingPrice != null) {
      pushProduct({
        name: pendingName,
        description: pendingDescription,
        price: pendingPrice,
        confidence: null,
      });
    }
    pendingName = '';
    pendingDescription = '';
    pendingPrice = null;
  };

  for (const line of lines) {
    const { name, price, hasPrice } = stripPrice(line.text);

    if (!name && !hasPrice) continue;

    if (looksLikeCategory(line.text, { hasPrice })) {
      flushPending();
      current = newCategory(name || line.text, categories.length);
      categories.push(current);
      continue;
    }

    // "Margherita 45" or "45 Margherita" handled via stripPrice (price at end)
    if (hasPrice && name) {
      pushProduct({
        name,
        description: pendingDescription || pendingName,
        price,
        confidence: line.confidence,
      });
      pendingName = '';
      pendingDescription = '';
      pendingPrice = null;
      continue;
    }

    // Price alone (common OCR: name and price on separate lines)
    if (hasPrice && !name) {
      if (pendingName) {
        pushProduct({
          name: pendingName,
          description: pendingDescription,
          price,
          confidence: line.confidence,
        });
        pendingName = '';
        pendingDescription = '';
        pendingPrice = null;
      } else if (current?.products?.length) {
        const last = current.products[current.products.length - 1];
        // If last product already has a price and is a placeholder waiting for a name, keep price pending
        if (isPlaceholderName(last.name) && !last.description) {
          pendingPrice = price;
        } else {
          pendingPrice = price;
        }
      } else {
        pendingPrice = price;
      }
      continue;
    }

    // Name / text without price
    if (pendingPrice != null) {
      pushProduct({
        name,
        description: pendingDescription || pendingName,
        price: pendingPrice,
        confidence: line.confidence,
      });
      pendingName = '';
      pendingDescription = '';
      pendingPrice = null;
      continue;
    }

    if (current?.products?.length) {
      const last = current.products[current.products.length - 1];
      // Price came first → placeholder Article N: next text is the real name
      if (isPlaceholderName(last.name) && !last.description && looksLikeProductName(name)) {
        last.name = name.slice(0, 120);
        last.selected = true;
        last.needsReview = Boolean(
          last.price === 0 || (typeof line.confidence === 'number' && line.confidence < 0.55),
        );
        continue;
      }
      if (!last.description && name.length <= 500) {
        last.description = name;
        if (typeof line.confidence === 'number' && line.confidence < 0.55) {
          last.needsReview = true;
        }
        continue;
      }
    }

    if (pendingName) {
      pendingDescription = pendingDescription
        ? `${pendingDescription} ${pendingName}`.trim()
        : pendingName;
    }
    pendingName = name;
  }

  flushPending();
  repairDraftProducts(categories);

  const cleaned = categories
    .map((cat, catIndex) => ({
      ...cat,
      id: `cat-${catIndex}`,
      products: cat.products.map((prod, prodIndex) => ({
        ...prod,
        id: `prod-${catIndex}-${prodIndex}`,
      })),
    }))
    .filter((cat) => cat.products.length > 0 || cat.name);

  const productCount = cleaned.reduce((sum, cat) => sum + cat.products.length, 0);

  return {
    categories: cleaned,
    meta: {
      parser: 'heuristic-v2',
      lineCount: lines.length,
      categoryCount: cleaned.length,
      productCount,
      needsReviewCount: cleaned.reduce(
        (sum, cat) => sum + cat.products.filter((p) => p.needsReview).length,
        0,
      ),
    },
  };
}

export function normalizeDraftMenu(draft) {
  const categoriesIn = Array.isArray(draft?.categories) ? draft.categories : [];
  const categories = categoriesIn
    .map((cat, catIndex) => {
      const name = normalizeSpaces(cat?.name).slice(0, 80);
      if (!name) return null;
      const products = (Array.isArray(cat?.products) ? cat.products : [])
        .map((prod, prodIndex) => {
          let prodName = normalizeSpaces(prod?.name).slice(0, 120);
          let description = normalizeSpaces(prod?.description || '').slice(0, 500);
          // Fix inverted OCR: "Article 1" + description "Pepperoni"
          if (isPlaceholderName(prodName) && looksLikeProductName(description)) {
            prodName = description.slice(0, 120);
            description = '';
          }
          if (!prodName) return null;
          let price = Number(prod?.price);
          if (!Number.isFinite(price) || price < 0) price = 0;
          price = Math.round(price * 100) / 100;
          return {
            id: String(prod?.id || `prod-${catIndex}-${prodIndex}`),
            name: prodName,
            description,
            price,
            selected: prod?.selected !== false,
            needsReview:
              Boolean(prod?.needsReview) || isPlaceholderName(prodName) || !(price > 0),
            confidence: typeof prod?.confidence === 'number' ? prod.confidence : null,
            image: String(prod?.image || '').trim().slice(0, 2048),
            imageSource: String(prod?.imageSource || '').trim().slice(0, 40),
          };
        })
        .filter(Boolean);

      return {
        id: String(cat?.id || `cat-${catIndex}`),
        name,
        sectionKey: normalizeSectionKey(cat?.sectionKey, name, products),
        selected: cat?.selected !== false,
        products,
      };
    })
    .filter(Boolean);

  const productCount = categories.reduce((sum, cat) => sum + cat.products.length, 0);

  return {
    categories,
    meta: {
      ...(draft?.meta && typeof draft.meta === 'object' ? draft.meta : {}),
      parser: draft?.meta?.parser || 'heuristic-v1',
      categoryCount: categories.length,
      productCount,
      needsReviewCount: categories.reduce(
        (sum, cat) => sum + cat.products.filter((p) => p.needsReview).length,
        0,
      ),
      cafeCategoryCount: categories.filter((c) => c.sectionKey === 'cafe').length,
      restaurantCategoryCount: categories.filter((c) => c.sectionKey === 'restaurant').length,
    },
  };
}
