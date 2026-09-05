import 'dotenv/config';
import { prisma } from './server/prisma.js';

async function main() {
  const r = await prisma.examQuiz.findMany({
    where: { id: { contains: 'aie103' } }
  });
  console.log('ExamQuizzes with aie103:', JSON.stringify(r, null, 2));
  
  const allExams = await prisma.examQuiz.findMany();
  console.log('Total ExamQuizzes:', allExams.length);
  console.log('All exam IDs:', allExams.map(e => e.id));
  
  await prisma.$disconnect();
}

main().catch(console.error);
