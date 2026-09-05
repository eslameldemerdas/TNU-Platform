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
  return { status: res.status, text };
}

async function main() {
  const loginR = await req('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL || 'changeme@example.com', password: process.env.ADMIN_PASSWORD || 'changeme' } });
  const cookie = loginR.headers?.get?.('set-cookie')?.split(';')[0] || '';

  const pdfBytes = Buffer.from('%PDF-1.4\n%TTL\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
  const b64 = pdfBytes.toString('base64');

  const r1 = await req('POST', '/api/resources', { body: { title: 'TTL Test', description: 'TTL test resource for verification', category: 'summary', courseId: 'course-eng011', courseCode: 'TTL', departmentId: 'dept-cmp', fileType: 'pdf', fileName: 'ttl-test.pdf', fileData: b64 }, cookie });
  console.log('Upload status:', r1.status);
  const id1 = JSON.parse(r1.text).resource?.id;
  console.log('Upload ID:', id1);

  const dlR = await req('GET', '/api/files/download-url?fileId=' + id1, { cookie });
  const dlJson = JSON.parse(dlR.text);
  console.log('Download URL:', dlJson.signedUrl);
  console.log('ExpiresAt:', dlJson.expiresAt);

  // Tamper with the token
  const tamperedUrl = dlJson.signedUrl.replace(/token=[^&]+/, 'token=invalidtoken123');
  const tamperedR = await req('GET', tamperedUrl);
  console.log('Tampered URL status:', tamperedR.status);

  // Valid download
  const validR = await req('GET', dlJson.signedUrl);
  console.log('Valid download status:', validR.status);
}
main().catch(console.error);
