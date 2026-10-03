const GOOGLE_HOSTS = new Set(['google.com', 'g.page', 'goo.gl', 'maps.app.goo.gl']);
const PLACE_ID_PATTERN = /^ChI[A-Za-z0-9_-]{8,}$/;

function isGoogleHost(hostname) {
  const host = String(hostname || '').toLowerCase();

  if (GOOGLE_HOSTS.has(host)) {
    return true;
  }

  return host.endsWith('.google.com') || host.endsWith('.g.page') || host.endsWith('.goo.gl');
}

export function extractGooglePlaceId(value) {
  const raw = String(value ?? '').trim();

  if (PLACE_ID_PATTERN.test(raw)) {
    return raw;
  }

  let url;

  try {
    url = new URL(raw);
  } catch {
    return '';
  }

  const fromQuery = url.searchParams.get('placeid') || url.searchParams.get('query_place_id') || '';

  if (PLACE_ID_PATTERN.test(fromQuery)) {
    return fromQuery;
  }

  const fromQueryText = String(url.searchParams.get('q') || '').match(/place_id:(ChI[A-Za-z0-9_-]{8,})/);

  return fromQueryText?.[1] || '';
}

export function googleReviewUrlFromPlaceId(placeId) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

export function normalizeGoogleReviewUrl(value) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return '';
  }

  if (PLACE_ID_PATTERN.test(raw)) {
    return googleReviewUrlFromPlaceId(raw);
  }

  let url;

  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.username || url.password || !isGoogleHost(url.hostname)) {
    return null;
  }

  const placeId = extractGooglePlaceId(url.toString());

  if (placeId) {
    return googleReviewUrlFromPlaceId(placeId);
  }

  return url.toString();
}
