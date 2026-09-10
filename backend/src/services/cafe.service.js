import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { assertUsableSlug, slugify } from '../utils/slug.js';
import { recordActivity } from './activity.service.js';
import { invalidatePublicMenu } from './menuCache.service.js';
import { toQrStatus } from './qr.service.js';
import { normalizeMenuUi, finalizeMenuUi } from '../utils/menuUi.js';
import { deleteReplacedImage, normalizeImageUrl } from './storage.service.js';

function requireCafeId(user) {
  if (!user.cafeId) {
    throw new ApiError(403, 'No cafe associated with this account', null, 'NO_CAFE');
  }

  return user.cafeId;
}

function toCafeResponse(cafe) {
  return {
    _id: cafe.id,
    name: cafe.name,
    description: cafe.description,
    logo: cafe.logo || '',
    cover: cafe.cover || '',
    address: cafe.address,
    phone: cafe.phone,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    slug: cafe.slug,
    menuUi: normalizeMenuUi(cafe.menuUi),
    isActive: cafe.isActive,
    createdAt: cafe.createdAt,
    updatedAt: cafe.updatedAt,
    qr: toQrStatus(cafe),
  };
}

export async function getMyCafe(user) {
  const cafeId = requireCafeId(user);
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });

  if (!cafe) {
    throw new ApiError(404, 'Cafe not found', null, 'CAFE_NOT_FOUND');
  }

  return toCafeResponse(cafe);
}

export async function updateMyCafe(user, payload) {
  const cafeId = requireCafeId(user);
  const current = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: {
      id: true,
      slug: true,
      qrGeneratedAt: true,
      logo: true,
      cover: true,
      menuUi: true,
    },
  });

  if (!current) {
    throw new ApiError(404, 'Cafe not found', null, 'CAFE_NOT_FOUND');
  }

  const data = {};

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.logo !== undefined) {
    data.logo = normalizeImageUrl(payload.logo);
  }

  if (payload.cover !== undefined) {
    data.cover = normalizeImageUrl(payload.cover);
  }

  if (payload.address !== undefined) {
    data.address = payload.address;
  }

  if (payload.phone !== undefined) {
    data.phone = payload.phone;
  }

  if (payload.latitude !== undefined) {
    data.latitude = payload.latitude;
  }

  if (payload.longitude !== undefined) {
    data.longitude = payload.longitude;
  }

  if (payload.menuUi !== undefined) {
    const nextUi = finalizeMenuUi(payload.menuUi);
    nextUi.backgroundImage = normalizeImageUrl(nextUi.backgroundImage);
    data.menuUi = nextUi;
  }

  if (payload.slug !== undefined) {
    const nextSlug = slugify(payload.slug);
    assertUsableSlug(nextSlug);

    if (nextSlug !== current.slug) {
      if (current.qrGeneratedAt) {
        throw new ApiError(
          409,
          'The public link is permanent after QR generation and cannot be changed.',
          null,
          'SLUG_LOCKED',
        );
      }

      const taken = await prisma.cafe.findFirst({
        where: { slug: nextSlug, id: { not: cafeId } },
        select: { id: true },
      });

      if (taken) {
        throw new ApiError(409, 'Cafe slug already in use', null, 'SLUG_IN_USE');
      }

      data.slug = nextSlug;
    }
  }

  if (Object.keys(data).length === 0) {
    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    return toCafeResponse(cafe);
  }

  const cafe = await prisma.cafe.update({
    where: { id: cafeId },
    data,
  });

  if (payload.logo !== undefined) {
    await deleteReplacedImage(current.logo, cafe.logo);
  }

  if (payload.cover !== undefined) {
    await deleteReplacedImage(current.cover, cafe.cover);
  }

  if (payload.menuUi !== undefined) {
    await deleteReplacedImage(
      normalizeMenuUi(current.menuUi).backgroundImage,
      normalizeMenuUi(cafe.menuUi).backgroundImage,
    );
  }

  invalidatePublicMenu(cafeId, [current.slug, cafe.slug]);

  await recordActivity({
    action: 'cafe_updated',
    actorId: user.id,
    cafeId,
    metadata: {
      cafeName: cafe.name,
      slug: cafe.slug,
      fields: Object.keys(data),
    },
  });

  return toCafeResponse(cafe);
}
