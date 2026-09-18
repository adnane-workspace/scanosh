export function searchVariants(token) {
  const raw = String(token || '').trim();
  if (!raw) {
    return [];
  }

  const folded = raw.normalize('NFD').replace(/\p{M}/gu, '');
  const variants = new Set([raw]);

  if (folded && folded !== raw) {
    variants.add(folded);
  }

  if (raw === folded && raw.length > 2 && /e$/i.test(raw)) {
    variants.add(`${raw.slice(0, -1)}é`);
  }

  return [...variants];
}

export function searchTokens(query) {
  const parts = String(query || '')
    .trim()
    .split(/[\s,;]+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (parts.length === 0 && String(query || '').trim().length === 1) {
    return [String(query).trim()];
  }

  return parts.filter((part) => part.length >= 2 || parts.length === 1);
}

function containsInsensitive(path, value) {
  if (path === 'name') {
    return { name: { contains: value, mode: 'insensitive' } };
  }

  if (path === 'description') {
    return { description: { contains: value, mode: 'insensitive' } };
  }

  if (path === 'category') {
    return { category: { is: { name: { contains: value, mode: 'insensitive' } } } };
  }

  return { category: { is: { parent: { is: { name: { contains: value, mode: 'insensitive' } } } } } };
}

export function productSearchWhere(search) {
  const tokens = searchTokens(search);

  if (tokens.length === 0) {
    return null;
  }

  return {
    AND: tokens.map((token) => ({
      OR: searchVariants(token).flatMap((value) => [
        containsInsensitive('name', value),
        containsInsensitive('description', value),
        containsInsensitive('category', value),
        containsInsensitive('parent', value),
      ]),
    })),
  };
}
