const CLOUDINARY_HOST = 'res.cloudinary.com';

let runtimeCloudName = '';

export function setRuntimeCloudinaryCloudName(urlOrName = '') {
  const value = String(urlOrName || '').trim();
  if (!value) return;
  if (value.includes(CLOUDINARY_HOST)) {
    runtimeCloudName = extractCloudName(value) || runtimeCloudName;
    return;
  }
  if (/^[a-z0-9_-]+$/i.test(value)) {
    runtimeCloudName = value;
  }
}

function resolveCloudName(options = {}) {
  return (
    options.cloudName ||
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    extractCloudName(options.hintUrl || '') ||
    runtimeCloudName ||
    ''
  );
}

export function isCloudinaryUrl(url) {
  return (
    typeof url === 'string' &&
    url.includes(CLOUDINARY_HOST) &&
    (url.includes('/upload/') || url.includes('/fetch/'))
  );
}

function isTransformationSegment(part) {
  return Boolean(part) && (part.includes(',') || /^(f_|q_|w_|h_|c_|g_|e_|fl_|dpr_)/.test(part));
}

export function stripCloudinaryTransforms(url) {
  const value = String(url || '').trim();

  if (!value || !isCloudinaryUrl(value)) {
    return value;
  }

  const marker = value.includes('/fetch/') ? '/fetch/' : '/upload/';
  const index = value.indexOf(marker);

  if (index < 0) {
    return value;
  }

  const after = value.slice(index + marker.length);
  const queryIndex = after.indexOf('?');
  const path = queryIndex >= 0 ? after.slice(0, queryIndex) : after;
  const query = queryIndex >= 0 ? after.slice(queryIndex) : '';
  const parts = path.split('/');
  let start = 0;

  // For /fetch/, first segment(s) may be transforms then the remote URL path.
  // Only strip transform segments; keep the rest (including https: empty part).
  while (start < parts.length && isTransformationSegment(parts[start])) {
    start += 1;
  }

  return `${value.slice(0, index + marker.length)}${parts.slice(start).join('/')}${query}`;
}

function extractCloudName(url) {
  const match = String(url || '').match(/res\.cloudinary\.com\/([^/]+)\//i);
  return match?.[1] || '';
}

/**
 * Deliver remote (non-Cloudinary) images via Cloudinary fetch for sharp CDN resizing.
 * Uses the cloud name of `hintUrl` (e.g. cafe logo) when available.
 */
export function toCloudinaryFetchUrl(remoteUrl, options = {}) {
  const source = String(remoteUrl || '').trim();
  if (!source || isCloudinaryUrl(source)) {
    return source;
  }

  const cloud = resolveCloudName(options);

  if (!cloud) {
    return source;
  }

  const {
    width = 1200,
    crop = 'limit',
    quality = 'auto:good',
    format = 'auto',
    sharpen = 50,
  } = options;

  const parts = [`f_${format}`, `q_${quality}`, `c_${crop}`, `w_${Math.round(width)}`, 'dpr_auto'];
  if (sharpen) {
    parts.push(`e_sharpen:${sharpen}`);
  }

  return `https://res.cloudinary.com/${cloud}/image/fetch/${parts.join(',')}/${encodeURIComponent(source)}`;
}

export function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url) {
    return '';
  }

  if (!isCloudinaryUrl(url)) {
    return toCloudinaryFetchUrl(url, {
      width: options.width || 1200,
      crop: options.crop === 'fill' ? 'fill' : 'limit',
      quality: options.quality || 'auto:good',
      sharpen: options.sharpen ?? 40,
      hintUrl: options.hintUrl,
      cloudName: options.cloudName,
    });
  }

  const canonical = stripCloudinaryTransforms(url);
  const marker = canonical.includes('/fetch/') ? '/fetch/' : '/upload/';
  const {
    width,
    height,
    crop,
    gravity,
    quality = 'auto:good',
    format = 'auto',
    sharpen = 40,
  } = options;

  const parts = [`f_${format}`, `q_${quality}`, 'dpr_auto'];

  if (crop) {
    parts.push(`c_${crop}`);
  }

  if (gravity) {
    parts.push(`g_${gravity}`);
  }

  if (width) {
    parts.push(`w_${Math.round(width)}`);
  }

  if (height) {
    parts.push(`h_${Math.round(height)}`);
  }

  if (sharpen) {
    parts.push(`e_sharpen:${sharpen}`);
  }

  const index = canonical.indexOf(marker);
  if (index < 0) {
    return canonical;
  }

  return `${canonical.slice(0, index + marker.length)}${parts.join(',')}/${canonical.slice(index + marker.length)}`;
}

export function cloudinarySrcSet(url, widths, options = {}) {
  if (!url || !Array.isArray(widths) || widths.length === 0) {
    return undefined;
  }

  // Build srcset for Cloudinary upload/fetch OR remote via fetch delivery.
  if (!isCloudinaryUrl(url) && !resolveCloudName(options)) {
    return undefined;
  }

  return widths
    .map((width) => `${getOptimizedCloudinaryUrl(url, { ...options, width })} ${width}w`)
    .join(', ');
}

export const IMAGE_PRESETS = {
  productCard: {
    // Retina-friendly widths so menu cards stay sharp on phones.
    widths: [640, 960, 1280],
    crop: 'fill',
    gravity: 'auto',
    sharpen: 50,
    quality: 'auto:good',
    sizes: '(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 320px',
    lazy: true,
  },
  productSheet: {
    widths: [800, 1200, 1600],
    crop: 'fill',
    gravity: 'auto',
    sharpen: 40,
    quality: 'auto:good',
    sizes: '(max-width: 640px) 100vw, 520px',
    lazy: false,
  },
  categoryCover: {
    widths: [640, 960, 1280],
    crop: 'fill',
    gravity: 'auto',
    sharpen: 40,
    quality: 'auto:good',
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px',
    lazy: true,
  },
  logo: {
    widths: [80, 160, 240],
    crop: 'fill',
    gravity: 'auto',
    sizes: '40px',
    lazy: false,
  },
  logoHero: {
    widths: [160, 240, 360],
    crop: 'fill',
    gravity: 'auto',
    sizes: '(max-width: 640px) 18vmin, 144px',
    lazy: false,
  },
  cover: {
    widths: [800, 1200, 1600],
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto:good',
    sizes: '100vw',
    lazy: false,
  },
  thumb: {
    widths: [80, 160],
    crop: 'fill',
    gravity: 'auto',
    sizes: '44px',
    lazy: true,
  },
  preview: {
    widths: [200, 400],
    crop: 'fill',
    gravity: 'auto',
    sizes: '112px',
    lazy: false,
  },
  lightbox: {
    widths: [1200, 1600, 2000],
    quality: 'auto:good',
    sizes: '90vw',
    lazy: false,
  },
};
