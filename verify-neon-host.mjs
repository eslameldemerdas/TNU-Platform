// Show Neon connection proof using pg directly.
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const url = process.env.DATABASE_URL || '';

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('Connected to Neon successfully');

  const result = await client.query('SELECT current_database() AS db, inet_server_addr() AS server_ip, version() AS version');
  console.log('DB info:', JSON.stringify(result.rows[0], null, 2));

  const urlObj = new URL(url);
  console.log('DATABASE_URL host:', urlObj.hostname);
  console.log('DATABASE_URL port:', urlObj.port || '5432');
  console.log('DATABASE_URL database:', urlObj.pathname.replace('/', ''));

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  const counts = {};
  for (const row of tables.rows) {
    const r = await client.query(`SELECT count(*) AS cnt FROM "${row.table_name}"`);
    counts[row.table_name] = r.rows[0].cnt;
  }
  console.log('Counts:', JSON.stringify(counts, null, 2));

  await client.end();
}

main().catch(e => { console.error('Connection failed:', e.message); process.exit(1); });