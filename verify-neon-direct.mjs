// Test direct pg connection to Neon.
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_THD58BqRIcpk@ep-royal-frost-axy82sra-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('Connected to Neon successfully');

  const hostResult = await client.query('SELECT inet_server_addr() AS host, current_database() AS db, current_user AS user');
  console.log('DB host info:', JSON.stringify(hostResult.rows[0], null, 2));

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  const counts = {};
  for (const row of tables.rows) {
    const result = await client.query(`SELECT count(*) AS cnt FROM "${row.table_name}"`);
    counts[row.table_name] = result.rows[0].cnt;
  }
  console.log('Counts:', JSON.stringify(counts, null, 2));

  await client.end();
}

main().catch(e => { console.error('Connection failed:', e.message); process.exit(1); });