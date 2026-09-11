import { buildPublicMenuUrl, currentLocationParts, parseHost } from './hosts.js';

function normalizeApiUrl(url) {
  let value = (url || 'http://localhost:5000/api').trim().replace(/\/$/, '');

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  if (!value.endsWith('/api')) {
    value = `${value}/api`;
  }

  return value;
}

function migrateStorageKey(from, to) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (window.localStorage.getItem(to) != null) {
      window.localStorage.removeItem(from);
      return;
    }

    const legacy = window.localStorage.getItem(from);

    if (legacy != null) {
      window.localStorage.setItem(to, legacy);
      window.localStorage.removeItem(from);
    }
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);
export const APP_NAME = 'Scanosh';
export const DEVELOPER_NAME = 'Adnane EL MENOUAR';
export const DEVELOPER_URL = 'https://elmenouar.linkmakeup.com/';
export const MARKETING_SITE_URL = 'https://scanosh.com';
export const TOKEN_STORAGE_KEY = 'qtable-token';
export const USER_STORAGE_KEY = 'qtable-user';
export const LOCALE_STORAGE_KEY = 'qtable-locale';
export const THEME_STORAGE_KEY = 'qtable-theme';

migrateStorageKey('digital-menu-token', TOKEN_STORAGE_KEY);
migrateStorageKey('digital-menu-user', USER_STORAGE_KEY);
migrateStorageKey('digital-menu-locale', LOCALE_STORAGE_KEY);

export function getSiteOrigin() {
  const fromEnv = (import.meta.env.VITE_PUBLIC_APP_URL || '').replace(/\/$/, '');

  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }

  return '';
}

export function getDocumentOrigin() {
  if (typeof window !== 'undefined') {
    const host = parseHost(window.location.hostname);

    if (host.kind === 'menu' || host.kind === 'app') {
      return window.location.origin.replace(/\/$/, '');
    }
  }

  return getSiteOrigin();
}

export const DEMO_MENU_SLUG = String(import.meta.env.VITE_DEMO_MENU_SLUG || 'bbb')
  .trim()
  .toLowerCase() || 'bbb';

export function getPublicMenuUrl(slug) {
  if (!slug) {
    return '';
  }

  const loc = currentLocationParts();
  return buildPublicMenuUrl(slug, {
    ...loc,
    siteOrigin: getSiteOrigin(),
  });
}
