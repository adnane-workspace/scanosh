import api from './api.js';

export async function getMenuImportStatus() {
  const { data } = await api.get('/me/menu-imports/status');
  return data.data;
}

export async function createMenuImport(file, { mergeLevel = 'paragraph' } = {}) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('mergeLevel', mergeLevel);

  const { data } = await api.post('/me/menu-imports', formData, {
    // OCR + LLM can exceed 2 minutes; keep above MENU_LLM_TIMEOUT_MS.
    timeout: 240000,
  });
  return data.data.import;
}

export async function listMenuImports(params = {}) {
  const { data } = await api.get('/me/menu-imports', { params });
  return {
    items: data.data.imports,
    pagination: data.data.pagination,
  };
}

export async function updateMenuImportDraft(id, draftMenu) {
  const { data } = await api.put(`/me/menu-imports/${id}/draft`, { draftMenu });
  return data.data.import;
}

export async function suggestMenuImportImages(id, payload = {}) {
  const { data } = await api.post(`/me/menu-imports/${id}/suggest-images`, payload, {
    timeout: 300000,
  });
  return data.data;
}

export async function publishMenuImport(id, draftMenu) {
  const payload = draftMenu ? { draftMenu } : {};
  const { data } = await api.post(`/me/menu-imports/${id}/publish`, payload, {
    timeout: 180000,
  });
  return data.data;
}
