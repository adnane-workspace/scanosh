import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'Only JPG, PNG, WEBP and GIF images are allowed', null, 'IMAGE_TYPE'));
      return;
    }

    callback(null, true);
  },
});

/** OCR service currently caps uploads around 4 Mo. */
export const menuImportImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'Only JPG, PNG, WEBP and GIF images are allowed', null, 'IMAGE_TYPE'));
      return;
    }

    callback(null, true);
  },
});

export function handleUploadError(err, _req, _res, next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return next(new ApiError(400, 'Image too large (max 4–5MB)', null, 'IMAGE_TOO_LARGE'));
  }

  return next(err);
}
