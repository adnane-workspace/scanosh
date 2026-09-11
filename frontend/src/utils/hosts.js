import { isReservedSubdomain } from './reservedSubdomains.js';

export const DEFAULT_ROOT_DOMAIN = 'scanosh.com';

const APP_SUBDOMAINS = new Set(['app', 'platform']);
const APP_PATH_RE = /^\/(login|register|essai|demo|forgot-password|app|platform)(\/|$)/;

export function getRootDomain() {
  const fromEnv = import.meta.env?.VITE_ROOT_DOMAIN;
  return String(fromEnv || DEFAULT_ROOT_DOMAIN)
    .trim()
    .replace(/^\./, '')
    .toLowerCase();
}

export function stripPort(hostname) {
  return String(hostname || '')
    .split(':')[0]
    .toLowerCase();
}

function isIpv4(host) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

export function isLocalHostFamily(host) {
  const hostname = stripPort(host);
  return hostname === 'localhost' || hostname === '127.0.0.1' || isIpv4(hostname) || hostname.endsWith('.localhost');
}

function classifyLabel(label, hostname) {
  if (label === 'www') {
    return { kind: 'marketing', slug: null, hostname, product: null };
  }

  if (APP_SUBDOMAINS.has(label)) {
    return { kind: 'app', slug: null, hostname, product: label };
  }

  if (isReservedSubdomain(label)) {
    return { kind: 'marketing', slug: null, hostname, product: null };
  }

  return { kind: 'menu', slug: label, hostname, product: null };
}

export function parseHost(hostname, { rootDomain } = {}) {
  const host = stripPort(hostname);
  const root = String(rootDomain || getRootDomain()).toLowerCase();

  if (!host || isIpv4(host) || host === 'localhost' || host.endsWith('.vercel.app')) {
    return { kind: 'unified', slug: null, hostname: host, product: null };
  }

  if (host.endsWith('.localhost')) {
    const label = host.slice(0, -'.localhost'.length);

    if (!label || label.includes('.')) {
      return { kind: 'unified', slug: null, hostname: host, product: null };
    }

    return classifyLabel(label, host);
  }

  if (host === root || host === `www.${root}`) {
    return { kind: 'marketing', slug: null, hostname: host, product: null };
  }

  const suffix = `.${root}`;

  if (host.endsWith(suffix)) {
    const label = host.slice(0, -suffix.length);

    if (!label || label.includes('.')) {
      return { kind: 'marketing', slug: null, hostname: host, product: null };
    }

    return classifyLabel(label, host);
  }

  return { kind: 'unified', slug: null, hostname: host, product: null };
}

function formatPort(port) {
  if (!port || port === '80' || port === '443') {
    return '';
  }

  return `:${port}`;
}

export function currentLocationParts() {
  if (typeof window === 'undefined') {
    return { hostname: '', protocol: 'https:', port: '', search: '' };
  }

  return {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    search: window.location.search,
  };
}

export function buildTenantOrigin(slug, { hostname, protocol = 'https:', port = '', rootDomain } = {}) {
  const proto = protocol || 'https:';
  const suffix = formatPort(port);
  const root = isLocalHostFamily(hostname) ? 'localhost' : String(rootDomain || getRootDomain()).toLowerCase();
  return `${proto}//${slug}.${root}${suffix}`;
}

export function buildPublicMenuUrl(
  slug,
  { hostname, protocol, port, siteOrigin, rootDomain } = {},
) {
  if (!slug) {
    return '';
  }

  const host = parseHost(hostname, { rootDomain });

  if (host.kind === 'unified') {
    const origin = String(siteOrigin || '').replace(/\/$/, '');
    return origin ? `${origin}/menu/${slug}` : `/menu/${slug}`;
  }

  return buildTenantOrigin(slug, { hostname, protocol, port, rootDomain });
}

export function getMenuPaths(slug, hostname = currentLocationParts().hostname) {
  const host = parseHost(hostname);

  if (host.kind === 'menu') {
    return {
      home: '/',
      sections: '/sections',
      section: (key) => `/${key}`,
      sectionCategory: (key, id) => `/${key}/${id}`,
      categories: '/categories',
      category: (id) => `/${id}`,
      developer: '/developer',
    };
  }

  return {
    home: `/menu/${slug}`,
    sections: `/menu/${slug}/sections`,
    section: (key) => `/menu/${slug}/${key}`,
    sectionCategory: (key, id) => `/menu/${slug}/${key}/${id}`,
    categories: `/menu/${slug}/categories`,
    category: (id) => `/menu/${slug}/${id}`,
    developer: `/menu/${slug}/developer`,
  };
}

export function getAppOrigin({ hostname, protocol, port, rootDomain } = currentLocationParts()) {
  const host = parseHost(hostname, { rootDomain });

  if (host.kind === 'unified') {
    if (typeof window !== 'undefined') {
      return window.location.origin.replace(/\/$/, '');
    }

    return '';
  }

  const proto = protocol || 'https:';
  const suffix = formatPort(port);
  const root = isLocalHostFamily(hostname) ? 'localhost' : String(rootDomain || getRootDomain()).toLowerCase();
  return `${proto}//app.${root}${suffix}`;
}

export function getMarketingOrigin({
  hostname,
  protocol,
  port,
  rootDomain,
  siteOrigin,
} = currentLocationParts()) {
  const host = parseHost(hostname, { rootDomain });

  if (host.kind === 'unified') {
    return String(siteOrigin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  }

  const proto = protocol || 'https:';
  const suffix = formatPort(port);

  if (isLocalHostFamily(hostname)) {
    return `${proto}//localhost${suffix}`;
  }

  const root = String(rootDomain || getRootDomain()).toLowerCase();
  return `${proto}//www.${root}${suffix}`;
}

export function isAppPath(path) {
  return APP_PATH_RE.test(String(path || '').split('?')[0]);
}

export function getMarketingHref(path = '/', loc = currentLocationParts()) {
  const [pathname, query = ''] = String(path || '/').split('?');
  const normalised = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const search = query ? `?${query}` : '';

  if (normalised.startsWith('http')) {
    return path;
  }

  const host = parseHost(loc.hostname, { rootDomain: loc.rootDomain });

  if (host.kind === 'unified' || host.kind === 'marketing') {
    return `${normalised}${search}`;
  }

  return `${getMarketingOrigin(loc)}${normalised}${search}`;
}

export function getAppHref(path = '/', loc = currentLocationParts()) {
  const [pathname, query = ''] = String(path || '/').split('?');
  const normalised = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const search = query ? `?${query}` : '';

  if (normalised.startsWith('http')) {
    return path;
  }

  const host = parseHost(loc.hostname, { rootDomain: loc.rootDomain });

  if (host.kind === 'unified' || host.kind === 'app') {
    return `${normalised}${search}`;
  }

  return `${getAppOrigin(loc)}${normalised}${search}`;
}

export function tenantPathFromMenuUrl(pathname) {
  const match = String(pathname || '').match(/^\/menu\/[^/]+(?:\/(.*))?$/);

  if (!match) {
    return null;
  }

  const rest = match[1] || '';
  return rest ? `/${rest}` : '/';
}
