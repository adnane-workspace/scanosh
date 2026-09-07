import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const MERGE_LEVELS = new Set(['word', 'sentence', 'paragraph']);

function resolveOcrEndpoint() {
  const raw = String(env.OCR_SERVICE_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  if (/\/v1\/ocr$/i.test(raw)) return raw;
  return `${raw}/v1/ocr`;
}

export function isOcrConfigured() {
  return Boolean(resolveOcrEndpoint() && String(env.OCR_SERVICE_TOKEN || '').trim());
}

export async function runOcrOnImage(file, { mergeLevel = 'paragraph' } = {}) {
  const endpoint = resolveOcrEndpoint();
  const token = String(env.OCR_SERVICE_TOKEN || '').trim();

  if (!endpoint || !token) {
    throw new ApiError(503, 'OCR service is not configured', null, 'OCR_NOT_CONFIGURED');
  }

  const level = MERGE_LEVELS.has(mergeLevel) ? mergeLevel : 'paragraph';
  const mime = file.mimetype || 'image/jpeg';
  const imageBase64 = `data:${mime};base64,${file.buffer.toString('base64')}`;

  const controller = new AbortController();
  const timeoutMs = env.OCR_TIMEOUT_MS || 60000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64, mergeLevel: level }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError(504, 'OCR request timed out', null, 'OCR_TIMEOUT');
    }
    throw new ApiError(502, 'OCR service unreachable', null, 'OCR_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const code = payload?.error?.code || payload?.code || 'OCR_PROVIDER_ERROR';
    const message = payload?.error?.message || payload?.message || 'OCR provider error';
    const status = response.status >= 400 && response.status < 600 ? response.status : 502;
    throw new ApiError(status === 401 || status === 403 ? 502 : Math.min(status, 502), message, null, code);
  }

  return {
    text: String(payload?.text || '').trim(),
    blocks: Array.isArray(payload?.blocks) ? payload.blocks : [],
    provider: String(payload?.provider || 'nvidia-nemotron-ocr-v2'),
    mergeLevel: String(payload?.mergeLevel || level),
    durationMs: Number(payload?.meta?.durationMs) || null,
    meta: payload?.meta || null,
  };
}
