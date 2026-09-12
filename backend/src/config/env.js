import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vercel injects env vars — never load backend/.env there (CLI deploys can bundle it).
if (!process.env.VERCEL) {
  dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
    quiet: true,
    override: true,
  });
}

// Jest must never inherit the café DATABASE_URL for wipes.
const isJest = Boolean(process.env.JEST_WORKER_ID) || process.env.NODE_ENV === 'test';
if (isJest) {
  const testUrl = String(process.env.TEST_DATABASE_URL || '').trim();
  if (testUrl) {
    process.env.DATABASE_URL = testUrl;
    process.env.DIRECT_URL = testUrl;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().trim().optional().default(''),
  DIRECT_URL: z.string().optional().default(''),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().min(1).default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().trim().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().trim().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_FOLDER: z.string().trim().min(1).default('digital-menu'),
  PRODUCTION_DATABASE_URL: z.string().optional().default(''),
  PRODUCTION_API_URL: z.string().trim().optional().default(''),
  PRODUCTION_CAFE_SLUGS: z.string().optional().default('cafe-central'),
  RESEND_API_KEY: z.string().trim().optional().default(''),
  SMTP_HOST: z.string().trim().optional().default(''),
  SMTP_PORT: z.preprocess(
    (value) => (value === undefined || value === '' ? 587 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
  SMTP_SECURE: z.preprocess((value) => value === true || value === 'true' || value === '1', z.boolean()),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.preprocess(
    (value) => String(value || '').replace(/\s+/g, ''),
    z.string().optional().default(''),
  ),
  MAIL_FROM: z.string().trim().optional().default('Scanosh <contact@scanosh.com>'),
  ROOT_DOMAIN: z.string().trim().optional().default('scanosh.com'),
  OCR_SERVICE_URL: z.string().trim().optional().default(''),
  OCR_SERVICE_TOKEN: z.string().trim().optional().default(''),
  OCR_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  NVIDIA_API_KEY: z.string().trim().optional().default(''),
  MENU_LLM_API_KEY: z.string().trim().optional().default(''),
  MENU_LLM_BASE_URL: z.string().trim().optional().default('https://integrate.api.nvidia.com/v1'),
  MENU_LLM_MODEL: z.string().trim().optional().default('meta/llama-3.2-11b-vision-instruct'),
  MENU_LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(90000),
  PRODUCT_IMAGE_SUGGEST: z.string().trim().optional().default('1'),
  PRODUCT_IMAGE_POLLINATIONS: z.string().trim().optional().default('0'),
  NVIDIA_FLUX_ENABLED: z.string().trim().optional().default('1'),
  NVIDIA_FLUX_MODEL: z.string().trim().optional().default('black-forest-labs/flux.2-klein-4b'),
  NVIDIA_FLUX_BASE_URL: z
    .string()
    .trim()
    .optional()
    .default('https://ai.api.nvidia.com/v1/genai'),
  NVIDIA_FLUX_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
  MENU_MEDIA_API_URL: z
    .string()
    .trim()
    .optional()
    .default('https://cafe-restau-images.vercel.app'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

if (!String(data.DIRECT_URL || '').trim()) {
  data.DIRECT_URL = data.DATABASE_URL;
  process.env.DIRECT_URL = data.DATABASE_URL;
}

export const env = data;

export function normalizeOrigin(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

const extraDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const productionSiteOrigins = [
  'https://www.scanosh.com',
  'https://scanosh.com',
  'https://app.scanosh.com',
  'https://platform.scanosh.com',
];

export const clientOrigins = [
  ...new Set(
    [
      ...env.CLIENT_URL.split(','),
      ...productionSiteOrigins,
      ...(env.NODE_ENV === 'development' ? extraDevOrigins : []),
    ]
      .map(normalizeOrigin)
      .filter(Boolean),
  ),
];
