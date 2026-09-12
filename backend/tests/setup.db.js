import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import { assertSafeTestDatabase } from './safeDatabase.js';

assertSafeTestDatabase(env.DATABASE_URL);

async function resetDatabase() {
  await prisma.qrChangeRequest.deleteMany();
  await prisma.menuImport.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.trialLead.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cafe.deleteMany();
}

beforeAll(async () => {
  await prisma.$connect();
  await resetDatabase();
}, 30000);

afterEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
