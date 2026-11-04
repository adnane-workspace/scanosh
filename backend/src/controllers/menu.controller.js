import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  getPublicDemoMenu,
  getPublicMenu,
  getPublicMenuCategory,
  getPublicMenuLanding,
  getPublicMenuSections,
} from '../services/menu.service.js';

export const getPublicDemo = asyncHandler(async (_req, res) => {
  const demo = await getPublicDemoMenu();

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({
    success: true,
    data: demo,
  });
});

export const getMenu = asyncHandler(async (req, res) => {
  const slug = req.validated.params.slug;
  const view = req.validated.query?.view;
  const section = req.validated.query?.section || '';
  const categoryId = req.validated.query?.categoryId || '';
  let menu;

  if (view === 'landing') {
    menu = await getPublicMenuLanding(slug);
  } else if (view === 'sections') {
    menu = await getPublicMenuSections(slug);
  } else if (view === 'category') {
    menu = await getPublicMenuCategory(slug, { section, categoryId });
  } else {
    menu = await getPublicMenu(slug);
  }

  res.setHeader(
    'Cache-Control',
    view ? 'public, max-age=30, stale-while-revalidate=120' : 'private, no-store',
  );
  res.status(200).json({
    success: true,
    data: menu,
  });
});
