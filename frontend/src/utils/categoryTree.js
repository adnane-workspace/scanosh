export function parentKey(parentId) {
  return parentId || null;
}

export function siblingCategories(categories, parentId) {
  const key = parentKey(parentId);

  return categories
    .filter((category) => parentKey(category.parentId) === key)
    .slice()
    .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
}

export function walkPreOrder(categories, parentId = null, depth = 0) {
  return siblingCategories(categories, parentId).flatMap((category) => [
    { ...category, depth },
    ...walkPreOrder(categories, category._id, depth + 1),
  ]);
}

export function descendantIdSet(categories, categoryId) {
  const ids = new Set();
  const stack = categories.filter((category) => category.parentId === categoryId);

  while (stack.length > 0) {
    const node = stack.pop();
    ids.add(node._id);
    stack.push(...categories.filter((category) => category.parentId === node._id));
  }

  return ids;
}

export function leafCategories(categories) {
  return categories.filter((category) => !category.childCount);
}

export function resolveCategorySectionKey(categories, categoryId) {
  const byId = new Map(categories.map((category) => [category._id, category]));
  let current = byId.get(categoryId);
  while (current) {
    if (current.sectionKey) return current.sectionKey;
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return null;
}

export function categoryPathLabel(categories, categoryId) {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const parts = [];
  let current = byId.get(categoryId);

  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : null;
  }

  return parts.join(' / ');
}

export function subtreeIds(categories, categoryId) {
  const ids = descendantIdSet(categories, categoryId);
  ids.add(categoryId);
  return ids;
}

export function findPublicCategory(nodes, categoryId) {
  for (const node of nodes || []) {
    if (String(node.id) === String(categoryId)) {
      return node;
    }

    const nested = findPublicCategory(node.children, categoryId);

    if (nested) {
      return nested;
    }
  }

  return null;
}

export function findPublicParent(nodes, categoryId, parent = null) {
  for (const node of nodes || []) {
    if (String(node.id) === String(categoryId)) {
      return parent;
    }

    const nested = findPublicParent(node.children, categoryId, node);

    if (nested !== undefined) {
      return nested;
    }
  }

  return undefined;
}

export function firstPublicCover(category) {
  if (category?.image) {
    return category.image;
  }

  for (const product of category?.products || []) {
    if (product.image) {
      return product.image;
    }
  }

  for (const child of category?.children || []) {
    const nested = firstPublicCover(child);

    if (nested) {
      return nested;
    }
  }

  return '';
}
