import { Router } from 'express';
import { feedbackStats, listFeedback } from '../controllers/feedback.controller.js';
import { authenticate, requireCafeAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { feedbackStatsSchema, listFeedbackSchema } from '../validators/feedback.validator.js';

const feedbackRouter = Router();

feedbackRouter.use(authenticate, requireCafeAdmin);
feedbackRouter.get('/stats', validate(feedbackStatsSchema), feedbackStats);
feedbackRouter.get('/', validate(listFeedbackSchema), listFeedback);

export { feedbackRouter };
