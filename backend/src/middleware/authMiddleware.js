import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import { asyncHandler } from './asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED');
  }

  const token = header.slice(7).trim();

  if (!token) {
    throw new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED');
  }

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token', null, 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cafeId: true,
      createdAt: true,
      updatedAt: true,
      cafe: {
        select: { isActive: true },
      },
    },
  });

  if (!user) {
    throw new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED');
  }

  const { cafe, ...safeUser } = user;

  if (user.role === 'admin' && (!cafe || !cafe.isActive)) {
    throw new ApiError(403, 'This cafe is disabled', null, 'CAFE_DISABLED');
  }

  req.user = { ...safeUser, _id: user.id };
  next();
});

export function requireStaff(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED'));
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new ApiError(403, 'Admin access required', null, 'ADMIN_REQUIRED'));
  }

  return next();
}

export function requireAdmin(req, _res, next) {
  return requireCafeAdmin(req, _res, next);
}

export function requireCafeAdmin(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED'));
  }

  if (req.user.role !== 'admin' || !req.user.cafeId) {
    return next(new ApiError(403, 'Cafe admin access required', null, 'CAFE_ADMIN_REQUIRED'));
  }

  return next();
}

export function requireSuperAdmin(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED'));
  }

  if (req.user.role !== 'superadmin') {
    return next(new ApiError(403, 'Superadmin access required', null, 'SUPERADMIN_REQUIRED'));
  }

  return next();
}
