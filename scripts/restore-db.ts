import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../server/prisma.ts';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

async function restore(backupFile: string) {
  console.log('[Restore] Starting database restore from:', backupFile);

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log('[Restore] Backup loaded. Tables:', Object.keys(backup).join(', '));

  const tables = Object.keys(backup);
  
  for (const table of tables) {
    const rows = backup[table];
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`[Restore] ${table}: skipped (empty)`);
      continue;
    }

    const modelName = table === 'user' ? 'user' :
      table === 'auditLog' ? 'auditLog' :
      table.charAt(0).toUpperCase() + table.slice(1);
    const camelModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);

    try {
      const model = (prisma as any)[camelModel];
      if (!model) {
        console.log(`[Restore] ${table}: skipped (model not found)`);
        continue;
      }

      await model.deleteMany();
      const result = await model.createMany({ data: rows });
      console.log(`[Restore] ${table}: restored ${result.count} rows`);
    } catch (e) {
      console.log(`[Restore] ${table}: error - ${(e as Error).message.substring(0, 80)}`);
    }
  }

  console.log('[Restore] Restore complete.');
  await prisma.$disconnect();
}

const backupFile = process.argv[2] || path.join(BACKUP_DIR, fs.readdirSync(BACKUP_DIR).sort().pop() || '');
restore(backupFile).catch((e) => {
  console.error('[Restore] Fatal error:', e);
  process.exit(1);
});
