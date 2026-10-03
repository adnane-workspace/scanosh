import { createHash } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { assertCommentLength, sanitizeFeedbackComment } from '../utils/feedbackText.js';
import { buildPaginationMeta, paginatedResult, parsePaginationQuery } from '../utils/pagination.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_PER_HOUR = 3;

const PERIODS = {
  today: 'today',
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function hashFeedbackIp(ip) {
  return createHash('sha256').update(`feedback:${ip || 'unknown'}:${env.JWT_SECRET}`).digest('hex');
}

export function periodRange(period = '30d', now = new Date()) {
  const key = PERIODS[period] ? period : '30d';
  const end = new Date(now);
  const start = new Date(now);

  if (key === 'today') {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setTime(end.getTime() - PERIODS[key] * DAY_MS);
  }

  const duration = Math.max(end.getTime() - start.getTime(), 1);
  const previousEnd = new Date(start);
  const previousStart = new Date(start.getTime() - duration);

  return { period: key, start, end, previousStart, previousEnd };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

export function summarizeRatings(groups) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;

  for (const row of groups) {
    const rating = Number(row.rating);
    const count = row._count?._all || 0;

    if (!counts[rating] && counts[rating] !== 0) {
      continue;
    }

    counts[rating] = count;
    total += count;
    sum += rating * count;
  }

  const positive = counts[4] + counts[5];
  const negative = total - positive;
  const satisfaction = total ? round1((positive / total) * 100) : 0;
  const average = total ? round1(sum / total) : 0;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: counts[rating],
    percent: total ? Math.round((counts[rating] / total) * 100) : 0,
  }));

  return { average, total, positive, negative, satisfaction, distribution };
}

function assertRating(rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Invalid rating', null, 'INVALID_RATING');
  }
}

export async function createPublicFeedback({ slug, rating, comment = '', ip }) {
  assertRating(rating);

  if (!assertCommentLength(comment)) {
    throw new ApiError(400, 'Comment is too long', null, 'COMMENT_TOO_LONG');
  }

  const cafe = await prisma.cafe.findUnique({
    where: { slug },
    select: { id: true, isActive: true, isDemo: true, googleReviewUrl: true },
  });

  if (!cafe) {
    throw new ApiError(404, 'Menu not found', null, 'MENU_NOT_FOUND');
  }

  if (!cafe.isActive) {
    throw new ApiError(403, 'Menu unavailable', null, 'MENU_UNAVAILABLE');
  }

  if (cafe.isDemo) {
    throw new ApiError(403, 'Feedback is unavailable for this menu', null, 'FEEDBACK_UNAVAILABLE');
  }

  const ipHash = hashFeedbackIp(ip);
  const since = new Date(Date.now() - HOUR_MS);
  const recent = await prisma.feedback.count({
    where: { cafeId: cafe.id, ipHash, createdAt: { gte: since } },
  });

  if (recent >= MAX_PER_HOUR) {
    throw new ApiError(429, 'Too many feedback submissions', null, 'TOO_MANY_FEEDBACKS');
  }

  const isPositive = rating >= 4;
  const storedComment = isPositive ? '' : sanitizeFeedbackComment(comment);

  await prisma.feedback.create({
    data: {
      cafeId: cafe.id,
      rating,
      comment: storedComment,
      tags: [],
      ipHash,
    },
  });

  return {
    rating,
    ...(isPositive && cafe.googleReviewUrl ? { googleReviewUrl: cafe.googleReviewUrl } : {}),
  };
}

function listWhere(cafeId, { rating, period }) {
  const range = periodRange(period);
  const where = {
    cafeId,
    createdAt: { gte: range.start },
  };

  if (rating) {
    where.rating = rating;
  }

  return where;
}

export async function listCafeFeedback(cafeId, query = {}) {
  const pagination = parsePaginationQuery(query);
  const where = listWhere(cafeId, query);
  const [total, items] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    }),
  ]);

  return paginatedResult(items, buildPaginationMeta({ ...pagination, total }));
}

export async function getCafeFeedbackStats(cafeId, period = '30d') {
  const range = periodRange(period);
  const [current, previous] = await Promise.all([
    prisma.feedback.groupBy({
      by: ['rating'],
      where: { cafeId, createdAt: { gte: range.start } },
      _count: { _all: true },
    }),
    prisma.feedback.groupBy({
      by: ['rating'],
      where: { cafeId, createdAt: { gte: range.previousStart, lt: range.previousEnd } },
      _count: { _all: true },
    }),
  ]);

  const summary = summarizeRatings(current);
  const previousSummary = summarizeRatings(previous);

  return {
    ...summary,
    period: range.period,
    satisfactionDelta: round1(summary.satisfaction - previousSummary.satisfaction),
  };
}
