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
  console.log('PATH:', path);
  console.log('STATUS:', res.status);
  console.log('BODY:', text.substring(0, 800));
  console.log('---');
  return { status: res.status, text, headers: res.headers };
}

// Login as admin
const adminLoginR = await req('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
const adminCookie = adminLoginR.headers.get('set-cookie') || '';

// Create a test resource as admin
const pdfBytes = Buffer.from('%PDF-1.4\n%Test\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
const b64 = pdfBytes.toString('base64');
const resR = await req('POST', '/api/resources', {
  body: { title: 'Test Resource', description: 'Test resource for API testing', category: 'summary', courseId: 'course-eng011', courseCode: 'TEST', departmentId: 'dept-cmp', fileType: 'pdf', fileName: 'test.pdf', fileData: b64 },
  headers: { Cookie: adminCookie }
});
const resJson = JSON.parse(resR.text);
const resId = resJson.resource?.id;
console.log('Created resource ID:', resId);

// Read resources via API
const readR = await req('GET', '/api/resources?limit=100', { headers: { Cookie: adminCookie } });
const readJson = JSON.parse(readR.text);
console.log('Response type:', readJson.resources ? 'resources array' : typeof readJson);
if (readJson.resources) {
  const found = readJson.resources.find((r: any) => r.id === resId);
  console.log('Found resource:', found ? 'YES' : 'NO');
  console.log('Resource title:', found?.title);
}
