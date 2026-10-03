import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getHomePath,
  landingSectionId,
  mapLandingSeoRedirect,
  mapLegacyDashboardPath,
} from './paths.js';

test('mapLandingSeoRedirect sends aliases to canonical landing URLs', () => {
  assert.equal(mapLandingSeoRedirect('/home'), '/');
  assert.equal(mapLandingSeoRedirect('/accueil'), '/');
  assert.equal(mapLandingSeoRedirect('/features'), '/fonctionnalites');
  assert.equal(mapLandingSeoRedirect('/product'), '/menu-digital');
  assert.equal(mapLandingSeoRedirect('/produit'), '/menu-digital');
  assert.equal(mapLandingSeoRedirect('/menu-digital'), null);
  assert.equal(mapLandingSeoRedirect('/fonctionnalites'), null);
});

test('landingSectionId maps public landing paths to page sections', () => {
  assert.equal(landingSectionId('/'), 'accueil');
  assert.equal(landingSectionId('/fonctionnalites'), 'fonctionnalites');
  assert.equal(landingSectionId('/menu-digital'), 'produit');
});

test('getHomePath sends cafe admins to /app and superadmins to /platform', () => {
  assert.equal(getHomePath({ role: 'superadmin' }), '/platform');
  assert.equal(getHomePath({ role: 'admin' }), '/app');
  assert.equal(getHomePath(null), '/app');
});

test('mapLegacyDashboardPath keeps bookmarks working', () => {
  assert.equal(mapLegacyDashboardPath('/dashboard', { role: 'admin' }), '/app');
  assert.equal(mapLegacyDashboardPath('/dashboard', { role: 'superadmin' }), '/platform');
  assert.equal(mapLegacyDashboardPath('/dashboard/products', { role: 'admin' }), '/app/products');
  assert.equal(mapLegacyDashboardPath('/dashboard/cafes/abc', { role: 'superadmin' }), '/platform/cafes/abc');
  assert.equal(mapLegacyDashboardPath('/dashboard/reviews', { role: 'admin' }), '/app/reviews');
  assert.equal(mapLegacyDashboardPath('/dashboard/settings', { role: 'admin' }), '/app/settings');
  assert.equal(mapLegacyDashboardPath('/dashboard/settings', { role: 'superadmin' }), '/platform/settings');
});
