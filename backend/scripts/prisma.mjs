import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.VERCEL) {
  dotenv.config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true,
    override: true,
  });
}

function ensureDirectUrl() {
  if (String(process.env.DIRECT_URL || '').trim()) {
    return;
  }

  process.env.DIRECT_URL = String(process.env.DATABASE_URL || '');
}

function runPrisma(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['prisma', ...args], {
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`prisma ${args.join(' ')} exited ${code}`));
    });
  });
}

async function migrateWithRetry() {
  const delays = [3000, 6000, 10000, 15000, 20000];

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      await runPrisma(['migrate', 'deploy']);
      return;
    } catch (error) {
      if (attempt === delays.length) {
        throw error;
      }

      const wait = delays[attempt];
      console.warn(`prisma migrate deploy failed (advisory lock?). Retry ${attempt + 1}/${delays.length} in ${wait}ms`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

ensureDirectUrl();

const command = process.argv[2];

if (command === 'generate') {
  await runPrisma(['generate']);
} else if (command === 'migrate') {
  await migrateWithRetry();
} else {
  throw new Error('Usage: node scripts/prisma.mjs generate|migrate');
}
