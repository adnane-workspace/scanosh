import { Router } from 'express';
import {
  create,
  getById,
  list,
  publish,
  status,
  updateDraft,
} from '../controllers/menuImport.controller.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { handleUploadError, menuImportImageUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  listMenuImportsSchema,
  menuImportIdSchema,
  publishMenuImportSchema,
  updateMenuImportDraftSchema,
} from '../validators/menuImport.validator.js';

const menuImportRouter = Router();

menuImportRouter.use(authenticate, requireAdmin);

menuImportRouter.get('/status', status);
menuImportRouter.post('/', menuImportImageUpload.single('image'), handleUploadError, create);
menuImportRouter.get('/', validate(listMenuImportsSchema), list);
menuImportRouter.get('/:id', validate(menuImportIdSchema), getById);
menuImportRouter.put('/:id/draft', validate(updateMenuImportDraftSchema), updateDraft);
menuImportRouter.post('/:id/publish', validate(publishMenuImportSchema), publish);

export { menuImportRouter };
