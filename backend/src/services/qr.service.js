import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, parsePaginationQuery } from '../utils/pagination.js';
import { recordActivity } from './activity.service.js';

function requireCafeId(user) {
  if (!user.cafeId) {
    throw new ApiError(403, 'No cafe associated with this account', null, 'NO_CAFE');
  }

  return user.cafeId;
}

/** Permanent QR policy: one code per cafe for life. Change requests are disabled. */
const QR_CHANGE_DISABLED = new ApiError(
  410,
  'QR change requests are disabled. Each account keeps one permanent QR code.',
  null,
  'QR_CHANGE_DISABLED',
);

export function toPendingRequest(_request) {
  return null;
}

export function toQrStatus(cafe) {
  const generated = Boolean(cafe.qrGeneratedAt);

  return {
    generated,
    generatedAt: cafe.qrGeneratedAt || null,
    locked: generated,
    changeAllowed: false,
    canGenerate: !generated,
    pendingRequest: null,
  };
}

export async function findPendingQrRequest(_cafeId) {
  return null;
}

export async function getQrStatusForCafe(cafeId) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: { qrGeneratedAt: true, qrChangeAllowed: true },
  });

  if (!cafe) {
    throw new ApiError(404, 'Cafe not found', null, 'CAFE_NOT_FOUND');
  }

  return toQrStatus(cafe);
}

function toRequestResponse(request) {
  return {
    _id: request.id,
    reason: request.reason,
    status: request.status,
    reviewNote: request.reviewNote || '',
    reviewedAt: request.reviewedAt || null,
    createdAt: request.createdAt,
    cafe: request.cafe
      ? {
          _id: request.cafe.id,
          name: request.cafe.name,
          slug: request.cafe.slug,
        }
      : null,
    requester: request.requester
      ? {
          _id: request.requester.id,
          name: request.requester.name,
          email: request.requester.email,
        }
      : null,
    reviewer: request.reviewer
      ? {
          _id: request.reviewer.id,
          name: request.reviewer.name,
          email: request.reviewer.email,
        }
      : null,
  };
}

export async function generateCafeQr(user) {
  const cafeId = requireCafeId(user);
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: {
      id: true,
      name: true,
      slug: true,
      qrGeneratedAt: true,
    },
  });

  if (!cafe) {
    throw new ApiError(404, 'Cafe not found', null, 'CAFE_NOT_FOUND');
  }

  if (cafe.qrGeneratedAt) {
    throw new ApiError(
      409,
      'The QR code has already been generated and cannot be changed.',
      null,
      'QR_ALREADY_GENERATED',
    );
  }

  const updated = await prisma.cafe.update({
    where: { id: cafeId },
    data: {
      qrGeneratedAt: new Date(),
      qrChangeAllowed: false,
    },
    select: {
      qrGeneratedAt: true,
      qrChangeAllowed: true,
    },
  });

  await recordActivity({
    action: 'qr_generated',
    actorId: user.id,
    cafeId,
    metadata: {
      cafeName: cafe.name,
      slug: cafe.slug,
      regenerated: false,
      permanent: true,
    },
  });

  return toQrStatus(updated);
}

export async function requestQrChange() {
  throw QR_CHANGE_DISABLED;
}

export async function listQrChangeRequests(status, query = {}) {
  const pagination = parsePaginationQuery(query);
  return {
    requests: [],
    pendingCount: 0,
    pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total: 0 }),
  };
}

export async function reviewQrChangeRequest() {
  throw QR_CHANGE_DISABLED;
}

export async function unlockCafeQr() {
  throw QR_CHANGE_DISABLED;
}

export { toRequestResponse };
