import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getApiError } from './apiError.js';

function t(key, vars) {
  const catalog = {
    'apiErrors.CAFE_DISABLED': 'Ce café est désactivé',
    'apiErrors.CATEGORY_MAX_DEPTH': 'Maximum {max} niveaux de catégories',
    'dashboard.loadError': 'Chargement impossible',
  };
  const template = catalog[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => (vars?.[name] == null ? '' : String(vars[name])));
}

test('getApiError translates a known API code', () => {
  const message = getApiError(
    { response: { data: { code: 'CAFE_DISABLED', message: 'This cafe is disabled' } } },
    t,
    'dashboard.loadError',
  );
  assert.equal(message, 'Ce café est désactivé');
});

test('getApiError interpolates details for parameterized codes', () => {
  const message = getApiError(
    { response: { data: { code: 'CATEGORY_MAX_DEPTH', details: { max: 3 }, message: 'Maximum 3 category levels' } } },
    t,
    'dashboard.loadError',
  );
  assert.equal(message, 'Maximum 3 niveaux de catégories');
});

test('getApiError prefers i18n fallback over English API message', () => {
  assert.equal(
    getApiError({ response: { data: { message: 'Fallback from API' } } }, t, 'dashboard.loadError'),
    'Chargement impossible',
  );
});

test('getApiError uses API message when fallback key is missing', () => {
  assert.equal(
    getApiError({ response: { data: { message: 'Fallback from API' } } }, t, 'missing.key'),
    'Fallback from API',
  );
});
