export const APP_HOME = '/app';
export const PLATFORM_HOME = '/platform';
export const LANDING_HOME = '/';
export const LANDING_FEATURES = '/fonctionnalites';
export const LANDING_PRODUCT = '/menu-digital';
export const LANDING_PRICING = '/tarifs';
export const LANDING_BLOG = '/blog';
export const LANDING_CONTACT = '/contact';

const LANDING_SEO_REDIRECTS = {
  '/accueil': LANDING_HOME,
  '/home': LANDING_HOME,
  '/features': LANDING_FEATURES,
  '/product': LANDING_PRODUCT,
  '/produit': LANDING_PRODUCT,
};

export function getHomePath(user) {
  return user?.role === 'superadmin' ? PLATFORM_HOME : APP_HOME;
}

export function mapLandingSeoRedirect(pathname) {
  const path = String(pathname || '').replace(/\/$/, '') || '/';
  return LANDING_SEO_REDIRECTS[path] || null;
}

export function landingSectionId(pathname) {
  const path = String(pathname || '').replace(/\/$/, '') || '/';

  if (path === LANDING_FEATURES) {
    return 'fonctionnalites';
  }

  if (path === LANDING_PRODUCT || path === '/produit') {
    return 'produit';
  }

  return 'accueil';
}

const PLATFORM_PREFIXES = ['cafes', 'logs', 'storage', 'trials'];
const APP_PREFIXES = ['products', 'categories'];

export function mapLegacyDashboardPath(pathname, user) {
  const rest = String(pathname || '').replace(/^\/dashboard\/?/, '');

  if (!rest) {
    return getHomePath(user);
  }

  if (PLATFORM_PREFIXES.some((prefix) => rest === prefix || rest.startsWith(`${prefix}/`))) {
    return `/platform/${rest}`;
  }

  if (APP_PREFIXES.some((prefix) => rest === prefix || rest.startsWith(`${prefix}/`))) {
    return `/app/${rest}`;
  }

  if (rest === 'settings') {
    return user?.role === 'superadmin' ? `${PLATFORM_HOME}/settings` : `${APP_HOME}/settings`;
  }

  return getHomePath(user);
}
