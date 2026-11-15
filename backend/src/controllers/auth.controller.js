import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  changePassword,
  getCurrentUser,
  login,
  logout,
  register,
  requestPasswordReset,
  resendEmailVerification,
  resetPasswordWithCode,
  verifyEmail,
  verifyPasswordResetCode,
} from '../services/auth.service.js';

export const registerAdmin = asyncHandler(async (req, res) => {
  const result = await register(req.validated.body);

  res.status(201).json({
    success: true,
    message: 'Account created',
    data: result,
  });
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const result = await login(req.validated.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = getCurrentUser(req.user);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  await changePassword(req.user._id, req.validated.body);

  res.status(200).json({
    success: true,
    message: 'Password updated',
  });
});

export const logoutAdmin = asyncHandler(async (_req, res) => {
  const result = logout();
  res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.validated.body);

  res.status(200).json({
    success: true,
    message: 'If this email exists, a verification code has been sent',
    data: result,
  });
});

export const verifyResetCode = asyncHandler(async (req, res) => {
  await verifyPasswordResetCode(req.validated.body);

  res.status(200).json({
    success: true,
    message: 'Code verified',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await resetPasswordWithCode(req.validated.body);

  res.status(200).json({
    success: true,
    message: 'Password updated',
  });
});

export const verifyEmailCode = asyncHandler(async (req, res) => {
  const result = await verifyEmail(req.validated.body);

  res.status(200).json({
    success: true,
    message: 'Email verified',
    data: result,
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const result = await resendEmailVerification(req.validated.body);

  res.status(200).json({
    success: true,
    message: 'If this email exists, a verification code has been sent',
    data: result,
  });
});
