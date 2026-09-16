import { z } from 'zod';
import { ACTIVITY_ACTIONS } from '../services/activity.service.js';
import { uuidSchema } from './id.schema.js';
import { paginationFields } from './pagination.schema.js';

export const updateCafeSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
        .max(80)
        .optional(),
      description: z.string().trim().max(500).optional(),
      logo: z.string().trim().max(2048).optional(),
      cover: z.string().trim().max(2048).optional(),
      address: z.string().trim().max(200).optional(),
      phone: z.string().trim().max(30).optional(),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      menuUi: z
        .object({
          theme: z.enum(['light', 'dark']).optional(),
          showPhone: z.boolean().optional(),
          showAddress: z.boolean().optional(),
          showLanguage: z.boolean().optional(),
          sectionsEnabled: z.boolean().optional(),
          sectionVisibility: z.record(z.string(), z.boolean()).optional(),
          bgMode: z.enum(['color', 'image', 'default']).optional(),
          backgroundColor: z.string().trim().max(16).optional(),
          backgroundImage: z.string().trim().max(2048).optional(),
          cardBySection: z
            .record(
              z.string().max(40),
              z
                .object({
                  layout: z.enum(['grid', 'list']).optional(),
                  radius: z.enum(['sm', 'md', 'lg']).optional(),
                  imageRatio: z.enum(['square', 'portrait', 'landscape']).optional(),
                  background: z.string().trim().max(16).optional(),
                })
                .optional(),
            )
            .optional(),
          cardLayout: z.enum(['auto', 'grid', 'list']).optional(),
          cardRadius: z.enum(['sm', 'md', 'lg']).optional(),
          cardImageRatio: z.enum(['square', 'portrait', 'landscape']).optional(),
          cardBackground: z.string().trim().max(16).optional(),
        })
        .optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    })
    .refine(
      (value) => {
        const hasLat = value.latitude !== undefined && value.latitude !== null;
        const hasLng = value.longitude !== undefined && value.longitude !== null;
        const cleared = value.latitude === null && value.longitude === null;
        const omitted = value.latitude === undefined && value.longitude === undefined;

        return cleared || omitted || (hasLat && hasLng);
      },
      { message: 'Latitude and longitude must be set together' },
    ),
});

export const createPlatformCafeSchema = z.object({
  body: z.object({
    ownerName: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(120),
    cafeName: z.string().trim().min(2).max(120),
    slug: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
        .max(80)
        .optional(),
    ),
  }),
});

export const platformCafeIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const resetPlatformCafePasswordSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    password: z.string().min(8).max(120),
  }),
});

export const updatePlatformCafeEmailSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
  }),
});

export const listPlatformCafesSchema = z.object({
  query: z.object({
    ...paginationFields,
    q: z.string().trim().max(120).optional().default(''),
    status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
  }),
});

export const listActivityLogsSchema = z.object({
  query: z.object({
    ...paginationFields,
    action: z
      .string()
      .refine((value) => ACTIVITY_ACTIONS.includes(value), 'Invalid action')
      .optional(),
    cafeId: uuidSchema.optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    search: z.string().trim().max(120).optional().default(''),
  }),
});

export const updatePlatformCafeSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z
    .object({
      isActive: z.boolean().optional(),
      trialRole: z.enum(['none', 'playground', 'template']).optional(),
      isDemo: z.boolean().optional(),
    })
    .refine(
      (value) =>
        value.isActive !== undefined || value.trialRole !== undefined || value.isDemo !== undefined,
      {
        message: 'At least one field is required',
      },
    ),
});
