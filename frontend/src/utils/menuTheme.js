const NAVY = '#0d1b2a';
const CREAM = '#f7f6f3';
const MUTED_LIGHT = 'rgba(245, 243, 239, 0.72)';
const MUTED_DARK = '#5c6570';

const HEX_COLOR = /^#?([0-9a-fA-F]{6})$/;

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function normalizeHexColor(value) {
  const match = String(value || '').trim().match(HEX_COLOR);
  return match ? `#${match[1].toLowerCase()}` : '';
}

export function relativeLuminance(hex) {
  const normalized = normalizeHexColor(hex);

  if (!normalized) {
    return 0.5;
  }

  const value = normalized.slice(1);
  const red = channel(parseInt(value.slice(0, 2), 16));
  const green = channel(parseInt(value.slice(2, 4), 16));
  const blue = channel(parseInt(value.slice(4, 6), 16));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function isDarkBackdrop(luminance, { hasImage = false } = {}) {
  const threshold = hasImage ? 0.42 : 0.55;
  return luminance < threshold;
}

export function deriveMenuThemeTokens({ luminance, hasImage = false, backgroundColor = '' }) {
  const dark = isDarkBackdrop(luminance, { hasImage });
  const color = normalizeHexColor(backgroundColor) || '#f4f2ee';

  if (dark) {
    const overlayStrength = hasImage ? Math.min(0.62, 0.34 + (0.42 - luminance) * 0.8) : 0;

    return {
      colorScheme: 'dark',
      '--color-background': hasImage ? 'transparent' : color,
      '--color-on-surface': CREAM,
      '--color-on-surface-variant': MUTED_LIGHT,
      '--color-primary': CREAM,
      '--color-on-primary': NAVY,
      '--menu-chrome-bg': 'rgba(13, 27, 42, 0.78)',
      '--menu-chrome-border': 'rgba(255, 255, 255, 0.1)',
      '--menu-chrome-pill-bg': 'rgba(255, 255, 255, 0.14)',
      '--menu-chrome-pill-ring': 'rgba(255, 255, 255, 0.16)',
      '--menu-tab-active-bg': CREAM,
      '--menu-tab-active-text': NAVY,
      '--menu-tab-inactive-text': 'rgba(245, 243, 239, 0.7)',
      '--menu-tab-hover-bg': 'rgba(255, 255, 255, 0.1)',
      '--menu-overlay': `rgba(13, 27, 42, ${overlayStrength})`,
      '--menu-card-bg': '#ffffff',
      '--menu-card-ring': 'rgba(255, 255, 255, 0.22)',
      '--menu-card-shadow': '0 14px 36px rgba(0, 0, 0, 0.22)',
      '--menu-heading-shadow': '0 1px 12px rgba(0, 0, 0, 0.35)',
    };
  }

  const overlayStrength = hasImage ? Math.max(0.12, 0.32 - luminance * 0.25) : 0;

  return {
    colorScheme: 'light',
    '--color-background': color,
    '--color-on-surface': NAVY,
    '--color-on-surface-variant': MUTED_DARK,
    '--color-primary': NAVY,
    '--color-on-primary': CREAM,
    '--menu-chrome-bg': 'rgba(255, 255, 255, 0.9)',
    '--menu-chrome-border': 'rgba(13, 27, 42, 0.08)',
    '--menu-chrome-pill-bg': 'rgba(255, 255, 255, 0.96)',
    '--menu-chrome-pill-ring': 'rgba(13, 27, 42, 0.08)',
    '--menu-tab-active-bg': NAVY,
    '--menu-tab-active-text': CREAM,
    '--menu-tab-inactive-text': 'rgba(13, 27, 42, 0.62)',
    '--menu-tab-hover-bg': 'rgba(13, 27, 42, 0.06)',
    '--menu-overlay': `rgba(13, 27, 42, ${overlayStrength})`,
    '--menu-card-bg': '#ffffff',
    '--menu-card-ring': 'rgba(13, 27, 42, 0.07)',
    '--menu-card-shadow': '0 10px 28px rgba(13, 27, 42, 0.07)',
    '--menu-heading-shadow': 'none',
  };
}

const CARD_RADIUS_CSS = {
  sm: '0.85rem',
  md: '1.2rem',
  lg: '1.7rem',
};

const CARD_RATIO_CSS = {
  square: '1 / 1',
  portrait: '4 / 5',
  landscape: '4 / 3',
};

export function applyCardAppearance(tokens = {}, card = {}) {
  const radius = CARD_RADIUS_CSS[card.radius] || CARD_RADIUS_CSS.md;
  const ratio = CARD_RATIO_CSS[card.imageRatio] || CARD_RATIO_CSS.square;
  const background = normalizeHexColor(card.background) || tokens['--menu-card-bg'] || '#ffffff';

  return {
    ...tokens,
    '--menu-card-bg': background,
    '--menu-card-radius': radius,
    '--menu-card-image-ratio': ratio,
    '--menu-card-ring': tokens['--menu-card-ring'] || 'rgba(13, 27, 42, 0.07)',
    '--menu-card-shadow': tokens['--menu-card-shadow'] || '0 10px 28px rgba(13, 27, 42, 0.07)',
  };
}

export function sampleImageLuminance(src) {
  return new Promise((resolve) => {
    if (!src || typeof window === 'undefined') {
      resolve(0.3);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 48;
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          resolve(0.3);
          return;
        }

        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);
        let total = 0;
        let count = 0;

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3] / 255;

          if (alpha < 0.05) {
            continue;
          }

          const red = data[index] / 255;
          const green = data[index + 1] / 255;
          const blue = data[index + 2] / 255;
          total += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
          count += 1;
        }

        resolve(count ? total / count : 0.3);
      } catch {
        resolve(0.3);
      }
    };

    image.onerror = () => resolve(0.3);
    image.src = src;
  });
}
