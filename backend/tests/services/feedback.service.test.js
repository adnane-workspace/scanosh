import { prisma } from '../../src/config/prisma.js';
import { updateMyCafe } from '../../src/services/cafe.service.js';
import {
  createPublicFeedback,
  getCafeFeedbackStats,
  listCafeFeedback,
} from '../../src/services/feedback.service.js';
import { createCafe, createUser } from '../helpers.js';

describe('createPublicFeedback', () => {
  test('keeps low ratings private and stores a high rating with the Google link', async () => {
    const cafe = await createCafe({ googleReviewUrl: 'https://g.page/r/demo/review' });

    const low = await createPublicFeedback({
      slug: cafe.slug,
      rating: 2,
      comment: '<b>Le service</b> était lent',
      ip: '10.0.0.1',
    });

    expect(low).toEqual({ rating: 2 });

    const row = await prisma.feedback.findFirst({ where: { cafeId: cafe.id, rating: 2 } });
    expect(row.comment).toBe('Le service était lent');
    expect(row.ipHash).toEqual(expect.any(String));
    expect(row.sentiment).toBeNull();

    const high = await createPublicFeedback({
      slug: cafe.slug,
      rating: 5,
      comment: 'ne pas stocker',
      ip: '10.0.0.2',
    });

    expect(high).toEqual({
      rating: 5,
      googleReviewUrl: 'https://g.page/r/demo/review',
    });

    const positive = await prisma.feedback.findFirst({ where: { cafeId: cafe.id, rating: 5 } });
    expect(positive.comment).toBe('');
  });

  test('rejects an invalid rating, a long comment, and demo menus', async () => {
    const cafe = await createCafe();

    await expect(createPublicFeedback({ slug: cafe.slug, rating: 9, ip: '1.1.1.1' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_RATING',
    });

    await expect(
      createPublicFeedback({ slug: cafe.slug, rating: 2, comment: 'a'.repeat(1001), ip: '1.1.1.1' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'COMMENT_TOO_LONG',
    });

    const demo = await createCafe({ isDemo: true });
    await expect(createPublicFeedback({ slug: demo.slug, rating: 5, ip: '1.1.1.1' })).rejects.toMatchObject({
      statusCode: 403,
      code: 'FEEDBACK_UNAVAILABLE',
    });
  });

  test('limits repeated submissions from the same address', async () => {
    const cafe = await createCafe();

    await createPublicFeedback({ slug: cafe.slug, rating: 4, ip: '203.0.113.10' });
    await createPublicFeedback({ slug: cafe.slug, rating: 3, comment: 'un peu lent', ip: '203.0.113.10' });
    await createPublicFeedback({ slug: cafe.slug, rating: 2, comment: 'attente', ip: '203.0.113.10' });

    await expect(
      createPublicFeedback({ slug: cafe.slug, rating: 1, comment: 'encore', ip: '203.0.113.10' }),
    ).rejects.toMatchObject({
      statusCode: 429,
      code: 'TOO_MANY_FEEDBACKS',
    });
  });
});

describe('cafe feedback admin queries', () => {
  test('does not return another cafe feedback', async () => {
    const first = await createCafe();
    const second = await createCafe();

    await createPublicFeedback({ slug: first.slug, rating: 5, ip: '198.51.100.1' });
    await createPublicFeedback({ slug: second.slug, rating: 1, comment: 'privé', ip: '198.51.100.2' });

    const list = await listCafeFeedback(first.id, { period: '30d', page: 1, limit: 20 });

    expect(list.items).toHaveLength(1);
    expect(list.items[0].rating).toBe(5);
    expect(list.items[0].ipHash).toBeUndefined();
    expect(list.pagination.total).toBe(1);
  });

  test('paginates feedback', async () => {
    const cafe = await createCafe();

    await prisma.feedback.createMany({
      data: Array.from({ length: 25 }, () => ({
        cafeId: cafe.id,
        rating: 4,
        comment: '',
      })),
    });

    const page = await listCafeFeedback(cafe.id, { period: '30d', page: 2, limit: 20 });

    expect(page.pagination.total).toBe(25);
    expect(page.pagination.totalPages).toBe(2);
    expect(page.items).toHaveLength(5);
    expect(page.pagination.hasPrev).toBe(true);
  });

  test('computes satisfaction against the previous window', async () => {
    const cafe = await createCafe();

    await prisma.feedback.createMany({
      data: [
        { cafeId: cafe.id, rating: 5, comment: '' },
        { cafeId: cafe.id, rating: 5, comment: '' },
        { cafeId: cafe.id, rating: 1, comment: 'attente' },
      ],
    });

    await prisma.feedback.create({
      data: {
        cafeId: cafe.id,
        rating: 1,
        comment: 'ancien',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    });

    const stats = await getCafeFeedbackStats(cafe.id, '30d');

    expect(stats.total).toBe(3);
    expect(stats.positive).toBe(2);
    expect(stats.negative).toBe(1);
    expect(stats.satisfaction).toBe(66.7);
    expect(stats.average).toBe(3.7);
    expect(stats.satisfactionDelta).toBe(66.7);
    expect(stats.distribution.find((row) => row.rating === 5)).toMatchObject({ count: 2 });
  });
});

describe('google review url', () => {
  test('saves a Google link and rejects other hosts', async () => {
    const cafe = await createCafe();
    const user = await createUser({
      cafeId: cafe.id,
      email: `reviews-${cafe.id}@example.com`,
    });

    const saved = await updateMyCafe(user, {
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=abc',
    });

    expect(saved.googleReviewUrl).toContain('https://search.google.com/local/writereview?placeid=abc');

    const withPlace = await updateMyCafe(user, { googleReviewUrl: 'ChIJN1t_tDeuEmsRUsoyG83frY4' });
    expect(withPlace.googleReviewUrl).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    );
    const stored = await prisma.cafe.findUnique({ where: { id: cafe.id }, select: { googlePlaceId: true } });
    expect(stored.googlePlaceId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');

    await expect(updateMyCafe(user, { googleReviewUrl: 'https://evil.example/review' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'GOOGLE_REVIEW_URL_INVALID',
    });

    const cleared = await updateMyCafe(user, { googleReviewUrl: '   ' });
    expect(cleared.googleReviewUrl).toBe('');
    const clearedPlace = await prisma.cafe.findUnique({ where: { id: cafe.id }, select: { googlePlaceId: true } });
    expect(clearedPlace.googlePlaceId).toBeNull();
  });
});
