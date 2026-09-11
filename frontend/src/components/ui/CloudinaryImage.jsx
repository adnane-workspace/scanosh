import { cloudinarySrcSet, getOptimizedCloudinaryUrl, IMAGE_PRESETS } from '../../utils/cloudinary.js';

export default function CloudinaryImage({
  src,
  alt = '',
  className = '',
  preset,
  widths,
  crop,
  gravity,
  sizes,
  lazy,
  fetchPriority,
  width,
  height,
  decoding = 'async',
  onError,
  hintUrl,
}) {
  if (!src) {
    return null;
  }

  const config = {
    ...(IMAGE_PRESETS[preset] || {}),
  };

  if (widths) {
    config.widths = widths;
  }

  if (crop !== undefined) {
    config.crop = crop;
  }

  if (gravity !== undefined) {
    config.gravity = gravity;
  }

  if (sizes) {
    config.sizes = sizes;
  }

  if (lazy !== undefined) {
    config.lazy = lazy;
  }

  const srcWidths = config.widths || [800];
  const transform = {
    crop: config.crop,
    gravity: config.gravity,
    quality: config.quality,
    sharpen: config.sharpen,
    hintUrl,
  };
  const fallbackWidth = srcWidths[Math.min(1, srcWidths.length - 1)] || srcWidths[0];
  const optimized = getOptimizedCloudinaryUrl(src, { ...transform, width: fallbackWidth });
  const srcSet = cloudinarySrcSet(src, srcWidths, transform);
  const loading = config.lazy === false ? 'eager' : 'lazy';

  return (
    <img
      src={optimized || src}
      srcSet={srcSet}
      sizes={config.sizes}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      width={width}
      height={height}
      onError={onError}
      style={{ imageRendering: 'auto' }}
    />
  );
}
