import { cleanProductName, normalizeDraftMenu } from '../../src/services/menuDraft.extractor.js';

describe('menuDraft name cleanup', () => {
  test('strips currency symbols left in product names', () => {
    expect(cleanProductName('Expresso $')).toBe('Expresso');
    expect(cleanProductName('Double Expresso $')).toBe('Double Expresso');
    expect(cleanProductName('Latte  DH')).toBe('Latte');
  });

  test('renames a cafe venue category when products are drinks', () => {
    const draft = normalizeDraftMenu({
      categories: [
        {
          name: 'The Reasted Bean',
          sectionKey: 'cafe',
          products: [
            { name: 'Expresso $', description: 'Coffee', price: 5 },
            { name: 'Cappucino $', price: 4 },
          ],
        },
      ],
    });
    expect(draft.categories[0].name).toBe('Cafés');
    expect(draft.categories[0].products[0].name).toBe('Expresso');
    expect(draft.categories[0].products[0].description).toBe('');
    expect(draft.categories[0].products[1].name).toBe('Cappucino');
    expect(draft.categories[0].products[1].description).toBe('');
  });
});
