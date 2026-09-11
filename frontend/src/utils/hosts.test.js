import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isReservedSubdomain } from './reservedSubdomains.js';
import {
  buildPublicMenuUrl,
  getAppHref,
  getMarketingHref,
  getMenuPaths,
  parseHost,
  tenantPathFromMenuUrl,
} from './hosts.js';

const root = 'scanosh.com';

test('parseHost keeps localhost and vercel previews on the unified app', () => {
  assert.equal(parseHost('localhost', { rootDomain: root }).kind, 'unified');
  assert.equal(parseHost('127.0.0.1', { rootDomain: root }).kind, 'unified');
  assert.equal(parseHost('scan-abc.vercel.app', { rootDomain: root }).kind, 'unified');
});

test('parseHost maps apex and www to marketing', () => {
  assert.equal(parseHost('scanosh.com', { rootDomain: root }).kind, 'marketing');
  assert.equal(parseHost('www.scanosh.com', { rootDomain: root }).kind, 'marketing');
});

test('parseHost maps app and platform to the product origin', () => {
  assert.deepEqual(parseHost('app.scanosh.com', { rootDomain: root }), {
    kind: 'app',
    slug: null,
    hostname: 'app.scanosh.com',
    product: 'app',
  });
  assert.equal(parseHost('platform.scanosh.com', { rootDomain: root }).kind, 'app');
  assert.equal(parseHost('platform.scanosh.com', { rootDomain: root }).product, 'platform');
});

test('parseHost maps cafe labels to tenant menus', () => {
  assert.deepEqual(parseHost('cafe-central.scanosh.com', { rootDomain: root }), {
    kind: 'menu',
    slug: 'cafe-central',
    hostname: 'cafe-central.scanosh.com',
    product: null,
  });
  assert.equal(parseHost('cafe-central.localhost', { rootDomain: root }).kind, 'menu');
  assert.equal(parseHost('cafe-central.localhost', { rootDomain: root }).slug, 'cafe-central');
});

test('parseHost does not treat nested labels as cafe tenants', () => {
  assert.equal(parseHost('a.b.scanosh.com', { rootDomain: root }).kind, 'marketing');
  assert.equal(parseHost('a.b.localhost', { rootDomain: root }).kind, 'unified');
});

test('reserved labels never become cafe tenants', () => {
  assert.equal(isReservedSubdomain('www'), true);
  assert.equal(isReservedSubdomain('app'), true);
  assert.equal(isReservedSubdomain('api'), true);
  assert.equal(parseHost('api.scanosh.com', { rootDomain: root }).kind, 'marketing');
  assert.equal(parseHost('blog.scanosh.com', { rootDomain: root }).slug, null);
});

test('buildPublicMenuUrl keeps /menu paths on unified hosts', () => {
  assert.equal(
    buildPublicMenuUrl('cafe-central', {
      hostname: 'localhost',
      siteOrigin: 'http://localhost:5173',
      rootDomain: root,
    }),
    'http://localhost:5173/menu/cafe-central',
  );
});

test('buildPublicMenuUrl emits tenant origins on app and marketing hosts', () => {
  assert.equal(
    buildPublicMenuUrl('cafe-central', {
      hostname: 'app.scanosh.com',
      protocol: 'https:',
      rootDomain: root,
    }),
    'https://cafe-central.scanosh.com',
  );
  assert.equal(
    buildPublicMenuUrl('cafe-central', {
      hostname: 'app.localhost',
      protocol: 'http:',
      port: '5173',
      rootDomain: root,
    }),
    'http://cafe-central.localhost:5173',
  );
});

test('getMenuPaths drop the /menu prefix on tenant hosts', () => {
  const tenant = getMenuPaths('cafe-central', 'cafe-central.scanosh.com');
  assert.equal(tenant.home, '/');
  assert.equal(tenant.categories, '/categories');
  assert.equal(tenant.category('abc'), '/abc');
  assert.equal(tenant.developer, '/developer');

  const unified = getMenuPaths('cafe-central', 'localhost');
  assert.equal(unified.home, '/menu/cafe-central');
  assert.equal(unified.categories, '/menu/cafe-central/categories');
  assert.equal(unified.category('abc'), '/menu/cafe-central/abc');
  assert.equal(unified.developer, '/menu/cafe-central/developer');
});

test('getMarketingHref points app visitors at the marketing origin', () => {
  assert.equal(getMarketingHref('/', { hostname: 'localhost', rootDomain: root }), '/');
  assert.equal(getMarketingHref('/', { hostname: 'www.scanosh.com', protocol: 'https:', rootDomain: root }), '/');
  assert.equal(
    getMarketingHref('/', { hostname: 'app.scanosh.com', protocol: 'https:', rootDomain: root }),
    'https://www.scanosh.com/',
  );
});

test('getAppHref points marketing visitors at the app origin', () => {
  assert.equal(getAppHref('/login', { hostname: 'localhost', rootDomain: root }), '/login');
  assert.equal(getAppHref('/login', { hostname: 'app.scanosh.com', protocol: 'https:', rootDomain: root }), '/login');
  assert.equal(
    getAppHref('/register', { hostname: 'www.scanosh.com', protocol: 'https:', rootDomain: root }),
    'https://app.scanosh.com/register',
  );
  assert.equal(
    getAppHref('/demo', { hostname: 'www.scanosh.com', protocol: 'https:', rootDomain: root }),
    'https://app.scanosh.com/demo',
  );
});

test('tenantPathFromMenuUrl keeps printed QR nested paths', () => {
  assert.equal(tenantPathFromMenuUrl('/menu/cafe-central'), '/');
  assert.equal(tenantPathFromMenuUrl('/menu/cafe-central/categories'), '/categories');
  assert.equal(tenantPathFromMenuUrl('/menu/cafe-central/cat-1'), '/cat-1');
  assert.equal(tenantPathFromMenuUrl('/tarifs'), null);
});
