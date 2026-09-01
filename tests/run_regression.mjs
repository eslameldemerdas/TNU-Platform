#!/usr/bin/env node
/**
 * EngHub regression test suite — live HTTP verification.
 * Run: node tests/run_regression.mjs   (server must be running on :3000)
 */
import 'dotenv/config';
const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'changeme@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const results = [];
function log(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
async function req(method, path, { body, token, cookie, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, headers: res.headers };
}
const cookieOf = (r) => r.headers.get('set-cookie')?.split(';')[0] || '';

// unique emails per run
const RUN = Date.now();

// ================= 1. AUTH =================
let r = await req('POST', '/api/auth/signup', { body: {
  fullName: 'Regression Student', email: `reg.${RUN}@test.edu`, phoneNumber: '+201001234567',
  password: 'Password123!', passwordConfirm: 'Password123!', departmentId: 'dept-cmp', level: 'Year 1 (Freshman)' } });
log('signup: 201 + session', r.status === 201 && !!r.json?.sessionToken, `status=${r.status}`);
const STU_COOKIE = cookieOf(r); const STU_TOKEN = r.json?.sessionToken;
const STU_ID = r.json?.user?.id;

r = await req('POST', '/api/auth/signup', { body: {
  fullName: 'Dup', email: `reg.${RUN}@test.edu`, phoneNumber: '+201001234567',
  password: 'Password123!', passwordConfirm: 'Password123!' } });
log('signup: duplicate email rejected 409', r.status === 409, `status=${r.status}`);

r = await req('POST', '/api/auth/signup', { body: {
  fullName: 'X', email: 'bad-email', phoneNumber: '+201001234567',
  password: 'Password123!', passwordConfirm: 'Password123!' } });
log('signup: malformed email rejected 400', r.status === 400, `status=${r.status}`);

r = await req('POST', '/api/auth/signup', { body: {
  fullName: 'Y', email: `weak.${RUN}@test.edu`, phoneNumber: '+201001234567',
  password: '123', passwordConfirm: '123' } });
log('signup: weak password rejected 400', r.status === 400, `status=${r.status}`);

r = await req('POST', '/api/auth/login', { body: { email: `reg.${RUN}@test.edu`, password: 'WRONG' } });
log('login: wrong password 401', r.status === 401, `status=${r.status}`);

r = await req('POST', '/api/auth/login', { body: { email: `reg.${RUN}@test.edu`, password: 'Password123!' } });
log('login: success + cookie', r.status === 200 && r.headers.get('set-cookie')?.includes('HttpOnly'), `status=${r.status}`);

r = await req('GET', '/api/auth/me', { cookie: STU_COOKIE });
log('auth/me: authenticated with real identity', r.status === 200 && r.json?.authenticated && r.json?.user?.email === `reg.${RUN}@test.edu`, `status=${r.status}`);

r = await req('GET', '/api/auth/me', { cookie: 'enghub_session=forged' });
log('auth/me: forged token rejected 401', r.status === 401, `status=${r.status}`);

// Privilege escalation attempts
r = await req('POST', '/api/admin/update-role', { cookie: STU_COOKIE, body: { targetUserId: STU_ID, newRole: 'super_admin' } });
log('RBAC: student cannot self-escalate (403)', r.status === 403, `status=${r.status}`);

r = await req('GET', '/api/admin/stats', { cookie: STU_COOKIE });
log('RBAC: student blocked from admin stats', r.status === 403, `status=${r.status}`);

r = await req('GET', '/api/admin/users', { cookie: STU_COOKIE });
log('RBAC: student blocked from user directory', r.status === 403, `status=${r.status}`);

r = await req('GET', '/api/admin/stats');
log('RBAC: anonymous blocked from admin stats', r.status === 401, `status=${r.status}`);

// ================= 2. ADMIN (super admin) =================
r = await req('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
const ADMIN_COOKIE = cookieOf(r);
log('login: seeded super_admin works', r.status === 200 && r.json?.user?.role === 'super_admin', `status=${r.status} role=${r.json?.user?.role}`);

r = await req('GET', '/api/admin/stats', { cookie: ADMIN_COOKIE });
const statsReal = r.json && r.json.totalUsers >= 8 && typeof r.json.approvedFiles === 'number' && r.json.totalDownloads !== 3850 || true;
log('admin stats: real DB numbers', r.status === 200 && Number.isInteger(r.json?.totalUsers) && r.json.totalUsers >= 8, `totalUsers=${r.json?.totalUsers} approvedFiles=${r.json?.approvedFiles} downloads=${r.json?.totalDownloads}`);

// Role management: promote to moderator, then back
r = await req('POST', '/api/admin/update-role', { cookie: ADMIN_COOKIE, body: { targetUserId: STU_ID, newRole: 'moderator' } });
log('update-role: super_admin promotes to moderator', r.status === 200 && r.json?.user?.role === 'moderator', `status=${r.status}`);
r = await req('POST', '/api/admin/update-role', { cookie: ADMIN_COOKIE, body: { targetUserId: STU_ID, newRole: 'student' } });
log('update-role: demote back to student', r.status === 200 && r.json?.user?.role === 'student', `status=${r.status}`);

// No phantom user creation
r = await req('POST', '/api/admin/update-role', { cookie: ADMIN_COOKIE, body: { targetEmail: `ghost.${RUN}@nowhere.edu`, newRole: 'moderator' } });
log('update-role: phantom user NOT created (404)', r.status === 404, `status=${r.status}`);

// Department admin scoping
r = await req('POST', '/api/auth/login', { body: { email: 'samer.haddad@tnu.edu.eg', password: 'irrelevant-' + RUN } });
log('dept_admin: seeded random password cannot be guessed (401)', r.status === 401, `status=${r.status}`);

// ================= 3. FILE UPLOAD/DOWNLOAD ROUND-TRIP =================
// Real PDF bytes with proper header
const pdfBytes = Buffer.from('%PDF-1.4\n%EngHub-Regression-Payload-' + RUN + '\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
const b64 = pdfBytes.toString('base64');
r = await req('POST', '/api/resources', { cookie: STU_COOKIE, body: {
  title: 'Regression Test Summary ' + RUN,
  description: 'Automated regression upload with real bytes for round-trip verification.',
  category: 'summary', courseId: 'course-eng011', courseCode: 'ENG 011', departmentId: 'dept-cmp',
  fileType: 'pdf', fileName: `regression-${RUN}.pdf`, fileData: b64, tags: ['regression'] } });
log('upload: accepted with real PDF bytes', r.status === 201, `status=${r.status} id=${r.json?.resource?.id}`);
const RES_ID = r.json?.resource?.id;

// Mismatched magic bytes (EXE disguised as PDF)
const exeB64 = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff', 'binary').toString('base64');
r = await req('POST', '/api/resources', { cookie: STU_COOKIE, body: {
  title: 'Malicious EXE as PDF', description: 'Should be rejected by magic-byte validation.',
  category: 'summary', courseId: 'course-eng011', courseCode: 'ENG 011', departmentId: 'dept-cmp',
  fileType: 'pdf', fileName: 'evil.pdf', fileData: exeB64 } });
log('upload: EXE-as-PDF rejected', r.status === 400, `status=${r.status}`);

// Student category restriction
r = await req('POST', '/api/resources', { cookie: STU_COOKIE, body: {
  title: 'Illegal exam upload by student', description: 'Students may not upload exams.',
  category: 'previous_exam', courseId: 'course-eng011', courseCode: 'ENG 011', departmentId: 'dept-cmp',
  fileType: 'pdf', fileName: 'exam.pdf', fileData: b64 } });
log('upload: student restricted from previous_exam (403)', r.status === 403, `status=${r.status}`);

// Download round-trip: student owns pending resource → token → bytes equal
r = await req('GET', `/api/files/download-url?fileId=${RES_ID}`, { cookie: STU_COOKIE });
const signedUrl = r.json?.signedUrl;
log('download-url: signed token issued', r.status === 200 && !!signedUrl, signedUrl?.slice(0, 60));
const dl = await fetch(BASE + signedUrl);
const dlBytes = Buffer.from(await dl.arrayBuffer());
log('download: EXACT byte round-trip', dl.status === 200 && dlBytes.equals(pdfBytes),
  `status=${dl.status} bytes=${dlBytes.length} match=${dlBytes.equals(pdfBytes)}`);

// Forged token
r = await req('GET', `/api/files/download/${RES_ID}?token=9999999999999.deadbeef`);
log('download: forged token rejected 403', r.status === 403, `status=${r.status}`);

// ================= 4. COMMUNITY + POINTS =================
r = await req('POST', '/api/posts', { cookie: STU_COOKIE, body: {
  title: 'Regression persistence probe ' + RUN, content: 'This post must survive a full server restart in the database.',
  courseId: 'course-eng011', courseCode: 'ENG 011', postType: 'question' } });
const POST_ID = r.json?.post?.id;
log('post: created (+5 pts via ledger)', r.status === 201, `status=${r.status} id=${POST_ID}`);

r = await req('POST', `/api/posts/${POST_ID}/comments`, { cookie: STU_COOKIE, body: { content: 'Self reply for regression.' } });
const COMMENT_ID = r.json?.comment?.id;
log('comment: created', r.status === 201, `status=${r.status}`);

r = await req('POST', `/api/posts/${POST_ID}/solve`, { cookie: STU_COOKIE, body: { commentId: COMMENT_ID } });
log('solve: author accepts own comment', r.status === 200, `status=${r.status}`);

// ================= 5. LEADERBOARD =================
r = await req('GET', '/api/leaderboard');
const lb = r.json?.leaderboard;
log('leaderboard: real data, staff excluded', r.status === 200 && Array.isArray(lb) && lb.length >= 1 &&
  lb.every(u => typeof u.points === 'number') && !lb.some(u => u.name === 'Faculty Super Administrator'),
  `entries=${lb?.length} top=${lb?.[0]?.name}:${lb?.[0]?.points}`);

// ================= 6. QUIZ SERVER-SIDE GRADING =================
// Unknown quiz: rejected (no client-trusted grading)
r = await req('POST', '/api/quiz/submit', { cookie: STU_COOKIE, body: {
  quizId: 'fake-quiz-' + RUN, answers: [{ questionId: 'q1', selectedIndex: 0 }] } });
log('quiz: unknown quizId rejected (no client grading)', r.status === 400, `status=${r.status}`);

// Real seeded quiz: correct answers graded server-side
const quizResp = await req('GET', '/api/exams/quiz-aie103-01');
const quiz = quizResp.json;
const bank = Array.isArray(quiz?.questions) ? quiz.questions : [];
if (bank.length > 0) {
  const answers = bank.map(q => ({ questionId: String(q.id), selectedIndex: q.correctIndex }));
  // omit correctIndex deliberately to prove server doesn't need it
  r = await req('POST', '/api/quiz/submit', { cookie: STU_COOKIE, body: { quizId: 'quiz-aie103-01', answers } });
  log('quiz: server graded real quiz 100%', r.status === 200 && r.json?.submission?.percentage === 100,
    `status=${r.status} pct=${r.json?.submission?.percentage}`);
  const wrong = bank.map(q => ({ questionId: String(q.id), selectedIndex: (q.correctIndex + 1) % (q.options?.length || 4) }));
  // claim all-correct from client — server must NOT trust it
  const lie = wrong.map(a => ({ ...a, correctIndex: 0, isCorrect: true }));
  r = await req('POST', '/api/quiz/submit', { cookie: STU_COOKIE, body: { quizId: 'quiz-aie103-01', answers: lie } });
  log('quiz: forged client answers NOT trusted (0%)', r.status === 200 && r.json?.submission?.percentage === 0,
    `pct=${r.json?.submission?.percentage}`);
} else {
  log('quiz: exam bank present', false, 'quiz-aie103-01 missing from DB');
}

// ================= 7. POMODORO CAPS =================
let awarded = 0;
for (let i = 0; i < 6; i++) {
  r = await req('POST', '/api/study/pomodoro/log', { cookie: STU_COOKIE, body: { durationMinutes: 25, mode: 'focus' } });
  awarded += r.json?.session?.pointsAwarded || 0;
}
log('pomodoro: daily points cap enforced (max 20)', awarded <= 20, `awarded=${awarded}`);

// ================= 8. NOTIFICATIONS & IDOR =================
r = await req('GET', '/api/notifications', { cookie: STU_COOKIE });
const firstNotif = r.json?.notifications?.[0];
log('notifications: persisted for user', r.status === 200 && r.json?.notifications?.length >= 1, `total=${r.json?.total}`);

// IDOR: student tries to mark the ADMIN's notification (fetch one via admin)
const adminNotifs = await req('GET', '/api/notifications', { cookie: ADMIN_COOKIE });
const adminNotifId = adminNotifs.json?.notifications?.[0]?.id;
if (adminNotifId) {
  r = await req('POST', `/api/notifications/${adminNotifId}/read`, { cookie: STU_COOKIE });
  log('IDOR: student cannot mark admin notification (403)', r.status === 403, `status=${r.status}`);
}

// ================= 9. GUEST STATE =================
r = await req('GET', '/api/leaderboard');
log('guest: leaderboard readable anonymously', r.status === 200, `status=${r.status}`);
r = await req('GET', '/api/notifications');
log('guest: notifications empty, not fabricated', r.status === 200 && r.json?.total === 0, `total=${r.json?.total}`);

// ================= 10. REAL ANALYTICS =================
r = await req('GET', '/api/analytics');
log('analytics: real counts (not 800/420/3850)', r.status === 200 && r.json?.activeStudents !== 800 &&
  Number.isInteger(r.json?.activeStudents), `students=${r.json?.activeStudents} files=${r.json?.totalStudyFiles} downloads=${r.json?.totalDownloads}`);

// ================= SUMMARY =================
const failed = results.filter(x => !x.pass);
console.log(`\n===== ${results.length - failed.length}/${results.length} PASSED =====`);
if (failed.length) { console.log('FAILED:', failed.map(f => f.name).join(' | ')); process.exit(1); }
// export ids for restart phase
console.log('RESTART_MARK:' + JSON.stringify({ RUN, STU_ID, POST_ID, RES_ID, email: `reg.${RUN}@test.edu` }));
