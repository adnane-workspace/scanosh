import { Router } from 'express';
import { createFeedback } from '../controllers/feedback.controller.js';
import { getMenu, getPublicDemo } from '../controllers/menu.controller.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { createFeedbackSchema } from '../validators/feedback.validator.js';
import { publicMenuSlugSchema } from '../validators/menu.validator.js';

const menuRouter = Router();

const feedbackLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many feedback submissions. Try again later.',
  code: 'TOO_MANY_FEEDBACKS',
});

menuRouter.get('/public-demo', getPublicDemo);
menuRouter.post('/:slug/feedback', feedbackLimit, validate(createFeedbackSchema), createFeedback);
menuRouter.get('/:slug', validate(publicMenuSlugSchema), getMenu);

export { menuRouter };
