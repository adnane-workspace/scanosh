const CODE_FIELDS = {
  EMAIL_IN_USE: 'email',
  INVALID_SLUG: 'slug',
  SLUG_RESERVED: 'slug',
  SLUG_IN_USE: 'slug',
};

const FIELD_MESSAGE_KEYS = {
  name: 'auth.fieldName',
  ownerName: 'auth.fieldName',
  email: 'auth.emailInvalid',
  password: 'auth.fieldPassword',
  cafeName: 'auth.fieldCafeName',
  slug: 'auth.fieldSlugInvalid',
};

function detailsVars(details) {
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    return details;
  }

  return {};
}

function translateOrNull(t, key, vars) {
  if (!key) {
    return null;
  }

  const translated = t(key, vars);
  return translated && translated !== key ? translated : null;
}

export function getApiError(err, t, fallbackKey, vars) {
  const data = err?.response?.data;
  const code = data?.code;
  const mergedVars = { ...detailsVars(data?.details), ...vars };

  if (code) {
    const key = `apiErrors.${code}`;
    const translated = t(key, mergedVars);

    if (translated && translated !== key) {
      return translated;
    }
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

  if (fallbackKey) {
    const translated = t(fallbackKey, vars);
    if (translated && translated !== fallbackKey) {
      return translated;
    }
  }

  if (data?.message) {
    return data.message;
  }

  return fallbackKey ? t(fallbackKey, vars) : t('apiErrors.INTERNAL_ERROR', vars);
}

export function getApiFieldErrors(err, t) {
  const data = err?.response?.data;
  const code = data?.code;
  const fields = {};

  if (CODE_FIELDS[code]) {
    fields[CODE_FIELDS[code]] = getApiError(err, t);
    return fields;
  }

  if (code !== 'VALIDATION_ERROR') {
    return fields;
  }

  const raw = detailsVars(data?.details).fieldErrors || {};

  for (const field of Object.keys(raw)) {
    fields[field] = translateOrNull(t, FIELD_MESSAGE_KEYS[field]) || getApiError(err, t, 'apiErrors.VALIDATION_ERROR');
  }

  return fields;
}
