/**
 * Embedded PostgreSQL bridge.
 *
 * EngHub supports two deployment modes:
 *  1. External PostgreSQL — set DATABASE_URL to a real postgres:// URL (production).
 *  2. Embedded mode (default local/dev) — a real PostgreSQL engine (PGlite) is
 *     started in-process, persisted to disk at ./.pgdata, and exposed over the
 *     Postgres wire protocol on 127.0.0.1:54329. Prisma connects through the
 *     standard `pg` adapter, so all storage is genuine SQL on disk — NOT memory.
 *
 * Data survives full process restarts because PGlite writes to the data dir.
 */
import net from 'net';
import path from 'path';
import fs from 'fs';

const EMBEDDED_PORT = 54329;
const EMBEDDED_HOST = '127.0.0.1';

export function needsEmbeddedDb(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return true;
  // Placeholder URLs from the .env template also trigger embedded mode.
  if (url.includes('user:pass@host') || url.includes('changeme')) return true;
  // The embedded endpoint itself — always ensure the bridge is up.
  if (url.includes('127.0.0.1:54329') || url.includes('localhost:54329')) return true;
  return false;
}

export async function startEmbeddedDb(): Promise<void> {
  // If a bridge is already serving this port (e.g. a standalone CLI bridge), reuse it.
  const alreadyUp = await new Promise<boolean>((resolve) => {
    const probe = net.connect(EMBEDDED_PORT, EMBEDDED_HOST);
    probe.once('connect', () => { probe.destroy(); resolve(true); });
    probe.once('error', () => resolve(false));
    setTimeout(() => { probe.destroy(); resolve(false); }, 1500);
  });
  if (alreadyUp) {
    console.log(`[EmbeddedDB] Reusing existing PostgreSQL bridge on ${EMBEDDED_HOST}:${EMBEDDED_PORT}`);
    return;
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { PGLiteSocketServer } = await import('@electric-sql/pglite-socket');

  const dataDir = path.join(process.cwd(), '.pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new PGlite(dataDir);
  await db.waitReady;

  const server = new PGLiteSocketServer({ db, port: EMBEDDED_PORT, host: EMBEDDED_HOST, maxConnections: 40 });
  await server.start();
  console.log(`[EmbeddedDB] PostgreSQL (PGlite) listening on ${EMBEDDED_HOST}:${EMBEDDED_PORT}, data dir: ${dataDir}`);
}

/** Standalone runner so `prisma db push` / seed can talk to the embedded DB. */
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('pglite-server');
if (isDirectRun) {
  startEmbeddedDb().catch((err) => {
    console.error('[EmbeddedDB] Failed to start:', err);
    process.exit(1);
  });
  // Keep process alive while serving.
  process.on('SIGINT', () => process.exit(0));
}
