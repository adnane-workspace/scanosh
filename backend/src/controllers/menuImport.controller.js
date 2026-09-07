import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createMenuImport,
  getMenuImportById,
  getMenuImportStatus,
  listMenuImports,
  publishMenuImport,
  updateMenuImportDraft,
} from '../services/menuImport.service.js';

export const status = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    data: getMenuImportStatus(),
  });
});

export const create = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'An image is required', null, 'IMAGE_REQUIRED');
  }

  const mergeLevel = String(req.body?.mergeLevel || req.query?.mergeLevel || 'paragraph');
  const item = await createMenuImport(req.user, req.file, { mergeLevel });

  res.status(201).json({
    success: true,
    message: 'Menu import created',
    data: { import: item },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await listMenuImports(req.user, req.validated.query);

  res.status(200).json({
    success: true,
    data: {
      imports: result.items,
      pagination: result.pagination,
    },
  });
});

export const getById = asyncHandler(async (req, res) => {
  const item = await getMenuImportById(req.user, req.validated.params.id);

  res.status(200).json({
    success: true,
    data: { import: item },
  });
});

export const updateDraft = asyncHandler(async (req, res) => {
  const item = await updateMenuImportDraft(
    req.user,
    req.validated.params.id,
    req.validated.body.draftMenu,
  );

  res.status(200).json({
    success: true,
    message: 'Draft updated',
    data: { import: item },
  });
});

export const publish = asyncHandler(async (req, res) => {
  const draftMenu = req.validated.body?.draftMenu;
  const result = await publishMenuImport(req.user, req.validated.params.id, draftMenu);

  res.status(200).json({
    success: true,
    message: 'Menu import published',
    data: result,
  });
});
