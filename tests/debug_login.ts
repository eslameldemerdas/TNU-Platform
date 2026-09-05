import 'dotenv/config';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'changeme@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

async function req(method, path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (opts.cookie) headers.Cookie = opts.cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  console.log('STATUS:', res.status);
  console.log('SET-COOKIE:', res.headers.get('set-cookie'));
  console.log('BODY:', text.substring(0, 300));
  return { status: res.status, headers: res.headers, text };
}

console.log('Testing admin login...');
await req('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
