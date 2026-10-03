import { z } from 'zod';
import { paginationFields } from './pagination.schema.js';

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid menu slug');

const periodSchema = z.enum(['today', '7d', '30d', '90d']).optional().default('30d');

const ratingFilter = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(5).optional(),
);

export const createFeedbackSchema = z.object({
  params: z.object({
    slug: slugSchema,
  }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().optional().default(''),
  }),
});

export const listFeedbackSchema = z.object({
  query: z.object({
    ...paginationFields,
    period: periodSchema,
    rating: ratingFilter,
  }),
});

export const feedbackStatsSchema = z.object({
  query: z.object({
    period: periodSchema,
  }),
});
