import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const FLUX_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FLUX_CACHE_MAX = 200;
const fluxCache = new Map();

function resolveFluxKey() {
  let apiKey = String(env.NVIDIA_API_KEY || env.MENU_LLM_API_KEY || '').trim();
  if (/^bearer\s+/i.test(apiKey)) {
    apiKey = apiKey.replace(/^bearer\s+/i, '').trim();
  }
  return apiKey;
}

function flagEnabled(value, fallback = true) {
  const raw = String(value ?? (fallback ? '1' : '0'))
    .trim()
    .toLowerCase();
  if (!raw) return fallback;
  return raw !== '0' && raw !== 'false' && raw !== 'off';
}

export function isFluxConfigured() {
  return flagEnabled(env.NVIDIA_FLUX_ENABLED, true) && Boolean(resolveFluxKey());
}

function cacheGet(key) {
  const entry = fluxCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    fluxCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function cacheSet(key, value) {
  while (fluxCache.size >= FLUX_CACHE_MAX) {
    const oldest = fluxCache.keys().next().value;
    fluxCache.delete(oldest);
  }
  fluxCache.set(key, { value, expiresAt: Date.now() + FLUX_CACHE_TTL_MS });
}

export function fluxCacheKey(name = '', description = '', sectionKey = '') {
  return [sectionKey || 'any', String(name || '').trim().toLowerCase(), String(description || '').trim().toLowerCase().slice(0, 80)]
    .join('::')
    .slice(0, 200);
}

export function buildFluxPrompt({ name, description = '', sectionKey = null } = {}) {
  const dish = String(name || '').trim().slice(0, 120);
  const details = String(description || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 280);
  const drink =
    sectionKey === 'cafe' ||
    /cafe|café|coffee|latte|espresso|thé|tea|jus|juice|boisson|smoothie|matcha|mocha/i.test(
      `${dish} ${details}`,
    );

  const subject = drink
    ? `appetizing cafe drink: ${dish}${details ? `, ${details}` : ''}`
    : `appetizing plated restaurant dish: ${dish}${details ? `, ${details}` : ''}`;

  return [
    'Professional food photography, 3/4 angle, soft restaurant lighting, sharp focus,',
    'realistic texture, shallow depth of field, no text, no logo, no watermark, no hands, no people.',
    subject,
  ].join(' ');
}

export function extractFluxBase64(payload) {
  if (!payload || typeof payload !== 'object') return '';

  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const fromArtifact = artifacts.find((item) => item?.base64 || item?.b64_json);
  if (fromArtifact?.base64) return String(fromArtifact.base64);
  if (fromArtifact?.b64_json) return String(fromArtifact.b64_json);

  const data = Array.isArray(payload.data) ? payload.data : [];
  if (data[0]?.b64_json) return String(data[0].b64_json);
  if (data[0]?.base64) return String(data[0].base64);

  if (typeof payload.image === 'string' && payload.image) {
    return payload.image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  }
  if (typeof payload.b64_json === 'string') return payload.b64_json;

  return '';
}

function fluxInvokeUrl() {
  const base = String(env.NVIDIA_FLUX_BASE_URL || 'https://ai.api.nvidia.com/v1/genai')
    .trim()
    .replace(/\/+$/, '');
  const model = String(env.NVIDIA_FLUX_MODEL || 'black-forest-labs/flux.2-klein-4b').trim();

  if (/\/v1\/genai$/i.test(base)) {
    return `${base}/${model}`;
  }
  if (/\/images\/generations$/i.test(base)) {
    return base;
  }
  return `${base}/${model}`;
}

async function callFluxApi(prompt) {
  const apiKey = resolveFluxKey();
  if (!apiKey) {
    throw new ApiError(503, 'Flux image generation is not configured', null, 'FLUX_NOT_CONFIGURED');
  }

  const timeoutMs = env.NVIDIA_FLUX_TIMEOUT_MS || 45000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = fluxInvokeUrl();
  const model = String(env.NVIDIA_FLUX_MODEL || 'black-forest-labs/flux.2-klein-4b').trim();
  const openaiStyle = /\/images\/generations/i.test(url);

  const body = openaiStyle
    ? {
        model,
        prompt,
        n: 1,
        response_format: 'b64_json',
      }
    : {
        mode: 'Image Generation',
        prompt,
        height: 1024,
        width: 1024,
        cfg_scale: 0,
        samples: 1,
        seed: 0,
        steps: 4,
      };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.error?.message || payload?.message || `Flux error (${response.status})`;
      throw new ApiError(502, message, null, 'FLUX_PROVIDER_ERROR');
    }

    const base64 = extractFluxBase64(payload);
    if (!base64) {
      throw new ApiError(502, 'Flux returned no image', null, 'FLUX_EMPTY_IMAGE');
    }

    return base64;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new ApiError(504, 'Flux image generation timed out', null, 'FLUX_TIMEOUT');
    }
    throw new ApiError(502, 'Flux image generation unreachable', null, 'FLUX_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generate a product photo via NVIDIA FLUX.2 Klein 4B.
 * Returns a candidate for applyCandidate (reuseUrl: false → Cloudinary upload).
 */
export async function generateFluxProductImage(product = {}) {
  if (!isFluxConfigured()) return null;

  const name = String(product.name || '').trim();
  if (!name) return null;

  const description = String(product.description || '').trim();
  const sectionKey = product.sectionKey || null;
  const key = fluxCacheKey(name, description, sectionKey);
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  try {
    const prompt = buildFluxPrompt({ name, description, sectionKey });
    const base64 = await callFluxApi(prompt);
    const candidate = {
      imageUrl: `data:image/jpeg;base64,${base64}`,
      base64,
      source: 'flux',
      label: name,
      reuseUrl: false,
    };
    cacheSet(key, candidate);
    return candidate;
  } catch (error) {
    console.error('[product-image] flux failed:', error?.code || '', error?.message || error);
    return null;
  }
}
