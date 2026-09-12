import { buildFluxPrompt, extractFluxBase64, fluxCacheKey } from '../../src/services/productImage.flux.js';

describe('productImage.flux helpers', () => {
  test('builds a food prompt from name and description', () => {
    const prompt = buildFluxPrompt({
      name: 'Tajine poulet',
      description: 'olives, citron confit',
      sectionKey: 'restaurant',
    });
    expect(prompt).toMatch(/Tajine poulet/);
    expect(prompt).toMatch(/olives/);
    expect(prompt).toMatch(/no text/);
    expect(prompt).toMatch(/plated restaurant dish/);
  });

  test('treats cafe section as a drink shot', () => {
    const prompt = buildFluxPrompt({ name: 'Café latte', sectionKey: 'cafe' });
    expect(prompt).toMatch(/cafe drink/);
  });

  test('extracts base64 from NVIDIA artifacts payload', () => {
    expect(extractFluxBase64({ artifacts: [{ base64: 'abc123' }] })).toBe('abc123');
    expect(extractFluxBase64({ data: [{ b64_json: 'xyz' }] })).toBe('xyz');
    expect(extractFluxBase64({ image: 'data:image/png;base64,hello' })).toBe('hello');
  });

  test('builds a stable cache key', () => {
    expect(fluxCacheKey('Pizza', 'fromage', 'restaurant')).toBe('restaurant::pizza::fromage');
  });
});
