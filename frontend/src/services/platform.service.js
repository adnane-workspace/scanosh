import api from './api.js';

export async function getPlatformOverview() {
  const { data } = await api.get('/platform/overview');
  return data.data.overview;
}

export async function listPlatformCafeOptions() {
  const { data } = await api.get('/platform/cafes/options');
  return data.data.cafes;
}

export async function getStorageReport({ refresh = false, page = 1, limit = 20 } = {}) {
  const { data } = await api.get('/platform/storage', {
    params: {
      page,
      limit,
      ...(refresh ? { refresh: '1' } : {}),
    },
  });
  return data.data.report;
}

export async function listActivityLogs(params = {}) {
  const { data } = await api.get('/platform/logs', { params });
  return data.data;
}

export async function listPlatformCafes(params = {}) {
  const { data } = await api.get('/platform/cafes', { params });
  return {
    items: data.data.cafes,
    pagination: data.data.pagination,
  };
}

export async function createPlatformCafe(payload) {
  const { data } = await api.post('/platform/cafes', payload);
  return data.data.cafe;
}

export async function getPlatformCafe(id) {
  const { data } = await api.get(`/platform/cafes/${id}`);
  return data.data.cafe;
}

export async function updatePlatformCafe(id, payload) {
  const { data } = await api.patch(`/platform/cafes/${id}`, payload);
  return data.data.cafe;
}

export async function deletePlatformCafe(id) {
  const { data } = await api.delete(`/platform/cafes/${id}`);
  return data.data.cafe;
}

export async function resetPlatformCafePassword(id, password) {
  const { data } = await api.post(`/platform/cafes/${id}/password`, { password });
  return data.data;
}

export async function updatePlatformCafeOwnerEmail(id, email) {
  const { data } = await api.post(`/platform/cafes/${id}/email`, { email });
  return data.data;
}

export async function listTrialLeads(params = {}) {
  const { data } = await api.get('/platform/trial-leads', { params });
  return {
    items: data.data.leads,
    pagination: data.data.pagination,
  };
}
