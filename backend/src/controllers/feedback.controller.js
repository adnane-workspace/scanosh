import { asyncHandler } from '../middleware/asyncHandler.js';
import { createPublicFeedback, getCafeFeedbackStats, listCafeFeedback } from '../services/feedback.service.js';

export const createFeedback = asyncHandler(async (req, res) => {
  const result = await createPublicFeedback({
    slug: req.validated.params.slug,
    rating: req.validated.body.rating,
    comment: req.validated.body.comment,
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    data: result,
  });
});

export const listFeedback = asyncHandler(async (req, res) => {
  const result = await listCafeFeedback(req.user.cafeId, req.validated.query);

  res.status(200).json({
    success: true,
    data: {
      feedback: result.items,
      pagination: result.pagination,
    },
  });
});

export const feedbackStats = asyncHandler(async (req, res) => {
  const stats = await getCafeFeedbackStats(req.user.cafeId, req.validated.query.period);

  res.status(200).json({
    success: true,
    data: { stats },
  });
});
