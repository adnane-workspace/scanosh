import { asyncHandler } from '../middleware/asyncHandler.js';
import { getPublicDemoMenu, getPublicMenu } from '../services/menu.service.js';

export const getPublicDemo = asyncHandler(async (_req, res) => {
  const demo = await getPublicDemoMenu();

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({
    success: true,
    data: demo,
  });
});

export const getMenu = asyncHandler(async (req, res) => {
  const menu = await getPublicMenu(req.validated.params.slug);

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({
    success: true,
    data: menu,
  });
});
