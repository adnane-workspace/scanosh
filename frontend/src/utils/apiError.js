function detailsVars(details) {
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    return details;
  }

  return {};
}

export function getApiError(err, t, fallbackKey, vars) {
  const data = err?.response?.data;
  const code = data?.code;

  if (code) {
    const key = `apiErrors.${code}`;
    const translated = t(key, { ...detailsVars(data.details), ...vars });

    if (translated && translated !== key) {
      return translated;
    }
  }

  if (data?.message) {
    return data.message;
  }

  if (err?.code === 'ECONNABORTED' || /timeout/i.test(String(err?.message || ''))) {
    const timeoutKey = 'apiErrors.REQUEST_TIMEOUT';
    const translated = t(timeoutKey, vars);
    if (translated && translated !== timeoutKey) {
      return translated;
    }
  }

  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    const networkKey = 'apiErrors.NETWORK_ERROR';
    const translated = t(networkKey, vars);
    if (translated && translated !== networkKey) {
      return translated;
    }
  }

  return t(fallbackKey, vars);
}
