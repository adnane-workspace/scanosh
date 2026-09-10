import api from './api.js';

export async function getMyCafe() {
  const { data } = await api.get('/me/cafe');
  return data.data.cafe;
}

export async function updateMyCafe(payload) {
  const { data } = await api.put('/me/cafe', payload);
  return data.data.cafe;
}

export async function generateCafeQr() {
  const { data } = await api.post('/me/cafe/qr/generate');
  return data.data.qr;
}

export async function uploadCafeLogo(file, kind = 'logo') {
  const formData = new FormData();
  formData.append('image', file);

  const query = kind === 'cover' ? '?kind=cover' : kind === 'menuBg' ? '?kind=menuBg' : '';
  const { data } = await api.post(`/me/cafe/upload${query}`, formData);
  return data.data.url;
}
