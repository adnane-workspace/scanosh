import { useEffect, useState } from 'react';
import { getOptimizedCloudinaryUrl, IMAGE_PRESETS } from '../utils/cloudinary.js';

export function useProductImageReady(src) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const source = String(src || '').trim();
    if (!source) {
      return undefined;
    }

    const preset = IMAGE_PRESETS.productCard;
    const url =
      getOptimizedCloudinaryUrl(source, {
        width: preset.widths[0],
        crop: preset.crop,
        gravity: preset.gravity,
        quality: preset.quality,
        sharpen: preset.sharpen,
      }) || source;

    const image = new Image();
    let cancelled = false;

    image.onload = () => {
      if (!cancelled) setReady(true);
    };
    image.onerror = () => {
      if (!cancelled) setReady(false);
    };
    image.src = url;

    if (image.complete && image.naturalWidth > 0) {
      setReady(true);
    }

    return () => {
      cancelled = true;
    };
  }, [src]);

  return Boolean(src) && ready;
}
