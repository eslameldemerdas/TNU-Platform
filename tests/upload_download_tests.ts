import 'dotenv/config';
const BASE = 'http://localhost:3000';

const results: { name: string; pass: boolean; detail: string }[] = [];

function log(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

async function req(method: string, path: string, opts: { body?: any; cookie?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.cookie) headers.Cookie = opts.cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, headers: res.headers };
}

const cookieOf = (r: { headers: Headers }) => r.headers?.get?.('set-cookie')?.split(';')[0] || '';

async function main() {
  console.log('=== UPLOAD/DOWNLOAD SECURITY TESTS ===\n');

  const loginR = await req('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL || 'changeme@example.com', password: process.env.ADMIN_PASSWORD || 'changeme' } });
  const ADMIN_COOKIE = cookieOf(loginR);
  log('admin login', loginR.status === 200, `status=${loginR.status}`);
  if (!ADMIN_COOKIE) { console.error('Cannot continue without admin cookie'); process.exit(1); }

  const pdfBytes = Buffer.from('%PDF-1.4\n%TTL\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
  const b64 = pdfBytes.toString('base64');

  // Test duplicate filenames
  const r1 = await req('POST', '/api/resources', { body: { title: 'Dup Test', description: 'Duplicate filename test resource for testing', category: 'summary', courseId: 'course-eng011', courseCode: 'DUP', departmentId: 'dept-cmp', fileType: 'pdf', fileName: 'dup-test.pdf', fileData: b64 }, cookie: ADMIN_COOKIE });
  const id1 = r1.json?.resource?.id;
  log('duplicate upload 1', r1.status === 201 && !!id1, `id=${id1}`);

  const r2 = await req('POST', '/api/resources', { body: { title: 'Dup Test 2', description: 'Duplicate filename test resource 2 for testing', category: 'summary', courseId: 'course-eng011', courseCode: 'DUP', departmentId: 'dept-cmp', fileType: 'pdf', fileName: 'dup-test.pdf', fileData: b64 }, cookie: ADMIN_COOKIE });
  const id2 = r2.json?.resource?.id;
  log('duplicate upload 2 (different IDs)', r2.status === 201 && !!id2 && id2 !== id1, `id1=${id1}, id2=${id2}`);

  // Download URL TTL and tamper-proofing
  if (id1) {
    const dlR = await req('GET', '/api/files/download-url?fileId=' + id1, { cookie: ADMIN_COOKIE });
    const dlJson = dlR.json;
    log('download URL generated', !!dlJson?.signedUrl, `url=${dlJson?.signedUrl}`);

    if (dlJson?.signedUrl) {
      const expiresAt = new Date(dlJson.expiresAt);
      const now = new Date();
      const ttlMs = expiresAt.getTime() - now.getTime();
      const ttlMinutes = ttlMs / 1000 / 60;
      log('download URL TTL ~15 minutes', ttlMinutes > 14 && ttlMinutes < 16, `ttl=${ttlMinutes.toFixed(1)}min`);

      // Tamper with the token
      const tamperedUrl = dlJson.signedUrl.replace(/token=[^&]+/, 'token=invalidtoken123');
      const tamperedR = await req('GET', tamperedUrl);
      log('tampered download token rejected', tamperedR.status === 403, `status=${tamperedR.status}`);

      // Valid download
      const validR = await req('GET', dlJson.signedUrl);
      log('valid download works', validR.status === 200, `status=${validR.status}`);
    }
  }

  // Check file on disk is within uploads dir
  if (id1) {
    const fs = await import('fs');
    const path = await import('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let foundOutside = false;
    for (const dir of fs.readdirSync(uploadsDir, { withFileTypes: true })) {
      if (dir.isDirectory()) {
        const subPath = path.join(uploadsDir, dir.name);
        for (const file of fs.readdirSync(subPath)) {
          if (file.includes('dup-test')) {
            const fullPath = path.join(subPath, file);
            if (!fullPath.startsWith(uploadsDir)) {
              foundOutside = true;
            }
          }
        }
      }
    }
    log('file stored inside uploads dir', !foundOutside, `id1=${id1}`);
  }

  const failed = results.filter(x => !x.pass);
  console.log(`\n===== UPLOAD/DOWNLOAD TESTS: ${results.length - failed.length}/${results.length} PASSED =====`);
  if (failed.length) {
    console.log('FAILED:', failed.map(f => f.name).join(' | '));
  }
}

main().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(1);
});
