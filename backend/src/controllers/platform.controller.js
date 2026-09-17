import { asyncHandler } from '../middleware/asyncHandler.js';
import { listActivityLogs } from '../services/activity.service.js';
import { getMenuImportStatus } from '../services/menuImport.service.js';
import { getStorageReport } from '../services/usage.service.js';
import {
  createPlatformCafe,
  deletePlatformCafe,
  getPlatformCafe,
  getPlatformOverview,
  listPlatformCafeOptions,
  listPlatformCafes,
  resetPlatformCafePassword,
  updatePlatformCafe,
  updatePlatformCafeOwnerEmail,
} from '../services/platform.service.js';

export const createCafe = asyncHandler(async (req, res) => {
  const cafe = await createPlatformCafe(req.validated.body, req.user);

  res.status(201).json({
    success: true,
    message: 'Cafe created',
    data: { cafe },
  });
});

export const listCafes = asyncHandler(async (req, res) => {
  const result = await listPlatformCafes(req.validated?.query || req.query);

  res.status(200).json({
    success: true,
    data: {
      cafes: result.items,
      pagination: result.pagination,
    },
  });
});

export const getOverview = asyncHandler(async (_req, res) => {
  const overview = await getPlatformOverview();

  res.status(200).json({
    success: true,
    data: { overview },
  });
});

export const getAiStatus = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    data: getMenuImportStatus(),
  });
});

export const listCafeOptions = asyncHandler(async (_req, res) => {
  const cafes = await listPlatformCafeOptions();

  res.status(200).json({
    success: true,
    data: { cafes },
  });
});

export const getCafe = asyncHandler(async (req, res) => {
  const cafe = await getPlatformCafe(req.validated.params.id);

  res.status(200).json({
    success: true,
    data: { cafe },
  });
});

export const listLogs = asyncHandler(async (req, res) => {
  const result = await listActivityLogs(req.validated?.query || req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getStorage = asyncHandler(async (req, res) => {
  const query = req.validated?.query || req.query;
  const report = await getStorageReport({
    force: query?.refresh === '1',
    page: query?.page,
    limit: query?.limit,
  });

  res.status(200).json({
    success: true,
    data: { report },
  });
});

export const resetCafePassword = asyncHandler(async (req, res) => {
  const result = await resetPlatformCafePassword(
    req.validated.params.id,
    req.validated.body.password,
    req.user,
  );

  res.status(200).json({
    success: true,
    message: 'Password updated',
    data: result,
  });
});

export const updateCafeOwnerEmail = asyncHandler(async (req, res) => {
  const result = await updatePlatformCafeOwnerEmail(
    req.validated.params.id,
    req.validated.body.email,
    req.user,
  );

  res.status(200).json({
    success: true,
    message: 'Email updated',
    data: result,
  });
});

export const updateCafeStatus = asyncHandler(async (req, res) => {
  const cafe = await updatePlatformCafe(req.validated.params.id, req.validated.body, req.user);

  res.status(200).json({
    success: true,
    message: 'Cafe updated',
    data: { cafe },
  });
});

export const deleteCafe = asyncHandler(async (req, res) => {
  const cafe = await deletePlatformCafe(req.validated.params.id, req.user);

  res.status(200).json({
    success: true,
    message: 'Cafe deleted',
    data: { cafe },
  });
});
