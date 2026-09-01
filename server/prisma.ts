import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let adapter: PrismaPg | null = null;

function getAdapter() {
  if (!adapter) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('[Prisma] DATABASE_URL is not set. Cannot create adapter.');
    }
    adapter = new PrismaPg({ connectionString: url });
  }
  return adapter;
}

export const prisma = new PrismaClient({ adapter: getAdapter() });

export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('[Prisma] Connected to PostgreSQL');
  } catch (err) {
    console.error('[Prisma] Connection failed:', err);
    throw err;
  }
}

export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error('[Prisma] Disconnect error:', err);
  }
}
