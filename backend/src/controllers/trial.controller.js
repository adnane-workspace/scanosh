import { asyncHandler } from '../middleware/asyncHandler.js';
import { listTrialLeads, startTrial } from '../services/trial.service.js';

export const startTrialSession = asyncHandler(async (req, res) => {
  const result = await startTrial(req.validated.body);

  res.status(200).json({
    success: true,
    message: 'Demo lead saved',
    data: result,
  });
});

export const getTrialLeads = asyncHandler(async (req, res) => {
  const result = await listTrialLeads(req.validated?.query || req.query);

  res.status(200).json({
    success: true,
    data: {
      leads: result.items,
      pagination: result.pagination,
    },
  });
});
