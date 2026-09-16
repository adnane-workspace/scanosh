import api from './api.js';

export async function getPublicMenu(slug) {
  const { data } = await api.get(`/menu/${slug}`, {
    params: { _: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data.data;
}

export async function getPublicDemoMenu() {
  const { data } = await api.get('/menu/public-demo', {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data.data;
}
