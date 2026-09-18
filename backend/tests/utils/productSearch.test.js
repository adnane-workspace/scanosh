import { productSearchWhere, searchTokens, searchVariants } from '../../src/utils/productSearch.js';

describe('productSearch', () => {
  test('splits multi-word queries', () => {
    expect(searchTokens('pizza  margherita')).toEqual(['pizza', 'margherita']);
  });

  test('keeps a single short character', () => {
    expect(searchTokens('é')).toEqual(['é']);
  });

  test('adds an accent guess for ascii tokens ending with e', () => {
    expect(searchVariants('cafe')).toEqual(expect.arrayContaining(['cafe', 'café']));
  });

  test('builds AND/OR clauses for name, description and category', () => {
    const where = productSearchWhere('cafe latte');
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0].OR.some((clause) => clause.name?.contains === 'cafe')).toBe(true);
    expect(where.AND[0].OR.some((clause) => clause.name?.contains === 'café')).toBe(true);
    expect(where.AND[1].OR.some((clause) => clause.category?.is?.name?.contains === 'latte')).toBe(true);
  });
});
