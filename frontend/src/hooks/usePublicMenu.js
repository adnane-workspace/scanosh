import { useEffect, useState } from 'react';
import { getPublicMenu, getPublicMenuView } from '../services/menu.service.js';
import { APP_NAME } from '../utils/constants.js';

const CACHE_TTL_MS = 20 * 1000;
const menuCache = new Map();

function cacheKey(slug, view, section, categoryId) {
  return `${slug}|${view}|${section}|${categoryId}`;
}

function readCache(key) {
  const entry = menuCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.at > CACHE_TTL_MS) {
    menuCache.delete(key);
    return null;
  }

  return entry.data;
}

function writeCache(key, data) {
  menuCache.set(key, { data, at: Date.now() });
}

export function clearPublicMenuCache(slug) {
  if (!slug) {
    menuCache.clear();
    return;
  }

  for (const key of menuCache.keys()) {
    if (key === slug || key.startsWith(`${slug}|`)) {
      menuCache.delete(key);
    }
  }
}

export function countPublicProducts(categories = []) {
  return categories.reduce(
    (total, category) => total + (category.products?.length || 0) + countPublicProducts(category.children || []),
    0,
  );
}

export function setPageMeta({ title, description, robots = 'index,follow' }) {
  document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;

  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }

  meta.content = description;

  let robotsMeta = document.querySelector('meta[name="robots"]');

  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    document.head.appendChild(robotsMeta);
  }

  robotsMeta.content = robots;
}

export function usePublicMenu(slug, { view = 'full', section = '', categoryId = '' } = {}) {
  const key = cacheKey(slug, view, section, categoryId);
  const cached = readCache(key);
  const [menu, setMenu] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const existing = readCache(key);

    if (existing) {
      setMenu(existing);
      setLoading(false);
      setErrorStatus(null);
      return undefined;
    }

    setLoading(true);
    setErrorStatus(null);

    const request =
      view === 'full'
        ? getPublicMenu(slug)
        : getPublicMenuView(slug, { view, section, categoryId });

    request
      .then((data) => {
        writeCache(key, data);

        if (!cancelled) {
          setMenu(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMenu(null);
          setErrorStatus(error.response?.status || 500);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, key, section, slug, view]);

  return { menu, loading, errorStatus };
}
