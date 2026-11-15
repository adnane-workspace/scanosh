import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(120),
    cafeName: z.string().trim().min(2).max(120),
    locale: z.preprocess((value) => (value === 'en' ? 'fr' : value), z.enum(['fr', 'ar']).optional()),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(120),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    locale: z.preprocess((value) => (value === 'en' ? 'fr' : value), z.enum(['fr', 'ar']).optional()),
  }),
});

export const resendVerificationSchema = forgotPasswordSchema;

export const verifyResetCodeSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/),
    newPassword: z.string().min(8).max(120),
  }),
});
