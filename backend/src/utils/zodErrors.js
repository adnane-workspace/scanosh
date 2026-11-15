const WRAPPERS = new Set(['body', 'params', 'query']);

export function flattenZodFieldErrors(error) {
  const fieldErrors = {};
  const formErrors = [];

  for (const issue of error.issues || []) {
    const parts = (issue.path || []).filter((part) => typeof part === 'string' && !WRAPPERS.has(part));
    const key = parts.join('.');

    if (!key) {
      formErrors.push(issue.message);
      continue;
    }

    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }

    fieldErrors[key].push(issue.message);
  }

  return { fieldErrors, formErrors };
}
