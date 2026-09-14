export const DEFAULT_MENU_UI = {
  theme: 'dark',
  showPhone: true,
  showAddress: true,
  showLanguage: true,
  sectionsEnabled: true,
  sectionVisibility: {
    restaurant: true,
    cafe: true,
  },
  bgMode: 'color',
  backgroundColor: '#f4f2ee',
  backgroundImage: '',
  cardBySection: {},
};

const CARD_LAYOUTS = new Set(['grid', 'list']);
const CARD_RADII = new Set(['sm', 'md', 'lg']);
const CARD_RATIOS = new Set(['square', 'portrait', 'landscape']);
const SECTION_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const DEFAULT_MENU_BACKGROUND = '#f4f2ee';

export const THEME_BACKGROUNDS = {
  light: '#e0e1dd',
  dark: '#0d1b2a',
};

const HEX_COLOR = /^#?([0-9a-fA-F]{6})$/;
const BG_MODES = new Set(['color', 'image']);

export function themeBackground(theme) {
  return theme === 'light' ? THEME_BACKGROUNDS.light : THEME_BACKGROUNDS.dark;
}

export function normalizeHexColor(value) {
  const match = String(value || '').trim().match(HEX_COLOR);
  return match ? `#${match[1].toLowerCase()}` : '';
}

export function normalizeSectionVisibility(value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const result = {
    restaurant: true,
    cafe: true,
  };

  for (const [key, entry] of Object.entries(raw)) {
    const slug = String(key || '').trim();

    if (!slug) {
      continue;
    }

    result[slug] = entry !== false;
  }

  return result;
}

export function defaultSectionCard(sectionKey) {
  return {
    layout: sectionKey === 'restaurant' ? 'list' : 'grid',
    radius: 'md',
    imageRatio: 'square',
    background: '#ffffff',
  };
}

export function normalizeSectionCard(value, sectionKey = '') {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const fallback = defaultSectionCard(sectionKey);

  return {
    layout: CARD_LAYOUTS.has(raw.layout) ? raw.layout : fallback.layout,
    radius: CARD_RADII.has(raw.radius) ? raw.radius : 'md',
    imageRatio: CARD_RATIOS.has(raw.imageRatio) ? raw.imageRatio : 'square',
    background: normalizeHexColor(raw.background) || '#ffffff',
  };
}

function isCardSectionKey(value) {
  const key = String(value || '').toLowerCase().trim();
  return Boolean(key) && key.length <= 40 && SECTION_KEY_RE.test(key);
}

export function normalizeCardBySection(value, legacy = {}) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const hasPerSection = Object.keys(raw).some((key) => isCardSectionKey(key));
  const shared = hasPerSection
    ? {}
    : {
        radius: CARD_RADII.has(legacy.cardRadius) ? legacy.cardRadius : undefined,
        imageRatio: CARD_RATIOS.has(legacy.cardImageRatio) ? legacy.cardImageRatio : undefined,
        background: normalizeHexColor(legacy.cardBackground) || undefined,
        layout: CARD_LAYOUTS.has(legacy.cardLayout) ? legacy.cardLayout : undefined,
      };

  const keys = new Set(['restaurant', 'cafe', ...Object.keys(raw)]);
  const result = {};

  for (const key of keys) {
    if (!isCardSectionKey(key)) continue;
    result[key] = normalizeSectionCard({ ...shared, ...(raw[key] || {}) }, key);
  }

  return result;
}

export function withSectionCards(menuUi, sectionKeys = []) {
  const ui = normalizeMenuUi(menuUi);
  const cardBySection = { ...ui.cardBySection };

  for (const key of sectionKeys) {
    if (!isCardSectionKey(key)) continue;
    cardBySection[key] = normalizeSectionCard(cardBySection[key], key);
  }

  return { ...ui, cardBySection };
}

export function getSectionCard(menuUi, sectionKey) {
  const ui = normalizeMenuUi(menuUi);
  const key = String(sectionKey || '').toLowerCase().trim();
  return ui.cardBySection[key] || defaultSectionCard(key);
}

export function normalizeMenuUi(value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const backgroundImage = typeof raw.backgroundImage === 'string' ? raw.backgroundImage.trim().slice(0, 2048) : '';
  const backgroundColor = normalizeHexColor(raw.backgroundColor) || DEFAULT_MENU_BACKGROUND;

  let bgMode = BG_MODES.has(raw.bgMode) ? raw.bgMode : 'color';

  if (raw.bgMode === 'default') {
    bgMode = 'color';
  }

  return {
    theme: raw.theme === 'light' ? 'light' : 'dark',
    showPhone: raw.showPhone !== false,
    showAddress: raw.showAddress !== false,
    showLanguage: raw.showLanguage !== false,
    sectionsEnabled: true,
    sectionVisibility: normalizeSectionVisibility(raw.sectionVisibility),
    bgMode,
    backgroundColor,
    backgroundImage,
    cardBySection: normalizeCardBySection(raw.cardBySection, raw),
  };
}

export function resolveCardLayout(menuUi, sectionKey) {
  return getSectionCard(menuUi, sectionKey).layout;
}

export function finalizeMenuUi(value) {
  const ui = normalizeMenuUi(value);

  if (ui.bgMode === 'image' && !ui.backgroundImage) {
    return { ...ui, bgMode: 'color' };
  }

  return ui;
}

export function resolveMenuBackdrop(cafe) {
  const ui = normalizeMenuUi(cafe?.menuUi);

  if (ui.bgMode === 'image' && ui.backgroundImage) {
    return { image: ui.backgroundImage, blur: false, color: '' };
  }

  if (ui.bgMode === 'color' && ui.backgroundColor) {
    return { image: '', blur: false, color: ui.backgroundColor };
  }

  if (cafe?.cover) {
    return { image: cafe.cover, blur: false, color: '' };
  }

  if (cafe?.logo) {
    return { image: cafe.logo, blur: true, color: '' };
  }

  return { image: '', blur: false, color: themeBackground(ui.theme) };
}
