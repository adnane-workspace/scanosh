import { z } from 'zod';
import { uuidSchema } from './id.schema.js';

const objectIdSchema = uuidSchema;

const imageSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === '' || /^https?:\/\//i.test(value), 'Invalid image URL');

const productBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  price: z.number().min(0),
  image: imageSchema.optional(),
  available: z.boolean().optional(),
  order: z.number().int().optional(),
  categoryId: objectIdSchema,
});

export const createProductSchema = z.object({
  body: productBodySchema,
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      description: z.string().trim().max(500).optional(),
      price: z.number().min(0).optional(),
      image: imageSchema.optional(),
      available: z.boolean().optional(),
      order: z.number().int().optional(),
      categoryId: objectIdSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const suggestProductImageSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.preprocess(
    (value) => (value == null || typeof value !== 'object' ? {} : value),
    z.object({
      overwrite: z.boolean().optional().default(false),
    }),
  ),
});

export const suggestProductImagesBatchSchema = z.object({
  body: z.preprocess(
    (value) => (value == null || typeof value !== 'object' ? {} : value),
    z.object({
      productIds: z.array(objectIdSchema).max(20).optional().default([]),
      onlyMissing: z.boolean().optional().default(true),
      overwrite: z.boolean().optional().default(false),
      limit: z.coerce.number().int().min(1).max(20).optional().default(20),
      stage: z.enum(['auto', 'library', 'flux']).optional().default('auto'),
    }),
  ),
});

export const listMediaLibrarySchema = z.object({
  query: z.object({
    section: z
      .string()
      .trim()
      .optional()
      .default('')
      .transform((value) => {
        if (value === 'cafe' || value === 'restaurant') return value;
        return '';
      }),
    search: z.string().trim().max(120).optional().default(''),
    limit: z.coerce.number().int().min(1).max(500).optional().default(500),
    refresh: z
      .union([z.boolean(), z.string()])
      .optional()
      .default(false)
      .transform((value) => value === true || value === '1' || value === 'true'),
  }),
});

export const applyMediaImageSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      mediaId: z.string().trim().max(80).optional(),
      imageUrl: imageSchema.optional(),
    })
    .refine((data) => Boolean(data.mediaId || data.imageUrl), {
      message: 'mediaId or imageUrl is required',
    }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().max(120).optional().default(''),
    categoryId: objectIdSchema.optional(),
    availability: z.enum(['all', 'available', 'unavailable']).optional().default('all'),
  }),
});
