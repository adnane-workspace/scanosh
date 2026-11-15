import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { assertUsableSlug, slugify } from '../utils/slug.js';
import { generateToken } from '../utils/token.js';
import { recordActivity } from './activity.service.js';
import { ensureDefaultSections } from './category.service.js';
import { sendEmailVerificationCode, sendPasswordResetCode } from './mail.service.js';

function toPublicUser(user) {
  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cafeId: user.cafeId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    await recordActivity({
      action: 'auth_login_failed',
      metadata: { email: normalizedEmail, reason: 'invalid_credentials' },
    });
    throw new ApiError(401, 'Invalid credentials', null, 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    await recordActivity({
      action: 'auth_login_failed',
      actorId: user.id,
      cafeId: user.cafeId,
      metadata: { email: user.email, reason: 'invalid_credentials' },
    });
    throw new ApiError(401, 'Invalid credentials', null, 'INVALID_CREDENTIALS');
  }

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    await recordActivity({
      action: 'auth_login_failed',
      actorId: user.id,
      cafeId: user.cafeId,
      metadata: { email: user.email, reason: 'forbidden_role' },
    });
    throw new ApiError(403, 'Admin access required', null, 'ADMIN_REQUIRED');
  }

  if (user.role === 'admin') {
    if (!user.cafeId) {
      await recordActivity({
        action: 'auth_login_failed',
        actorId: user.id,
        metadata: { email: user.email, reason: 'no_cafe' },
      });
      throw new ApiError(403, 'No cafe associated with this account', null, 'NO_CAFE');
    }

    const cafe = await prisma.cafe.findUnique({
      where: { id: user.cafeId },
      select: { isActive: true },
    });

    if (!cafe || !cafe.isActive) {
      await recordActivity({
        action: 'auth_login_failed',
        actorId: user.id,
        cafeId: user.cafeId,
        metadata: { email: user.email, reason: 'cafe_disabled' },
      });
      throw new ApiError(403, 'This cafe is disabled', null, 'CAFE_DISABLED');
    }
  }

  const token = generateToken({
    sub: user.id,
    role: user.role,
    cafeId: user.cafeId,
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

export function getCurrentUser(user) {
  if (!user) {
    throw new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED');
  }

  return toPublicUser({
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cafeId: user.cafeId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

export async function register({ name, email, password, cafeName, slug }) {
  const normalizedEmail = email.toLowerCase();
  const cafeSlug = slugify(slug || cafeName);
  assertUsableSlug(cafeSlug);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(409, 'Email already in use', null, 'EMAIL_IN_USE');
  }

  const existingSlug = await prisma.cafe.findUnique({
    where: { slug: cafeSlug },
    select: { id: true },
  });

  if (existingSlug) {
    throw new ApiError(409, 'Cafe slug already in use', null, 'SLUG_IN_USE');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { cafe, user } = await prisma.$transaction(async (tx) => {
    const cafe = await tx.cafe.create({
      data: {
        name: cafeName.trim(),
        slug: cafeSlug,
        menuUi: { sectionsEnabled: true },
      },
    });

    const createdUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        cafeId: cafe.id,
        emailVerifiedAt: new Date(),
      },
    });

    return { cafe, user: createdUser };
  });

  await ensureDefaultSections(cafe.id);

  await recordActivity({
    action: 'cafe_created',
    actorId: user.id,
    cafeId: user.cafeId,
    metadata: {
      cafeName: cafeName.trim(),
      slug: cafeSlug,
      ownerName: name.trim(),
      ownerEmail: normalizedEmail,
      source: 'register',
    },
  });

  const token = generateToken({
    sub: user.id,
    role: user.role,
    cafeId: user.cafeId,
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(401, 'Authentication required', null, 'AUTH_REQUIRED');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new ApiError(400, 'Current password is incorrect', null, 'CURRENT_PASSWORD_INVALID');
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, 'The new password must be different', null, 'PASSWORD_UNCHANGED');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await recordActivity({
    action: 'auth_password_changed',
    actorId: user.id,
    cafeId: user.cafeId,
    metadata: {
      email: user.email,
      role: user.role,
    },
  });
}

const RESET_TTL_MS = 10 * 60 * 1000;
const RESET_RESEND_MS = 60 * 1000;
const RESET_MAX_PER_HOUR = 5;
const RESET_MAX_ATTEMPTS = 5;
const PURPOSE_RESET = 'password_reset';
const PURPOSE_VERIFY = 'email_verify';

function hashResetCode(email, code, purpose = PURPOSE_RESET) {
  return createHash('sha256').update(`${purpose}:${email}:${code}:${env.JWT_SECRET}`).digest('hex');
}

function codesMatch(expectedHash, email, code, purpose = PURPOSE_RESET) {
  const actual = hashResetCode(email, code, purpose);
  const expectedBuffer = Buffer.from(expectedHash, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');

  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

async function findActiveReset(email, purpose = PURPOSE_RESET) {
  return prisma.passwordReset.findFirst({
    where: {
      email,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function issueEmailVerification({ email, userId, locale = 'fr' }) {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recent = await prisma.passwordReset.findMany({
    where: { email, purpose: PURPOSE_VERIFY, createdAt: { gte: hourAgo } },
    orderBy: { createdAt: 'desc' },
    take: RESET_MAX_PER_HOUR,
  });

  const latest = recent[0];

  if (latest && now.getTime() - latest.createdAt.getTime() < RESET_RESEND_MS) {
    const retryAfter = Math.ceil((RESET_RESEND_MS - (now.getTime() - latest.createdAt.getTime())) / 1000);
    return { retryAfter };
  }

  if (recent.length >= RESET_MAX_PER_HOUR) {
    return { retryAfter: 3600 };
  }

  await prisma.passwordReset.updateMany({
    where: { email, purpose: PURPOSE_VERIFY, consumedAt: null },
    data: { consumedAt: now },
  });

  const code = String(randomInt(100000, 1000000));

  await prisma.passwordReset.create({
    data: {
      email,
      userId: userId || null,
      purpose: PURPOSE_VERIFY,
      codeHash: hashResetCode(email, code, PURPOSE_VERIFY),
      expiresAt: new Date(now.getTime() + RESET_TTL_MS),
    },
  });

  const channel = await sendEmailVerificationCode({ to: email, code, locale });
  if (channel !== 'log') {
    console.info(`[email-verify] email sent via ${channel} to ${email}`);
  }

  return { retryAfter: RESET_RESEND_MS / 1000 };
}

export async function resendEmailVerification({ email, locale = 'fr' }) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) {
    console.info(`[email-verify] resend skipped for ${normalizedEmail} (missing or already verified)`);
    return { retryAfter: RESET_RESEND_MS / 1000 };
  }

  return issueEmailVerification({
    email: normalizedEmail,
    userId: user.id,
    locale,
  });
}

export async function verifyEmail({ email, code }) {
  const normalizedEmail = email.toLowerCase();
  const reset = await findActiveReset(normalizedEmail, PURPOSE_VERIFY);

  if (!reset || !codesMatch(reset.codeHash, normalizedEmail, code, PURPOSE_VERIFY)) {
    if (reset) {
      const attempts = reset.attempts + 1;
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: {
          attempts,
          ...(attempts >= RESET_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
    }

    throw new ApiError(400, 'Invalid or expired code', null, 'RESET_CODE_INVALID');
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { consumedAt: new Date() },
    });
    throw new ApiError(400, 'Invalid or expired code', null, 'RESET_CODE_INVALID');
  }

  if (user.emailVerifiedAt) {
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { consumedAt: new Date() },
    });
  } else {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { consumedAt: new Date() },
      }),
      prisma.passwordReset.updateMany({
        where: { email: normalizedEmail, purpose: PURPOSE_VERIFY, consumedAt: null, id: { not: reset.id } },
        data: { consumedAt: new Date() },
      }),
    ]);
  }

  const token = generateToken({
    sub: user.id,
    role: user.role,
    cafeId: user.cafeId,
  });

  return {
    token,
    user: toPublicUser({ ...user, emailVerifiedAt: user.emailVerifiedAt || new Date() }),
  };
}

export async function requestPasswordReset({ email, locale = 'fr' }) {
  const normalizedEmail = email.toLowerCase();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recent = await prisma.passwordReset.findMany({
    where: { email: normalizedEmail, purpose: PURPOSE_RESET, createdAt: { gte: hourAgo } },
    orderBy: { createdAt: 'desc' },
    take: RESET_MAX_PER_HOUR,
  });

  const latest = recent[0];

  if (latest && now.getTime() - latest.createdAt.getTime() < RESET_RESEND_MS) {
    const retryAfter = Math.ceil((RESET_RESEND_MS - (now.getTime() - latest.createdAt.getTime())) / 1000);
    return { retryAfter };
  }

  if (recent.length >= RESET_MAX_PER_HOUR) {
    return { retryAfter: 3600 };
  }

  await prisma.passwordReset.updateMany({
    where: { email: normalizedEmail, purpose: PURPOSE_RESET, consumedAt: null },
    data: { consumedAt: now },
  });

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  const code = String(randomInt(100000, 1000000));

  await prisma.passwordReset.create({
    data: {
      email: normalizedEmail,
      userId: user?.id || null,
      purpose: PURPOSE_RESET,
      codeHash: hashResetCode(normalizedEmail, code, PURPOSE_RESET),
      expiresAt: new Date(now.getTime() + RESET_TTL_MS),
    },
  });

  if (user) {
    const channel = await sendPasswordResetCode({ to: user.email, code, locale });
    if (channel !== 'log') {
      console.info(`[password-reset] email sent via ${channel} to ${user.email}`);
    }
  } else {
    console.info(`[password-reset] skipped for ${normalizedEmail} (no account)`);
  }

  return { retryAfter: RESET_RESEND_MS / 1000 };
}

export async function verifyPasswordResetCode({ email, code }) {
  const normalizedEmail = email.toLowerCase();
  const reset = await findActiveReset(normalizedEmail);

  if (!reset || !codesMatch(reset.codeHash, normalizedEmail, code)) {
    if (reset) {
      const attempts = reset.attempts + 1;
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: {
          attempts,
          ...(attempts >= RESET_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
    }

    throw new ApiError(400, 'Invalid or expired code', null, 'RESET_CODE_INVALID');
  }

  return { valid: true };
}

export async function resetPasswordWithCode({ email, code, newPassword }) {
  const normalizedEmail = email.toLowerCase();
  const reset = await findActiveReset(normalizedEmail);

  if (!reset || !codesMatch(reset.codeHash, normalizedEmail, code)) {
    if (reset) {
      const attempts = reset.attempts + 1;
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: {
          attempts,
          ...(attempts >= RESET_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
    }

    throw new ApiError(400, 'Invalid or expired code', null, 'RESET_CODE_INVALID');
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { consumedAt: new Date() },
    });
    throw new ApiError(400, 'Invalid or expired code', null, 'RESET_CODE_INVALID');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { consumedAt: new Date() },
    }),
    prisma.passwordReset.updateMany({
      where: { email: normalizedEmail, purpose: PURPOSE_RESET, consumedAt: null, id: { not: reset.id } },
      data: { consumedAt: new Date() },
    }),
  ]);

  await recordActivity({
    action: 'auth_password_changed',
    actorId: user.id,
    cafeId: user.cafeId,
    metadata: {
      email: user.email,
      role: user.role,
      source: 'forgot',
    },
  });
}

export function logout() {
  return {
    success: true,
    message: 'Logged out successfully',
  };
}
