import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import {
  extractPublicId,
  isAppCloudinaryAsset,
  isCloudinaryUrl,
  stripCloudinaryTransforms,
} from '../utils/cloudinaryUrl.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary, extractPublicId, isCloudinaryUrl };

const IMAGE_FOLDERS = {
  products: 'products',
  categories: 'categories',
  logos: 'logos',
  banners: 'banners',
};

export function normalizeImageUrl(image) {
  if (!image) {
    return '';
  }

  return stripCloudinaryTransforms(image.trim());
}

function resolveUploadFolder(subfolder) {
  const base = env.CLOUDINARY_FOLDER;

  if (!subfolder) {
    return base;
  }

  const safe = IMAGE_FOLDERS[subfolder] || String(subfolder).replace(/[^a-z0-9/_-]/gi, '');
  return `${base}/${safe}`;
}

export async function uploadProductImage(file, options = {}) {
  if (!file?.buffer) {
    throw new ApiError(400, 'Image file is required', null, 'IMAGE_REQUIRED');
  }

  const uploadOptions = {
    folder: resolveUploadFolder(options.folder),
    resource_type: 'image',
  };

  if (options.publicId) {
    uploadOptions.public_id = options.publicId;
    uploadOptions.overwrite = true;
    uploadOptions.invalidate = true;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result?.secure_url) {
        const reason = error?.message || error?.error?.message || 'Image upload failed';
        reject(new ApiError(500, `Image upload failed: ${reason}`, null, 'IMAGE_UPLOAD_FAILED'));
        return;
      }

      resolve(result.secure_url);
    });

    stream.end(file.buffer);
  });
}

/** Download a remote image URL into our Cloudinary folder. */
export async function uploadImageFromUrl(imageUrl, options = {}) {
  const url = String(imageUrl || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new ApiError(400, 'Invalid image URL', null, 'IMAGE_URL_INVALID');
  }

  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: resolveUploadFolder(options.folder || 'products'),
      resource_type: 'image',
      timeout: 60000,
    });
    if (!result?.secure_url) {
      throw new ApiError(500, 'Image upload failed', null, 'IMAGE_UPLOAD_FAILED');
    }
    return result.secure_url;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const reason = error?.message || 'Image upload failed';
    throw new ApiError(500, `Image upload failed: ${reason}`, null, 'IMAGE_UPLOAD_FAILED');
  }
}

/** Upload a base64 image (Flux / NIM) into our Cloudinary folder. */
export async function uploadImageFromBase64(base64, options = {}) {
  const raw = String(base64 || '').trim();
  if (!raw) {
    throw new ApiError(400, 'Image data is required', null, 'IMAGE_REQUIRED');
  }

  const dataUri = raw.startsWith('data:') ? raw : `data:image/jpeg;base64,${raw}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: resolveUploadFolder(options.folder || 'products'),
      resource_type: 'image',
      timeout: 60000,
    });
    if (!result?.secure_url) {
      throw new ApiError(500, 'Image upload failed', null, 'IMAGE_UPLOAD_FAILED');
    }
    return result.secure_url;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const reason = error?.message || 'Image upload failed';
    throw new ApiError(500, `Image upload failed: ${reason}`, null, 'IMAGE_UPLOAD_FAILED');
  }
}

export async function deleteCloudinaryImage(url) {
  if (!isAppCloudinaryAsset(url, env.CLOUDINARY_FOLDER)) {
    return false;
  }

  const publicId = extractPublicId(url, env.CLOUDINARY_FOLDER);

  if (!publicId) {
    return false;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return true;
  } catch {
    return false;
  }
}

export async function deleteReplacedImage(previousUrl, nextUrl) {
  const previous = normalizeImageUrl(previousUrl);
  const next = normalizeImageUrl(nextUrl);

  if (previous && previous !== next) {
    await deleteCloudinaryImage(previous);
  }
}
