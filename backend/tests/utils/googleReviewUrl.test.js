import { normalizeGoogleReviewUrl } from '../../src/utils/googleReviewUrl.js';

describe('normalizeGoogleReviewUrl', () => {
  test('accepts Google https links and blank values', () => {
    expect(normalizeGoogleReviewUrl('')).toBe('');
    expect(normalizeGoogleReviewUrl('  https://g.page/r/abc/review  ')).toBe('https://g.page/r/abc/review');
    expect(normalizeGoogleReviewUrl('https://search.google.com/local/writereview?placeid=abc')).toContain(
      'search.google.com',
    );
    expect(normalizeGoogleReviewUrl('https://maps.app.goo.gl/xyz')).toBe('https://maps.app.goo.gl/xyz');
    expect(normalizeGoogleReviewUrl('ChIJN1t_tDeuEmsRUsoyG83frY4')).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    );
    expect(
      normalizeGoogleReviewUrl('https://www.google.com/maps/search/?api=1&query_place_id=ChIJN1t_tDeuEmsRUsoyG83frY4'),
    ).toBe('https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4');
  });

  test('rejects non-Google and non-https urls', () => {
    expect(normalizeGoogleReviewUrl('http://g.page/r/abc')).toBeNull();
    expect(normalizeGoogleReviewUrl('https://evil.example/review')).toBeNull();
    expect(normalizeGoogleReviewUrl('not a url')).toBeNull();
  });
});
