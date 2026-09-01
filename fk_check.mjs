import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const q = async (name, sql) => {
  const r = await prisma.$queryRawUnsafe(sql);
  const count = Number(r[0]?.n ?? 0);
  console.log(`${count === 0 ? 'PASS' : 'FAIL'}  FK check: ${name} — orphans=${count}`);
  return count === 0;
};
let allOk = true;
allOk &= await q('enrollment→user', "SELECT COUNT(*) n FROM enrollment e LEFT JOIN \"user\" u ON e.student_id=u.id WHERE u.id IS NULL");
allOk &= await q('enrollment→course', "SELECT COUNT(*) n FROM enrollment e LEFT JOIN course c ON e.course_id=c.id WHERE c.id IS NULL");
allOk &= await q('resource→user', "SELECT COUNT(*) n FROM resource r LEFT JOIN \"user\" u ON r.uploader_id=u.id WHERE u.id IS NULL");
allOk &= await q('resource→course', "SELECT COUNT(*) n FROM resource r LEFT JOIN course c ON r.course_id=c.id WHERE c.id IS NULL");
allOk &= await q('thread→user', "SELECT COUNT(*) n FROM discussion_thread t LEFT JOIN \"user\" u ON t.author_id=u.id WHERE u.id IS NULL");
allOk &= await q('comment→user', "SELECT COUNT(*) n FROM comment c LEFT JOIN \"user\" u ON c.author_id=u.id WHERE u.id IS NULL");
allOk &= await q('notification→user', "SELECT COUNT(*) n FROM notification n LEFT JOIN \"user\" u ON n.user_id=u.id WHERE u.id IS NULL");
allOk &= await q('ledger→user', "SELECT COUNT(*) n FROM points_ledger l LEFT JOIN \"user\" u ON l.user_id=u.id WHERE u.id IS NULL");
allOk &= await q('vote→resource', "SELECT COUNT(*) n FROM resource_vote v LEFT JOIN resource r ON v.resource_id=r.id WHERE r.id IS NULL");
allOk &= await q('session→user', "SELECT COUNT(*) n FROM user_session s LEFT JOIN \"user\" u ON s.user_id=u.id WHERE u.id IS NULL");
allOk &= await q('pomodoro→user', "SELECT COUNT(*) n FROM pomodoro_session p LEFT JOIN \"user\" u ON p.user_id=u.id WHERE u.id IS NULL");
allOk &= await q('honor→user', "SELECT COUNT(*) n FROM honor_student h LEFT JOIN \"user\" u ON h.user_id=u.id WHERE u.id IS NULL");
// duplicate checks
const dup = await prisma.$queryRawUnsafe("SELECT email, COUNT(*) n FROM \"user\" GROUP BY email HAVING COUNT(*)>1");
console.log(`${dup.length === 0 ? 'PASS' : 'FAIL'}  unique: user emails — dups=${dup.length}`);
// ledger↔user.points consistency
const drift = await prisma.$queryRawUnsafe("SELECT u.id, u.points, COALESCE(SUM(l.points),0) s FROM \"user\" u LEFT JOIN points_ledger l ON l.user_id=u.id GROUP BY u.id HAVING u.points <> COALESCE(SUM(l.points),0)");
console.log(`${drift.length === 0 ? 'PASS' : 'FAIL'}  consistency: user.points == SUM(ledger) — drift=${drift.length}`);
console.log(allOk && drift.length === 0 && dup.length === 0 ? 'ALL FK CHECKS PASS' : 'FK FAILURES PRESENT');
await prisma.$disconnect();
