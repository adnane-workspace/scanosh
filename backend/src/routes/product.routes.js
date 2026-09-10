import { Router } from 'express';
import {
  applyMediaImage,
  create,
  getById,
  imageCandidates,
  imageSuggestStatus,
  list,
  mediaLibrary,
  remove,
  suggestImage,
  suggestImagesBatch,
  update,
  uploadImage,
} from '../controllers/product.controller.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { handleUploadError, productImageUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  applyMediaImageSchema,
  createProductSchema,
  listMediaLibrarySchema,
  listProductsSchema,
  productIdSchema,
  suggestProductImageSchema,
  suggestProductImagesBatchSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

const productRouter = Router();

const suggestImageLimit = rateLimit({
  windowMs: 60_000,
  max: 40,
  message: 'Too many image suggestions, try again shortly',
  code: 'IMAGE_SUGGEST_RATE_LIMIT',
});

productRouter.use(authenticate, requireAdmin);

productRouter.post('/', validate(createProductSchema), create);
productRouter.get('/', validate(listProductsSchema), list);
productRouter.post('/upload', productImageUpload.single('image'), handleUploadError, uploadImage);
productRouter.get('/image-suggest/status', imageSuggestStatus);
productRouter.get('/media-library', validate(listMediaLibrarySchema), mediaLibrary);
productRouter.post(
  '/suggest-images',
  suggestImageLimit,
  validate(suggestProductImagesBatchSchema),
  suggestImagesBatch,
);
productRouter.get('/:id/image-candidates', validate(productIdSchema), imageCandidates);
productRouter.post(
  '/:id/apply-media-image',
  suggestImageLimit,
  validate(applyMediaImageSchema),
  applyMediaImage,
);
productRouter.post(
  '/:id/suggest-image',
  suggestImageLimit,
  validate(suggestProductImageSchema),
  suggestImage,
);
productRouter.get('/:id', validate(productIdSchema), getById);
productRouter.put('/:id', validate(updateProductSchema), update);
productRouter.delete('/:id', validate(productIdSchema), remove);

export { productRouter };
