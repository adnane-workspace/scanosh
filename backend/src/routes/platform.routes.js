import { Router } from 'express';
import {
  createCafe,
  deleteCafe,
  getCafe,
  getOverview,
  getStorage,
  listCafeOptions,
  listCafes,
  listLogs,
  resetCafePassword,
  updateCafeOwnerEmail,
  updateCafeStatus,
} from '../controllers/platform.controller.js';
import { getTrialLeads } from '../controllers/trial.controller.js';
import { listQrRequests, reviewQrRequest, unlockQr } from '../controllers/qr.controller.js';
import { authenticate, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createPlatformCafeSchema,
  listActivityLogsSchema,
  listPlatformCafesSchema,
  platformCafeIdSchema,
  resetPlatformCafePasswordSchema,
  updatePlatformCafeEmailSchema,
  updatePlatformCafeSchema,
} from '../validators/cafe.validator.js';
import { listQrChangeRequestsSchema, listTrialLeadsSchema, reviewQrChangeRequestSchema } from '../validators/qr.validator.js';
import { listStorageSchema } from '../validators/pagination.schema.js';

const platformRouter = Router();

platformRouter.use(authenticate, requireSuperAdmin);

platformRouter.get('/overview', getOverview);
platformRouter.get('/cafes/options', listCafeOptions);
platformRouter.get('/storage', validate(listStorageSchema), getStorage);
platformRouter.get('/logs', validate(listActivityLogsSchema), listLogs);
platformRouter.get('/qr-requests', validate(listQrChangeRequestsSchema), listQrRequests);
platformRouter.post('/qr-requests/:id/review', validate(reviewQrChangeRequestSchema), reviewQrRequest);
platformRouter.get('/trial-leads', validate(listTrialLeadsSchema), getTrialLeads);
platformRouter.get('/cafes', validate(listPlatformCafesSchema), listCafes);
platformRouter.post('/cafes', validate(createPlatformCafeSchema), createCafe);
platformRouter.get('/cafes/:id', validate(platformCafeIdSchema), getCafe);
platformRouter.patch('/cafes/:id', validate(updatePlatformCafeSchema), updateCafeStatus);
platformRouter.delete('/cafes/:id', validate(platformCafeIdSchema), deleteCafe);
platformRouter.post('/cafes/:id/password', validate(resetPlatformCafePasswordSchema), resetCafePassword);
platformRouter.post('/cafes/:id/email', validate(updatePlatformCafeEmailSchema), updateCafeOwnerEmail);
platformRouter.post('/cafes/:id/qr/unlock', validate(platformCafeIdSchema), unlockQr);

export { platformRouter };
