import { useCallback, useEffect, useMemo, useState } from 'react';
import { LOCALES, publicMessages } from '../i18n/publicMessages.js';
import { LOCALE_STORAGE_KEY } from '../utils/constants.js';
import { parseHost } from '../utils/hosts.js';
import { getActiveMessages, LocaleContext, registerMessages, subscribeMessages } from './locale-context.js';

const SUPPORTED = new Set(LOCALES.map((item) => item.id));

function isPublicMenuSurface() {
  if (typeof window === 'undefined') {
    return false;
  }
  const host = parseHost(window.location.hostname);
  if (host.kind === 'menu') {
    return true;
  }
  return String(window.location.pathname || '').startsWith('/menu/');
}

function localeMeta(id) {
  return LOCALES.find((item) => item.id === id) || LOCALES[0];
}

function readLocale() {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return SUPPORTED.has(stored) ? stored : 'fr';
}

function applyDocumentLocale(id) {
  const meta = localeMeta(id);
  document.documentElement.lang = meta.id;
  document.documentElement.dir = meta.dir;
}

function lookupIn(catalog, locale, key) {
  const parts = key.split('.');
  let node = catalog[locale] || catalog.fr;

  for (const part of parts) {
    node = node?.[part];
  }

  if (typeof node === 'string') {
    return node;
  }

  node = catalog.fr;

  for (const part of parts) {
    node = node?.[part];
  }

  return typeof node === 'string' ? node : null;
}

function lookup(locale, key) {
  const active = getActiveMessages();
  return lookupIn(active, locale, key) ?? lookupIn(publicMessages, locale, key) ?? key;
}

function interpolate(text, vars) {
  if (!vars) {
    return text;
  }

  return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] == null ? '' : String(vars[name])));
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(readLocale);
  const [catalogVersion, setCatalogVersion] = useState(() => (getActiveMessages() === publicMessages ? 0 : 1));

  useEffect(() => {
    const unsubscribe = subscribeMessages(() => setCatalogVersion((v) => v + 1));

    if (getActiveMessages() === publicMessages && !isPublicMenuSurface()) {
      import('../i18n/messages.js').then((mod) => {
        if (mod?.messages) {
          registerMessages(mod.messages);
        }
      });
    }

    return unsubscribe;
  }, []);

  const setLocale = useCallback((next) => {
    const value = SUPPORTED.has(next) ? next : 'fr';
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
    applyDocumentLocale(value);
    setLocaleState(value);
  }, []);

  const t = useCallback(
    (key, vars) => {
      void catalogVersion;
      return interpolate(lookup(locale, key), vars);
    },
    [locale, catalogVersion],
  );

  const value = useMemo(() => ({ locale, setLocale, t, dir: localeMeta(locale).dir }), [locale, setLocale, t]);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
