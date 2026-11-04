import { z } from 'zod';

export const publicMenuSlugSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid menu slug'),
  }),
  query: z
    .object({
      view: z.enum(['landing', 'sections', 'category']).optional(),
      section: z.string().trim().max(40).optional(),
      categoryId: z.string().trim().max(80).optional(),
    })
    .optional(),
});
