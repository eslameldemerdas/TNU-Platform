// Neon persistence verification via HTTP API only.
import { setTimeout as wait } from 'node:timers/promises';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'eldmrdasheslam1@gmail.com';
const ADMIN_PASSWORD = 'UgF0YVaMhQKRpiBID36EnmST';
const STEP1 = JSON.parse(fs.readFileSync('C:/Users/magico/AppData/Local/Temp/kilo/audit/neon_persistence_step1.json', 'utf8'));
const RESOURCE_ID = STEP1.uploadResourceId;
const MARKER = STEP1.uploadMarker;
const out = {};

async function http(method, path, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const body = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
  const r = await fetch(BASE + path, { method, headers, body });
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await r.json().catch(() => null) : await r.text();
  return { status: r.status, data };
}

async function main() {
  // Login
  const login = await http('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  out.loginStatus = login.status;
  const token = login.data && login.data.sessionToken;

  if (!token) {
    out.error = 'Login failed';
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  // List resources and find our test resource
  const list = await http('GET', '/api/resources?limit=100', { headers: { authorization: `Bearer ${token}` } });
  out.listStatus = list.status;
  const resources = (list.data && list.data.resources) || [];
  const found = resources.find((r) => r.id === RESOURCE_ID);
  out.resourceFound = !!found;
  out.resourceTitle = found && found.title;
  out.resourceFileKey = found && found.fileKey;

  // Download the file and check the marker
  const dlUrl = await http('GET', `/api/files/download-url?fileId=${RESOURCE_ID}`, { headers: { authorization: `Bearer ${token}` } });
  out.downloadUrlStatus = dlUrl.status;
  out.hasSignedUrl = !!(dlUrl.data && dlUrl.data.signedUrl);

  let markerFound = false;
  if (dlUrl.data && dlUrl.data.signedUrl) {
    const dl = await fetch(BASE + dlUrl.data.signedUrl);
    const buf = Buffer.from(await dl.arrayBuffer());
    markerFound = buf.toString('utf8').includes(MARKER);
  }
  out.markerFoundInDownload = markerFound;

  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });