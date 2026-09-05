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
  const loginR = await req('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL || 'changeme@example.com', password: process.env.ADMIN_PASSWORD || 'changeme' } });
  const cookie = loginR.headers?.get?.('set-cookie')?.split(';')[0] || '';
  console.log('Login status:', loginR.status);

  const pdfBytes = Buffer.from('%PDF-1.4\n%Dup\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
  const b64 = pdfBytes.toString('base64');

  const r1 = await req('POST', '/api/resources', { body: { title: 'Dup Test', description: 'Duplicate filename test resource for testing', category: 'summary', courseId: 'course-eng011', courseCode: 'DUP', departmentId: 'dept-cmp', fileType: 'pdf', fileName: 'dup-test.pdf', fileData: b64 }, cookie });
  console.log('First upload status:', r1.status);
  const id1 = JSON.parse(r1.text).resource?.id;
  console.log('First upload ID:', id1);

  const r2 = await req('POST', '/api/resources', { body: { title: 'Dup Test 2', description: 'Duplicate filename test resource 2 for testing', category: 'summary', courseId: 'course-eng011', courseCode: 'DUP', departmentId: 'dept-cmp', fileType: 'pdf', fileName: 'dup-test.pdf', fileData: b64 }, cookie });
  console.log('Second upload status:', r2.status);
  const id2 = JSON.parse(r2.text).resource?.id;
  console.log('Second upload ID:', id2);

  if (id1) {
    const dlR = await req('GET', '/api/files/download-url?fileId=' + id1, { cookie });
    console.log('Download URL response:', dlR.text);
  }
}
main().catch(console.error);
