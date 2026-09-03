import 'dotenv/config';
import { prisma } from './server/prisma.js';

try {
  await prisma.$connect();
  console.log('Connected');
  const count = await prisma.course.count();
  console.log('courses:', count);
} catch (e) {
  console.log('Error:', e.message);
}
