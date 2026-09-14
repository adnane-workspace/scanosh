import assert from 'node:assert/strict';
import test from 'node:test';
import { getSectionCard, normalizeMenuUi, resolveCardLayout, withSectionCards } from './menuUi.js';
import { applyCardAppearance } from './menuTheme.js';

test('normalizeMenuUi defaults restaurant list and cafe grid', () => {
  const ui = normalizeMenuUi({});
  assert.equal(ui.cardBySection.restaurant.layout, 'list');
  assert.equal(ui.cardBySection.cafe.layout, 'grid');
});

test('resolveCardLayout reads the section card', () => {
  assert.equal(resolveCardLayout({}, 'restaurant'), 'list');
  assert.equal(resolveCardLayout({}, 'cafe'), 'grid');
  assert.equal(
    resolveCardLayout({ cardBySection: { cafe: { layout: 'list' } } }, 'cafe'),
    'list',
  );
});

test('withSectionCards adds extra sections', () => {
  const ui = withSectionCards({}, ['restaurant', 'cafe', 'bar']);
  assert.equal(ui.cardBySection.bar.layout, 'grid');
  assert.equal(getSectionCard(ui, 'bar').radius, 'md');
});

test('applyCardAppearance uses section card fields', () => {
  const tokens = applyCardAppearance(
    {},
    { radius: 'lg', background: '#f7f6f3', imageRatio: 'portrait' },
  );
  assert.equal(tokens['--menu-card-radius'], '1.7rem');
  assert.equal(tokens['--menu-card-bg'], '#f7f6f3');
  assert.equal(tokens['--menu-card-image-ratio'], '4 / 5');
});
