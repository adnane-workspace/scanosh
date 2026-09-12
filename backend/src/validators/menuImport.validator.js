import { z } from 'zod';
import { DEFAULT_DRAFT_SECTION_KEY } from '../utils/menuImport.js';
import { isMenuSectionKey } from '../utils/menuSections.js';
import { uuidSchema } from './id.schema.js';
import { paginationFields } from './pagination.schema.js';

const draftProductSchema = z.object({
  id: z.string().trim().max(80).optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(''),
  price: z.preprocess((value) => {
    if (typeof value === 'string') {
      const cleaned = value.trim().replace(/\s/g, '').replace(',', '.');
      if (!cleaned) return 0;
      return cleaned;
    }
    return value;
  }, z.coerce.number().min(0)),
  selected: z.boolean().optional().default(true),
  needsReview: z.boolean().optional().default(false),
  confidence: z.number().min(0).max(1).nullable().optional(),
  image: z.string().trim().max(2048).optional().default(''),
  imageSource: z.string().trim().max(40).optional().default(''),
});

const draftSectionKeySchema = z.preprocess(
  (value) => {
    if (value == null || value === '') return DEFAULT_DRAFT_SECTION_KEY;
    return String(value).trim().toLowerCase();
  },
  z
    .string()
    .refine((value) => isMenuSectionKey(value), 'Invalid section key')
    .default(DEFAULT_DRAFT_SECTION_KEY),
);

const draftCategorySchema = z.object({
  id: z.string().trim().max(80).optional(),
  name: z.string().trim().min(1).max(80),
  sectionKey: draftSectionKeySchema.optional().default(DEFAULT_DRAFT_SECTION_KEY),
  selected: z.boolean().optional().default(true),
  products: z.array(draftProductSchema).default([]),
});

const draftMenuSchema = z.object({
  categories: z.array(draftCategorySchema).max(80),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const listMenuImportsSchema = z.object({
  query: z.object({
    ...paginationFields,
  }),
});

export const menuImportIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const updateMenuImportDraftSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    draftMenu: draftMenuSchema,
  }),
});

export const suggestMenuImportImagesSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.preprocess(
    (value) => (value == null || typeof value !== 'object' ? {} : value),
    z.object({
      draftMenu: draftMenuSchema.optional(),
      stage: z.enum(['auto', 'library', 'flux']).optional().default('auto'),
      overwrite: z.boolean().optional().default(false),
    }),
  ),
});

export const publishMenuImportSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.preprocess(
    (value) => (value == null || typeof value !== 'object' ? {} : value),
    z.object({
      draftMenu: draftMenuSchema.optional(),
    }),
  ),
});
