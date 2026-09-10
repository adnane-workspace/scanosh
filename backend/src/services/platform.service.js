import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, paginatedResult, parsePaginationQuery } from '../utils/pagination.js';
import { assertUsableSlug, slugify } from '../utils/slug.js';
import { recordActivity } from './activity.service.js';
import { invalidatePublicMenu } from './menuCache.service.js';
import { toQrStatus } from './qr.service.js';
import { deleteCloudinaryImage } from './storage.service.js';
import { ensureDefaultSections } from './category.service.js';

function ownerFromUsers(users = []) {
  const owner = users[0];

  return {
    ownerName: owner?.name ?? null,
    ownerEmail: owner?.email ?? null,
  };
}

function toPlatformCafe(cafe, counts) {
  return {
    _id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    isActive: cafe.isActive,
    productCount: counts.productCount,
    categoryCount: counts.categoryCount,
    createdAt: cafe.createdAt,
    qrGeneratedAt: cafe.qrGeneratedAt || null,
    trialRole: cafe.trialRole || 'none',
    ...ownerFromUsers(cafe.users),
  };
}

const ownerSelect = {
  users: {
    where: { role: 'admin' },
    select: { name: true, email: true },
    orderBy: { createdAt: 'asc' },
    take: 1,
  },
};

export async function createPlatformCafe({ ownerName, email, password, cafeName, slug }, actor) {
  const normalizedEmail = email.toLowerCase();
  const cafeSlug = slugify(slug || cafeName);
  assertUsableSlug(cafeSlug);

  const [existingEmail, existingSlug] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
    prisma.cafe.findUnique({ where: { slug: cafeSlug }, select: { id: true } }),
  ]);

  if (existingEmail) {
    throw new ApiError(409, 'Email already in use', null, 'EMAIL_IN_USE');
  }

  if (existingSlug) {
    throw new ApiError(409, 'Cafe slug already in use', null, 'SLUG_IN_USE');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const cafe = await prisma.$transaction(async (tx) => {
    const createdCafe = await tx.cafe.create({
      data: {
        name: cafeName.trim(),
        slug: cafeSlug,
        menuUi: { sectionsEnabled: true },
      },
    });

    await tx.user.create({
      data: {
        name: ownerName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        cafeId: createdCafe.id,
        emailVerifiedAt: new Date(),
      },
    });

    return createdCafe;
  });

  await ensureDefaultSections(cafe.id);

  await recordActivity({
    action: 'cafe_created',
    actorId: actor?.id,
    cafeId: cafe.id,
    metadata: {
      cafeName: cafe.name,
      slug: cafe.slug,
      ownerName: ownerName.trim(),
      ownerEmail: normalizedEmail,
    },
  });

  return getPlatformCafe(cafe.id);
}

export async function getPlatformOverview() {
  const [cafeCount, activeCafeCount] = await Promise.all([
    prisma.cafe.count(),
    prisma.cafe.count({ where: { isActive: true } }),
  ]);

  return { cafeCount, activeCafeCount, pendingQrCount: 0 };
}

export async function listPlatformCafeOptions() {
  const cafes = await prisma.cafe.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return cafes.map((cafe) => ({
    _id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
  }));
}

export async function listPlatformCafes(query = {}) {
  const { page, limit, skip } = parsePaginationQuery(query);
  const search = String(query.q || query.search || '').trim().toLowerCase();
  const status = query.status || 'all';
  const from = query.from ? new Date(`${query.from}T00:00:00`) : null;
  const to = query.to ? new Date(`${query.to}T23:59:59.999`) : null;

  const where = {};

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  if (from || to) {
    where.createdAt = {};

    if (from) {
      where.createdAt.gte = from;
    }

    if (to) {
      where.createdAt.lte = to;
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { users: { some: { role: 'admin', email: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const [cafes, total] = await Promise.all([
    prisma.cafe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        qrGeneratedAt: true,
        trialRole: true,
        ...ownerSelect,
      },
    }),
    prisma.cafe.count({ where }),
  ]);

  const cafeIds = cafes.map((cafe) => cafe.id);

  if (cafeIds.length === 0) {
    return paginatedResult([], buildPaginationMeta({ page, limit, total }));
  }

  const [productGroups, categoryGroups] = await Promise.all([
    prisma.product.groupBy({
      by: ['cafeId'],
      where: { cafeId: { in: cafeIds } },
      _count: { _all: true },
    }),
    prisma.category.groupBy({
      by: ['cafeId'],
      where: { cafeId: { in: cafeIds } },
      _count: { _all: true },
    }),
  ]);

  const productCountByCafe = new Map(productGroups.map((item) => [item.cafeId, item._count._all]));
  const categoryCountByCafe = new Map(categoryGroups.map((item) => [item.cafeId, item._count._all]));

  const items = cafes.map((cafe) =>
    toPlatformCafe(cafe, {
      productCount: productCountByCafe.get(cafe.id) || 0,
      categoryCount: categoryCountByCafe.get(cafe.id) || 0,
    }),
  );

  return paginatedResult(items, buildPaginationMeta({ page, limit, total }));
}

export async function updatePlatformCafe(cafeId, payload, actor) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: { id: true, name: true, slug: true },
  });

  if (!cafe) {
    throw new ApiError(404, 'Cafe not found', null, 'CAFE_NOT_FOUND');
  }

  const data = {};

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  if (payload.trialRole !== undefined) {
    data.trialRole = payload.trialRole;
  }

  if (payload.trialRole === 'playground' || payload.trialRole === 'template') {
    await prisma.cafe.updateMany({
      where: { trialRole: payload.trialRole, id: { not: cafeId } },
      data: { trialRole: 'none' },
    });
  }

  const updated = await prisma.cafe.update({
    where: { id: cafeId },
    data,
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      qrGeneratedAt: true,
      trialRole: true,
      ...ownerSelect,
    },
  });

  const [productCount, categoryCount] = await Promise.all([
    prisma.product.count({ where: { cafeId } }),
    prisma.category.count({ where: { cafeId } }),
  ]);

  if (payload.isActive !== undefined) {
    invalidatePublicMenu(cafeId, [cafe.slug]);
  }

  if (payload.isActive !== undefined) {
    await recordActivity({
      action: payload.isActive ? 'cafe_activated' : 'cafe_deactivated',
      actorId: actor?.id,
      cafeId,
      metadata: {
        cafeName: cafe.name,
        slug: cafe.slug,
      },
    });
  } else {
    await recordActivity({
      action: 'cafe_updated',
      actorId: actor?.id,
      cafeId,
      metadata: {
        cafeName: cafe.name,
        slug: cafe.slug,
        fields: ['trialRole'],
        trialRole: payload.trialRole,
      },
    });
  }

  return toPlatformCafe(updated, { productCount, categoryCount });
}

export async function getPlatformCafe(cafeId) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    include: {
      ...ownerSelect,
    },
  });

  if (!cafe) {
    throw new ApiError(404, 'Cafe not found', null, 'CAFE_NOT_FOUND');
  }

  const [productCount, categoryCount] = await Promise.all([
    prisma.product.count({ where: { cafeId } }),
    prisma.category.count({ where: { cafeId } }),
  ]);

  return {
    ...toPlatformCafe(cafe, { productCount, categoryCount }),
    description: cafe.description || '',
    logo: cafe.logo || '',
    cover: cafe.cover || '',
    address: cafe.address || '',
    phone: cafe.phone || '',
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    updatedAt: cafe.updatedAt,
    qr: toQrStatus(cafe),
  };
}

export async function resetPlatformCafePassword(cafeId, password, actor) {
  const owner = await prisma.user.findFirst({
    where: { cafeId, role: 'admin' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  });

  if (!owner) {
    throw new ApiError(404, 'No manager for this cafe', null, 'CAFE_OWNER_MISSING');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: owner.id },
    data: { passwordHash },
  });

  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: { name: true, slug: true },
  });

  await recordActivity({
    action: 'cafe_password_reset',
    actorId: actor?.id,
    cafeId,
    metadata: {
      cafeName: cafe?.name,
      slug: cafe?.slug,
      ownerEmail: owner.email,
    },
  });

  return { email: owner.email };
}

export async function updatePlatformCafeOwnerEmail(cafeId, email, actor) {
  const normalizedEmail = email.toLowerCase().trim();

  const owner = await prisma.user.findFirst({
    where: { cafeId, role: 'admin' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  });

  if (!owner) {
    throw new ApiError(404, 'No manager for this cafe', null, 'CAFE_OWNER_MISSING');
  }

  if (owner.email === normalizedEmail) {
    return { email: normalizedEmail, previousEmail: owner.email };
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing && existing.id !== owner.id) {
    throw new ApiError(409, 'Email already in use', null, 'EMAIL_IN_USE');
  }

  const previousEmail = owner.email;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: owner.id },
      data: {
        email: normalizedEmail,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.passwordReset.deleteMany({ where: { email: previousEmail } }),
  ]);

  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: { name: true, slug: true },
  });

  await recordActivity({
    action: 'cafe_email_updated',
    actorId: actor?.id,
    cafeId,
    metadata: {
      cafeName: cafe?.name,
      slug: cafe?.slug,
      previousEmail,
      ownerEmail: normalizedEmail,
    },
  });

  return { email: normalizedEmail, previousEmail };
}

export async function deletePlatformCafe(cafeId, actor) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      cover: true,
    },
  });

  if (!cafe) {
    throw new ApiError(404, 'Cafe not found', null, 'CAFE_NOT_FOUND');
  }

  const [categories, products, owners] = await Promise.all([
    prisma.category.findMany({ where: { cafeId }, select: { image: true } }),
    prisma.product.findMany({ where: { cafeId }, select: { image: true } }),
    prisma.user.findMany({
      where: { cafeId, role: 'admin' },
      select: { email: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const imageUrls = [
    ...new Set([cafe.logo, cafe.cover, ...categories.map((item) => item.image), ...products.map((item) => item.image)].filter(Boolean)),
  ];

  invalidatePublicMenu(cafeId, [cafe.slug]);

  await prisma.$transaction(async (tx) => {
    await tx.product.deleteMany({ where: { cafeId } });
    await tx.category.updateMany({ where: { cafeId }, data: { parentId: null } });
    await tx.category.deleteMany({ where: { cafeId } });
    await tx.qrChangeRequest.deleteMany({ where: { cafeId } });
    await tx.user.deleteMany({ where: { cafeId, role: 'admin' } });
    await tx.cafe.delete({ where: { id: cafeId } });
  });

  await recordActivity({
    action: 'cafe_deleted',
    actorId: actor?.id,
    metadata: {
      cafeName: cafe.name,
      slug: cafe.slug,
      ownerEmail: owners[0]?.email || null,
    },
  });

  await Promise.all(imageUrls.map((url) => deleteCloudinaryImage(url)));

  return { _id: cafe.id, name: cafe.name, slug: cafe.slug };
}
