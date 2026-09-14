const JUNK_CATEGORY = /^(menu|\/|-|—|_|\.|section|categorie|catégorie)$/i;
const GENERIC_DESCRIPTION = /^(coffee|café|cafe|tea|thé|drink|boisson|hot drink|hot coffee)$/i;
const VENUE_CATEGORY =
  /\b(bean|beans|coffee house|coffee shop|roasters?|restaurant|resto|bistro|brasserie|kitchen|eatery)\b/i;

function looksLikeDrinkName(name) {
  return /\b(jus|juice|soda|thé|the|tea|café|cafe|latte|mocha|smoothie|milkshake|boisson|espresso|expresso|cappuccino|cappucino)\b/i.test(
    String(name || ''),
  );
}

function cleanProductName(name = '') {
  let value = String(name || '')
    .replace(/\s+/g, ' ')
    .trim();
  value = value.replace(/[$€]+/g, ' ');
  value = value.replace(/\s*(?:dh|dhs|mad|usd|eur|dollar|dollars|dirhams?)\s*$/iu, '');
  return value.replace(/\s{2,}/g, ' ').trim().slice(0, 120);
}

function cleanDescription(name, description) {
  const value = String(description || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!value) return '';
  if (GENERIC_DESCRIPTION.test(value)) return '';
  if (String(name || '').trim().toLowerCase() === value.toLowerCase()) return '';
  return value.slice(0, 500);
}

function cleanCategoryName(name, products = []) {
  const value = String(name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  if (!value) return value;
  const drinkHeavy =
    products.length > 0 &&
    products.filter((product) => looksLikeDrinkName(product?.name)).length / products.length >= 0.5;
  if (VENUE_CATEGORY.test(value) && drinkHeavy) return 'Cafés';
  return value;
}

/**
 * LLM often turns each juice into an empty category (0 products).
 * Fold those names into real products and drop junk headers like "/".
 */
export function repairDraftMenu(draft) {
  const categoriesIn = Array.isArray(draft?.categories) ? draft.categories : [];
  const kept = [];
  const orphans = [];

  for (const cat of categoriesIn) {
    const products = (Array.isArray(cat?.products) ? cat.products : []).map((product) => {
      const name = cleanProductName(product?.name);
      return {
        ...product,
        name,
        description: cleanDescription(name, product?.description || ''),
      };
    });
    const name = cleanCategoryName(cat?.name, products);

    if (!name || JUNK_CATEGORY.test(name) || name.length <= 1) {
      orphans.push(
        ...products.map((product) => ({
          ...product,
          sectionKey: cat.sectionKey || 'cafe',
        })),
      );
      continue;
    }

    if (!products.length) {
      orphans.push({
        id: `prod-from-${cat.id || name}`,
        name: name.slice(0, 120),
        description: '',
        price: 0,
        selected: cat.selected !== false,
        needsReview: true,
        image: '',
        imageSource: '',
        sectionKey: cat.sectionKey || (looksLikeDrinkName(name) ? 'cafe' : 'restaurant'),
      });
      continue;
    }

    kept.push({
      ...cat,
      name,
      products:
        cat.sectionKey === 'cafe'
          ? products.map((product) => ({ ...product, description: '' }))
          : products,
    });
  }

  for (const orphan of orphans) {
    const sectionKey = orphan.sectionKey || 'cafe';
    const drink = looksLikeDrinkName(orphan.name);
    let dest =
      kept.find((cat) => cat.sectionKey === sectionKey && /boisson|jus|drink/i.test(cat.name)) ||
      kept.find((cat) => cat.sectionKey === sectionKey);

    if (!dest) {
      dest = {
        id: drink ? 'cat-boissons-auto' : 'cat-autres-auto',
        name: drink ? 'Boissons' : 'Autres',
        sectionKey,
        selected: true,
        products: [],
      };
      kept.push(dest);
    }

    dest.products = [
      ...(dest.products || []),
      {
        id: orphan.id,
        name: orphan.name,
        description: orphan.description || '',
        price: Number(orphan.price) || 0,
        selected: orphan.selected !== false,
        needsReview: orphan.needsReview !== false,
        image: orphan.image || '',
        imageSource: orphan.imageSource || '',
      },
    ];
  }

  return {
    ...draft,
    categories: kept,
    meta: {
      ...(draft?.meta && typeof draft.meta === 'object' ? draft.meta : {}),
      categoryCount: kept.length,
      productCount: kept.reduce((sum, cat) => sum + (cat.products?.length || 0), 0),
    },
  };
}
