// Verify Neon DB data after seed.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const courses = await prisma.course.count();
  const users = await prisma.user.count();
  const resources = await prisma.resource.count();
  const posts = await prisma.discussionThread.count();
  const comments = await prisma.comment.count();
  const notifications = await prisma.notification.count();
  const ledger = await prisma.pointsLedger.count();
  const sessions = await prisma.userSession.count();
  const exams = await prisma.examQuiz.count();

  console.log(JSON.stringify({ courses, users, resources, posts, comments, notifications, ledger, sessions, exams }, null, 2));

  // Show database host
  const hostResult = await prisma.$queryRaw`SELECT inet_server_addr() AS host, current_database() AS db`;
  console.log('DB host info:', JSON.stringify(hostResult, null, 2));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });