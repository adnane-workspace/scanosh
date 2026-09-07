import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { cafeRouter } from './cafe.routes.js';
import { categoryRouter } from './category.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { healthRouter } from './health.routes.js';
import { menuImportRouter } from './menuImport.routes.js';
import { menuRouter } from './menu.routes.js';
import { shareRouter } from './share.routes.js';
import { platformRouter } from './platform.routes.js';
import { productRouter } from './product.routes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/platform', platformRouter);
router.use('/menu', menuRouter);
router.use('/share', shareRouter);

router.use('/me/cafe', cafeRouter);
router.use('/me/categories', categoryRouter);
router.use('/me/products', productRouter);
router.use('/me/menu-imports', menuImportRouter);
router.use('/me/stats', dashboardRouter);

router.use('/cafe', cafeRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/dashboard/stats', dashboardRouter);

export { router };
