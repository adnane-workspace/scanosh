import { extractJsonObject } from '../../src/services/menuDraft.json.js';

describe('menuDraft.json', () => {
  test('parses fenced json', () => {
    const parsed = extractJsonObject('```json\n{"categories":[{"name":"Jus","products":[]}]}\n```');
    expect(parsed.categories[0].name).toBe('Jus');
  });

  test('closes truncated objects so a long menu still parses', () => {
    const parsed = extractJsonObject(
      '{"categories":[{"name":"Boissons","sectionKey":"cafe","products":[{"name":"Jus orange","price":12',
    );
    expect(parsed.categories).toHaveLength(1);
    expect(parsed.categories[0].products[0].name).toBe('Jus orange');
  });

  test('accepts a root array of categories', () => {
    const parsed = extractJsonObject('[{"name":"Plats","products":[{"name":"Tajine"}]}]');
    expect(parsed.categories[0].name).toBe('Plats');
  });

  test('strips trailing commas', () => {
    const parsed = extractJsonObject('{"categories":[{"name":"Café","products":[{"name":"Latte",}],}],}');
    expect(parsed.categories[0].products[0].name).toBe('Latte');
  });
});
