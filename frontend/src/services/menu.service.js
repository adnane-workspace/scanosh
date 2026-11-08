import { API_URL } from '../utils/constants.js';

async function fetchMenuJson(path, { params = {}, cache = 'default' } = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  const url = `${API_URL}${path}${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `HTTP ${response.status}`);
    error.response = {
      status: response.status,
      data: payload,
    };
    throw error;
  }

  return payload?.data;
}

export async function getPublicMenu(slug) {
  return fetchMenuJson(`/menu/${encodeURIComponent(slug)}`, {
    params: { _: Date.now() },
    cache: 'no-store',
  });
}

export async function getPublicMenuView(slug, { view, section, categoryId } = {}) {
  const params = { view };

  if (section) {
    params.section = section;
  }

  if (categoryId) {
    params.categoryId = categoryId;
  }

  return fetchMenuJson(`/menu/${encodeURIComponent(slug)}`, { params });
}

export async function getPublicDemoMenu() {
  return fetchMenuJson('/menu/public-demo', { cache: 'no-store' });
}
