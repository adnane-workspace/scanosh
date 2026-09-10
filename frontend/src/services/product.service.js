import { clearPublicMenuCache } from '../hooks/usePublicMenu.js';
import api from './api.js';

export async function getProducts(params = {}) {
  const { data } = await api.get('/me/products', { params });
  return {
    items: data.data.products,
    pagination: data.data.pagination,
  };
}

export async function createProduct(payload) {
  const { data } = await api.post('/me/products', payload);
  clearPublicMenuCache();
  return data.data.product;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/me/products/${id}`, payload);
  clearPublicMenuCache();
  return data.data.product;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/me/products/${id}`);
  clearPublicMenuCache();
  return data;
}

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await api.post('/me/products/upload', formData);
  return data.data.url;
}

export async function getProductImageSuggestStatus() {
  const { data } = await api.get('/me/products/image-suggest/status');
  return data.data;
}

export async function suggestProductImage(id, { overwrite = false } = {}) {
  const { data } = await api.post(
    `/me/products/${id}/suggest-image`,
    { overwrite },
    { timeout: 120000 },
  );
  clearPublicMenuCache();
  return data.data;
}

export async function suggestProductImagesBatch(payload = {}) {
  const { data } = await api.post('/me/products/suggest-images', payload, {
    timeout: 300000,
  });
  clearPublicMenuCache();
  return data.data;
}

export async function listMediaLibrary(params = {}) {
  const { data } = await api.get('/me/products/media-library', { params });
  return data.data;
}

export async function getProductImageCandidates(id) {
  const { data } = await api.get(`/me/products/${id}/image-candidates`);
  return data.data;
}

export async function applyMediaImage(id, payload = {}) {
  const { data } = await api.post(`/me/products/${id}/apply-media-image`, payload, {
    timeout: 120000,
  });
  clearPublicMenuCache();
  return data.data;
}
