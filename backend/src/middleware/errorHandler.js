import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

function mapInfrastructureError(err) {
  if (err?.code === 'LIMIT_FILE_SIZE' || (err?.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE')) {
    return new ApiError(400, 'Image too large (max 4–5MB)', null, 'IMAGE_TOO_LARGE');
  }

  if (err?.name === 'MulterError') {
    return new ApiError(400, err.message || 'Upload failed', null, 'IMAGE_UPLOAD_FAILED');
  }

  if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return new ApiError(400, 'Invalid JSON body', null, 'INVALID_JSON');
  }

  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return new ApiError(413, 'Payload too large', null, 'PAYLOAD_TOO_LARGE');
  }

  if (err?.code === 'P2002') {
    const target = [].concat(err.meta?.target || []).join('.');

    if (target.includes('email')) {
      return new ApiError(409, 'Email already in use', null, 'EMAIL_IN_USE');
    }

    if (target.includes('slug')) {
      return new ApiError(409, 'Cafe slug already in use', null, 'SLUG_IN_USE');
    }

    return new ApiError(409, 'This value is already in use', null, 'VALUE_IN_USE');
  }

  if (err?.code === 'P2025') {
    return new ApiError(404, 'Record not found', null, 'RECORD_NOT_FOUND');
  }

  return null;
}

export function errorHandler(err, _req, res, _next) {
  const mapped = mapInfrastructureError(err);
  if (mapped) {
    err = mapped;
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      details: err.flatten(),
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: expired ? 'Token expired' : 'Invalid token',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: err.message,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';
  const code =
    err instanceof ApiError
      ? err.code
      : statusCode === 500
        ? 'INTERNAL_ERROR'
        : null;

  return res.status(statusCode).json({
    success: false,
    ...(code && { code }),
    message,
    ...(err instanceof ApiError && err.details && { details: err.details }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, null, 'ROUTE_NOT_FOUND'));
}
