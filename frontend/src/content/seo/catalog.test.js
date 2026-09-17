import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getSeoDocumentPaths, getSeoPage, getSeoPaths, SEO_PAGES } from './index.js';

test('SEO pages have unique paths', () => {
  const paths = getSeoPaths();
  assert.equal(paths.length, new Set(paths).size);
});

test('pillar money pages exist', () => {
  for (const path of ['/menu-digital', '/menu-qr-code', '/menu-digital-restaurant', '/menu-digital-cafe', '/menu-digital-snack', '/dashboard-restaurant', '/tarifs', '/contact', '/confidentialite']) {
    assert.ok(getSeoPage(path), path);
  }
});

test('document routes exclude custom tarifs and contact pages', () => {
  const docs = new Set(getSeoDocumentPaths());
  assert.equal(docs.has('/tarifs'), false);
  assert.equal(docs.has('/contact'), false);
  assert.equal(docs.has('/confidentialite'), true);
  assert.equal(docs.has('/menu-digital'), true);
  assert.equal(SEO_PAGES.length > 30, true);
});
