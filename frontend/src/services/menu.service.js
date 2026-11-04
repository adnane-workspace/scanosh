import api from './api.js';

export async function getPublicMenu(slug) {
  const { data } = await api.get(`/menu/${slug}`, {
    params: { _: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data.data;
}

export async function getPublicMenuView(slug, { view, section, categoryId } = {}) {
  const params = { view };

  if (section) {
    params.section = section;
  }

  if (categoryId) {
    params.categoryId = categoryId;
  }

  const { data } = await api.get(`/menu/${slug}`, { params });
  return data.data;
}

export async function getPublicDemoMenu() {
  const { data } = await api.get('/menu/public-demo', {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data.data;
}
