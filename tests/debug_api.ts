import 'dotenv/config';

const BASE = 'http://localhost:3000';

async function req(method, path, opts = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (opts.cookie) headers.Cookie = opts.cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  console.log('PATH:', path);
  console.log('STATUS:', res.status);
  console.log('BODY:', text.substring(0, 500));
  console.log('---');
  return { status: res.status, text, headers: res.headers };
}

// Login as admin first
const loginR = await req('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
const cookie = loginR.headers.get('set-cookie') || '';

// Create a test resource
const pdfBytes = Buffer.from('%PDF-1.4\n%Test\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
const b64 = pdfBytes.toString('base64');

const resR = await req('POST', '/api/resources', {
  body: { title: 'Test Resource', description: 'Test', category: 'summary', courseId: 'course-eng011', courseCode: 'TEST', departmentId: 'dept-cmp', fileType: 'pdf', fileName: 'test.pdf', fileData: b64 },
  headers: { Cookie: cookie }
});

const resJson = JSON.parse(resR.text);
const resId = resJson.resource?.id;
console.log('Resource ID:', resId);

// Try to read the resource via API
const readR = await req('GET', '/api/resources?limit=100', { headers: { Cookie: cookie } });
const readJson = JSON.parse(readR.text);
console.log('Resources response type:', typeof readJson);
console.log('Resources keys:', readJson.resources ? 'has resources' : Object.keys(readJson));

// Try DELETE
const delR = await req('DELETE', `/api/resources/${resId}`, { headers: { Cookie: cookie } });
console.log('Delete status:', delR.status);

// Try discussions
const postR = await req('POST', '/api/posts', {
  body: { title: 'Test Post', content: 'Test content', courseId: 'course-eng011', courseCode: 'TEST', departmentId: 'dept-cmp', postType: 'question' },
  headers: { Cookie: cookie }
});
const postId = JSON.parse(postR.text).post?.id;
console.log('Post ID:', postId);

const upPostR = await req('PATCH', `/api/posts/${postId}`, { body: { title: 'Updated Post' }, headers: { Cookie: cookie } });
console.log('Update post status:', upPostR.status);

const delPostR = await req('DELETE', `/api/posts/${postId}`, { headers: { Cookie: cookie } });
console.log('Delete post status:', delPostR.status);
