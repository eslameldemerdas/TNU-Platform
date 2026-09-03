import 'dotenv/config';
import { prisma } from './server/prisma.js';

// Try to query the Announcement table directly
try {
  const count = await prisma.announcement.count();
  console.log('Announcement table exists, count:', count);
} catch (e) {
  console.log('Announcement table error:', (e as Error).message);
}

// Try to get all model names
try {
  const client = (await import('@prisma/client')).PrismaClient;
  const models = Object.keys(client).filter(k => 
    k[0] === k[0].toLowerCase() && 
    k !== 'DefaultArgs' && 
    typeof (client as any)[k] === 'function' &&
    !k.startsWith('_')
  );
  console.log('Prisma models:', models.slice(0, 30));
} catch (e) {
  console.log('Model list error:', (e as Error).message);
}

await prisma.$disconnect();
