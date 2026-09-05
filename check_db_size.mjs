import 'dotenv/config';
import { prisma } from './server/prisma.ts';

async function main() {
  const r = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`;
  console.log('DB size:', r);
  await prisma.$disconnect();
}

main().catch(console.error);
