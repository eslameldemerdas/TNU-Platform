import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../server/prisma.ts';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

async function backup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

  console.log('[Backup] Starting database backup...');

  const tables = [
    'user', 'university', 'faculty', 'department', 'academicLevel', 'semester',
    'instructor', 'course', 'enrollment', 'studentProfile', 'pointsLedger',
    'resource', 'moderationAction', 'scheduleItem', 'examQuiz',
    'discussionThread', 'comment', 'userSession', 'auditLog',
    'resourceVote', 'postUpvote', 'quizSubmission', 'pomodoroSession',
    'notification', 'honorStudent', 'announcement', 'campusEvent', 'assignment'
  ];

  const data: Record<string, any[]> = {};

  for (const table of tables) {
    const modelName = table === 'user' ? 'user' :
      table === 'auditLog' ? 'auditLog' :
      table.charAt(0).toUpperCase() + table.slice(1);
    const camelModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    try {
      const rows = await (prisma as any)[camelModel].findMany();
      data[table] = rows.map((r: any) => ({
        ...r,
        createdAt: r.createdAt?.toISOString ? r.createdAt.toISOString() : r.createdAt,
        updatedAt: r.updatedAt?.toISOString ? r.updatedAt.toISOString() : r.updatedAt,
      }));
      console.log(`[Backup] ${table}: ${rows.length} rows`);
    } catch (e) {
      console.log(`[Backup] ${table}: skipped (${(e as Error).message.substring(0, 50)})`);
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
  console.log(`[Backup] Written to: ${backupFile}`);
  console.log(`[Backup] Size: ${(fs.statSync(backupFile).size / 1024).toFixed(1)} KB`);

  await prisma.$disconnect();
}

backup().catch((e) => {
  console.error('[Backup] Fatal error:', e);
  process.exit(1);
});
