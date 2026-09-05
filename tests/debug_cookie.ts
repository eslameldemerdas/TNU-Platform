import 'dotenv/config';

const BASE = 'http://localhost:3000';

async function req(method: string, path: string, opts: { body?: any; cookie?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.cookie) headers.Cookie = opts.cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

async function main() {
  // Login
  const loginR = await req('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL || 'eldmrdasheslam1@gmail.com', password: process.env.ADMIN_PASSWORD || 'UgF0YVaMhQKRpiBID36EnmST' } });
  console.log('Login status:', loginR.status);
  console.log('Login body:', loginR.text.substring(0, 200));
  console.log('Login headers:', loginR.headers);
  
  const cookie = loginR.headers?.get?.('set-cookie')?.split(';')[0] || '';
  console.log('Cookie:', cookie);
}

main().catch(console.error);
