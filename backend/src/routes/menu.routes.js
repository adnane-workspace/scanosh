import { Router } from 'express';
import { getMenu, getPublicDemo } from '../controllers/menu.controller.js';
import { validate } from '../middleware/validate.js';
import { publicMenuSlugSchema } from '../validators/menu.validator.js';

const menuRouter = Router();

menuRouter.get('/public-demo', getPublicDemo);
menuRouter.get('/:slug', validate(publicMenuSlugSchema), getMenu);

export { menuRouter };
