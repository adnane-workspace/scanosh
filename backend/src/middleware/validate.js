import { ApiError } from '../utils/ApiError.js';
import { flattenZodFieldErrors } from '../utils/zodErrors.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(new ApiError(400, 'Validation error', flattenZodFieldErrors(result.error), 'VALIDATION_ERROR'));
    }

    req.validated = result.data;
    next();
  };
}
