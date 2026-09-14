import {
  assignLibraryMatches,
  indexMediaItem,
  MATCH_MIN_SCORE,
  normalizeSearchName,
  pickBestMediaMatch,
  scoreMediaMatch,
} from '../../src/services/productImage.match.js';

function media(id, title, section = 'cafe', description = '') {
  return indexMediaItem({
    id,
    title,
    section,
    description,
    image: `https://example.com/${id}.jpg`,
  });
}

const library = [
  media('orange', "Jus d'orange pressé", 'cafe'),
  media('apple', 'Jus de pomme', 'cafe'),
  media('pomegranate', 'Jus de grenade', 'cafe'),
  media('minttea', 'Thé à la menthe', 'cafe', 'Thé vert, menthe fraîche.'),
  media('infusion', 'Infusion menthe', 'cafe', 'Mot-clés: thé à la menthe.'),
  media('boba', 'Bubble tea tapioca', 'cafe', 'Perles de tapioca. Mot-clés: boba.'),
  media('choco', 'Pain au chocolat', 'cafe', 'Mot-clés: chocolatine.'),
  media('latte', 'Café latte', 'cafe'),
  media('filtre', 'Café filtre', 'cafe'),
  media('margherita', 'Pizza margherita', 'restaurant'),
  media('quatre', 'Pizza quatre fromages', 'restaurant'),
  media('pepperoni', 'Pizza pepperoni', 'restaurant'),
  media('tajine', 'Tajine poulet citron olives', 'restaurant'),
  media('wings', 'Ailes de poulet', 'restaurant'),
  media('nicoise', 'Salade niçoise', 'restaurant'),
  media('marocaine', 'Salade marocaine', 'restaurant'),
];

describe('productImage.match', () => {
  test('normalizes french cafe phrases', () => {
    expect(normalizeSearchName('Thé à la menthe')).toContain('minttea');
    expect(normalizeSearchName('chocolatine')).toContain('painauchocolat');
    expect(normalizeSearchName('jus d’orange')).toContain('orangejuice');
  });

  test('matches distinctive juices and not a random juice', () => {
    const grenade = pickBestMediaMatch('Jus de grenade', library, { sectionKey: 'cafe' });
    expect(grenade.item.title).toBe('Jus de grenade');

    const orange = pickBestMediaMatch("Jus d'orange", library, { sectionKey: 'cafe' });
    expect(orange.item.id).toBe('orange');

    const appleScore = scoreMediaMatch({
      queryName: 'Jus de grenade',
      item: library.find((item) => item.id === 'apple'),
      sectionKey: 'cafe',
    });
    expect(appleScore).toBeLessThan(MATCH_MIN_SCORE);
  });

  test('matches aliases: boba, chocolatine, mint tea', () => {
    expect(pickBestMediaMatch('Boba', library, { sectionKey: 'cafe' }).item.id).toBe('boba');
    expect(pickBestMediaMatch('Chocolatine', library, { sectionKey: 'cafe' }).item.id).toBe('choco');
    expect(pickBestMediaMatch('Atay nana', library, { sectionKey: 'cafe' }).item.id).toBe('minttea');
  });

  test('matches pizza toppings instead of the first pizza', () => {
    const hit = pickBestMediaMatch('Pizza 4 fromages', library, { sectionKey: 'restaurant' });
    expect(hit.item.id).toBe('quatre');
  });

  test('fuzzy-matches margaritta to margherita', () => {
    const hit = pickBestMediaMatch('Pizza margaritta', library, { sectionKey: 'restaurant' });
    expect(hit.item.id).toBe('margherita');
  });

  test('prefers the named salad', () => {
    const hit = pickBestMediaMatch('Salade marocaine', library, { sectionKey: 'restaurant' });
    expect(hit.item.id).toBe('marocaine');
  });

  test('assigns unique photos in a batch', () => {
    const assigned = assignLibraryMatches(
      [
        { id: 'p1', name: 'Jus de grenade', sectionKey: 'cafe' },
        { id: 'p2', name: 'Jus de pomme', sectionKey: 'cafe' },
        { id: 'p3', name: "Jus d'orange", sectionKey: 'cafe' },
      ],
      library,
    );
    const ids = [...assigned.values()].map((hit) => hit?.mediaId).sort();
    expect(ids).toEqual(['apple', 'orange', 'pomegranate']);
  });

  test('prefers Mot-clés over a generic bubble-tea title', () => {
    expect(pickBestMediaMatch('Boba', library, { sectionKey: 'cafe' }).item.id).toBe('boba');
  });

  test('does not auto-match a bare juice or coffee to a random flavored drink', () => {
    expect(pickBestMediaMatch('Jus', library, { sectionKey: 'cafe' })).toBeNull();
    const cafe = pickBestMediaMatch('Café', library, { sectionKey: 'cafe' });
    expect(cafe.item.id).toBe('filtre');
  });

  test('lets identical product names share a photo', () => {
    const assigned = assignLibraryMatches(
      [
        { id: 'a', name: 'Café latte', sectionKey: 'cafe' },
        { id: 'b', name: 'Café latte', sectionKey: 'cafe' },
      ],
      library,
    );
    expect(assigned.get('a')?.mediaId).toBe('latte');
    expect(assigned.get('b')?.mediaId).toBe('latte');
  });
});
