import api from './api.js';

export async function submitMenuFeedback(slug, payload) {
  const { data } = await api.post(`/menu/${encodeURIComponent(slug)}/feedback`, payload);
  return data.data;
}

export async function listFeedback(params = {}) {
  const { data } = await api.get('/me/feedback', { params });
  return {
    items: data.data.feedback,
    pagination: data.data.pagination,
  };
}

export async function getFeedbackStats(params = {}) {
  const { data } = await api.get('/me/feedback/stats', { params });
  return data.data.stats;
}
