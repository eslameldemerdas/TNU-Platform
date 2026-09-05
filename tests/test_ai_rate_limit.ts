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
  const cookie = loginR.headers?.get?.('set-cookie')?.split(';')[0] || '';

  // Rapid fire AI requests to test rate limiting
  console.log('Testing AI rate limiting...');
  let rateLimited = false;
  for (let i = 0; i < 25; i++) {
    const r = await req('POST', '/api/ai/assistant', {
      body: { prompt: 'Hello ' + i },
      cookie: cookie
    });
    const json = JSON.parse(r.text);
    const isLimited = json.error?.code === 'RATE_LIMITED';
    if (isLimited) rateLimited = true;
    console.log('Request ' + (i + 1) + ': status=' + r.status + ' error=' + (json.error?.code || 'none'));
    if (isLimited) break;
  }
  console.log('Rate limiting triggered: ' + rateLimited);
}

main().catch(console.error);
