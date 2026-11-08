import { useEffect, useState } from 'react';
import { getPublicMenu, getPublicMenuView } from '../services/menu.service.js';
import { APP_NAME } from '../utils/constants.js';
import { isAppPath, parseHost } from '../utils/hosts.js';
import { getActiveSections, isLegacyCategoryId, isMenuSectionKey } from '../utils/menuSections.js';

const CACHE_TTL_MS = 60 * 1000;
const menuCache = new Map();
const inflightCache = new Map();

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

function fetchWithDedup(slug, { view = 'full', section = '', categoryId = '' } = {}) {
  const key = cacheKey(slug, view, section, categoryId);
  const existing = readCache(key);

  if (existing) {
    return Promise.resolve(existing);
  }

  const inflight = inflightCache.get(key);

  if (inflight) {
    return inflight;
  }

  const request = (
    view === 'full'
      ? getPublicMenu(slug)
      : getPublicMenuView(slug, { view, section, categoryId })
  )
    .then((data) => {
      writeCache(key, data);
      inflightCache.delete(key);
      scheduleNextStepPrefetch(slug, view, data);
      return data;
    })
    .catch((error) => {
      inflightCache.delete(key);
      throw error;
    });

  inflightCache.set(key, request);
  return request;
}

function scheduleNextStepPrefetch(slug, view, data) {
  if (typeof window === 'undefined' || !data) {
    return;
  }

  if (view === 'landing') {
    window.setTimeout(() => {
      const activeSections = getActiveSections(data);

      if (activeSections.length > 1) {
        prefetchPublicMenu(slug, { view: 'sections' });
        return;
      }

      if (activeSections.length === 1) {
        const firstSection = activeSections[0];
        const firstCategory = firstSection.children?.[0];
        prefetchPublicMenu(slug, {
          view: 'category',
          section: firstSection.key,
          categoryId: firstCategory?.id || '',
        });
        return;
      }

      prefetchPublicMenu(slug, { view: 'category', section: '', categoryId: '' });
    }, 60);
  } else if (view === 'sections') {
    window.setTimeout(() => {
      const activeSections = getActiveSections(data);
      const firstSection = activeSections[0];

      if (firstSection) {
        const firstCategory = firstSection.children?.[0];
        prefetchPublicMenu(slug, {
          view: 'category',
          section: firstSection.key,
          categoryId: firstCategory?.id || '',
        });
      }
    }, 80);
  }
}

export function prefetchPublicMenu(slug, options = {}) {
  if (!slug) {
    return;
  }

  fetchWithDedup(slug, options).catch(() => {
    // Ignore background prefetch errors; active page hook handles errors.
  });
}

export function primePublicMenuFromLocation() {
  if (typeof window === 'undefined') {
    return;
  }

  const { hostname, pathname } = window.location;
  const host = parseHost(hostname);
  let slug = null;
  let subPath = pathname || '/';

  if (host.kind === 'menu' && host.slug) {
    if (isAppPath(subPath)) {
      return;
    }
    slug = host.slug;
  } else if (subPath.startsWith('/menu/')) {
    const match = subPath.match(/^\/menu\/([^/]+)(?:\/(.*))?$/);
    if (!match) {
      return;
    }
    slug = match[1];
    subPath = match[2] ? `/${match[2]}` : '/';
  }

  if (!slug) {
    return;
  }

  const segments = subPath.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'developer')) {
    prefetchPublicMenu(slug, { view: 'landing' });
    return;
  }

  if (segments.length === 1 && segments[0] === 'sections') {
    prefetchPublicMenu(slug, { view: 'sections' });
    return;
  }

  if (segments.length === 1 && segments[0] === 'categories') {
    prefetchPublicMenu(slug, { view: 'category', section: '', categoryId: '' });
    return;
  }

  if (segments.length === 2 && segments[0] !== 'menu') {
    const [seg1, seg2] = segments;
    const isSection = !isLegacyCategoryId(seg1) && isMenuSectionKey(seg1);
    prefetchPublicMenu(slug, {
      view: 'category',
      section: isSection ? seg1 : '',
      categoryId: seg2,
    });
    return;
  }

  if (segments.length === 1) {
    const seg = segments[0];
    if (isLegacyCategoryId(seg)) {
      prefetchPublicMenu(slug, { view: 'category', section: '', categoryId: seg });
    } else if (isMenuSectionKey(seg)) {
      prefetchPublicMenu(slug, { view: 'category', section: seg, categoryId: '' });
    }
  }
}

export function clearPublicMenuCache(slug) {
  if (!slug) {
    menuCache.clear();
    inflightCache.clear();
    return;
  }

  for (const key of menuCache.keys()) {
    if (key === slug || key.startsWith(`${slug}|`)) {
      menuCache.delete(key);
    }
  }

  for (const key of inflightCache.keys()) {
    if (key === slug || key.startsWith(`${slug}|`)) {
      inflightCache.delete(key);
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

    fetchWithDedup(slug, { view, section, categoryId })
      .then((data) => {
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
