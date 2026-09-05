import 'dotenv/config';
import { prisma } from '../server/prisma.ts';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'changeme@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

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

const cookieOf = (r: { headers: Headers }) => r.headers.get('set-cookie')?.split(';')[0] || '';
const RUN = Date.now();

async function main() {
  const loginR = await req('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const ADMIN_COOKIE = cookieOf(loginR);
  log('admin login', loginR.status === 200, `status=${loginR.status}`);
  if (!ADMIN_COOKIE) { console.error('Cannot continue without admin cookie'); process.exit(1); }

  const deptR = await req('GET', '/api/departments', { cookie: ADMIN_COOKIE });
  const deptId = deptR.json?.departments?.[0]?.id || 'dept-cmp';

  // ================== COURSE ==================
  const courseCode = `PERSIST${RUN.toString().slice(-4)}`;
  const cr = await req('POST', '/api/courses', {
    cookie: ADMIN_COOKIE,
    body: { code: courseCode, title: 'Persistence Test Course', departmentId: deptId, level: 'Year 1 (Freshman)', semester: 'Fall 2026', credits: 3, creditHours: 3, instructor: 'Dr. Test', instructorEmail: 'test@test.edu', description: 'Persistence test' },
  });
  const COURSE_ID = cr.json?.course?.id;
  log('course: create via API', cr.status === 201 && !!COURSE_ID, `id=${COURSE_ID}`);

  const courseInDb = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('course: exists in DB after create', !!courseInDb, `title=${courseInDb?.title}`);

  const courseApiR = await req('GET', `/api/courses?q=${encodeURIComponent(courseCode)}`, { cookie: ADMIN_COOKIE });
  const courseInApi = (Array.isArray(courseApiR.json) ? courseApiR.json : courseApiR.json?.courses || []).find((c: any) => c.id === COURSE_ID);
  log('course: visible via API after create', !!courseInApi, `code=${courseInApi?.code}`);

  const ur = await req('PATCH', `/api/courses/${COURSE_ID}`, { cookie: ADMIN_COOKIE, body: { title: 'Updated Persistence Course' } });
  log('course: update via API', ur.status === 200, `status=${ur.status}`);

  const updatedCourse = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('course: DB reflects update', updatedCourse?.title === 'Updated Persistence Course', `title=${updatedCourse?.title}`);

  const updatedApiR = await req('GET', `/api/courses?q=${encodeURIComponent('Updated Persistence Course')}`, { cookie: ADMIN_COOKIE });
  const updatedInApi = (Array.isArray(updatedApiR.json) ? updatedApiR.json : updatedApiR.json?.courses || []).find((c: any) => c.id === COURSE_ID);
  log('course: visible via API after update', !!updatedInApi, `title=${updatedInApi?.title}`);

  const dr = await req('DELETE', `/api/courses/${COURSE_ID}`, { cookie: ADMIN_COOKIE });
  log('course: delete via API', dr.status === 200, `status=${dr.status}`);

  const deletedCourse = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('course: archived in DB after delete', deletedCourse?.archivedAt !== null, `archivedAt=${deletedCourse?.archivedAt}`);

  const delApiR = await req('GET', `/api/courses?q=${encodeURIComponent(courseCode)}`, { cookie: ADMIN_COOKIE });
  const delInApi = (Array.isArray(delApiR.json) ? delApiR.json : delApiR.json?.courses || []).find((c: any) => c.id === COURSE_ID);
  log('course: gone from API after delete', !delInApi, `found=${!!delInApi}`);

  // ================== ANNOUNCEMENT ==================
  const ancR = await req('POST', '/api/announcements', {
    cookie: ADMIN_COOKIE,
    body: { scope: 'university', title: 'Persistence Announcement', content: 'Test', authorName: 'Admin', authorRole: 'super_admin', date: new Date().toISOString().split('T')[0], isPinned: true, priority: 'normal' },
  });
  const ANC_ID = ancR.json?.announcement?.id;
  log('announcement: create', ancR.status === 201 && !!ANC_ID, `id=${ANC_ID}`);

  const ancInDb = await prisma.announcement.findUnique({ where: { id: ANC_ID } });
  log('announcement: exists in DB', !!ancInDb, `title=${ancInDb?.title}`);

  const delAncR = await req('DELETE', `/api/announcements/${ANC_ID}`, { cookie: ADMIN_COOKIE });
  log('announcement: delete', delAncR.status === 200, `status=${delAncR.status}`);

  const delAnc = await prisma.announcement.findUnique({ where: { id: ANC_ID } });
  log('announcement: gone from DB', delAnc === null, `row=${delAnc}`);

  // ================== EVENT ==================
  const evtR = await req('POST', '/api/events', {
    cookie: ADMIN_COOKIE,
    body: { title: 'Persistence Event', organizer: 'Admin', date: '2026-12-01', time: '10:00', location: 'Hall', description: 'Test', category: 'workshop', status: 'published', registeredStudents: [] },
  });
  const EVT_ID = evtR.json?.event?.id;
  log('event: create', evtR.status === 201 && !!EVT_ID, `id=${EVT_ID}`);

  const evtInDb = await prisma.campusEvent.findUnique({ where: { id: EVT_ID } });
  log('event: exists in DB', !!evtInDb, `title=${evtInDb?.title}`);

  const delEvtR = await req('DELETE', `/api/events/${EVT_ID}`, { cookie: ADMIN_COOKIE });
  log('event: delete', delEvtR.status === 200, `status=${delEvtR.status}`);

  const delEvt = await prisma.campusEvent.findUnique({ where: { id: EVT_ID } });
  log('event: gone from DB', delEvt === null, `row=${delEvt}`);

  // ================== ASSIGNMENT ==================
  const asgnR = await req('POST', '/api/assignments', {
    cookie: ADMIN_COOKIE,
    body: { courseId: COURSE_ID || 'course-eng011', courseCode: 'PERSIST', title: 'Persistence Assignment', description: 'Test', dueDate: '2026-12-31', totalPoints: 20, weightPercent: 10, status: 'todo', departmentId: deptId, level: 'Year 1 (Freshman)' },
  });
  const ASGN_ID = asgnR.json?.assignment?.id;
  log('assignment: create', asgnR.status === 201 && !!ASGN_ID, `id=${ASGN_ID}`);

  const asgnInDb = await prisma.assignment.findUnique({ where: { id: ASGN_ID } });
  log('assignment: exists in DB', !!asgnInDb, `title=${asgnInDb?.title}`);

  const delAsgnR = await req('DELETE', `/api/assignments/${ASGN_ID}`, { cookie: ADMIN_COOKIE });
  log('assignment: delete', delAsgnR.status === 200, `status=${delAsgnR.status}`);

  const delAsgn = await prisma.assignment.findUnique({ where: { id: ASGN_ID } });
  log('assignment: gone from DB', delAsgn === null, `row=${delAsgn}`);

  // ================== SCHEDULE ==================
  const schedR = await req('POST', '/api/schedules', {
    cookie: ADMIN_COOKIE,
    body: { courseId: COURSE_ID || 'course-eng011', courseCode: 'PERSIST', courseTitle: 'Persistence Schedule', instructor: 'Dr. Test', dayOfWeek: 'Monday', startTime: '09:00', endTime: '11:00', hall: 'Hall 1', type: 'lecture', departmentId: deptId, level: 'Year 1 (Freshman)' },
  });
  const SCHED_ID = schedR.json?.schedule?.id;
  log('schedule: create', schedR.status === 201 && !!SCHED_ID, `id=${SCHED_ID}`);

  const schedInDb = await prisma.scheduleItem.findUnique({ where: { id: SCHED_ID } });
  log('schedule: exists in DB', !!schedInDb, `courseName=${schedInDb?.courseName}`);

  const delSchedR = await req('DELETE', `/api/schedules/${SCHED_ID}`, { cookie: ADMIN_COOKIE });
  log('schedule: delete', delSchedR.status === 200, `status=${delSchedR.status}`);

  const delSched = await prisma.scheduleItem.findUnique({ where: { id: SCHED_ID } });
  log('schedule: gone from DB', delSched === null, `row=${delSched}`);

  // ================== EXAM ==================
  const examR = await req('POST', '/api/exams', {
    cookie: ADMIN_COOKIE,
    body: { courseId: 'course-eng011', courseCode: 'PERSIST', title: 'Persistence Exam', durationMinutes: 60, totalMarks: 100, difficulty: 'Medium', term: 'Quiz', departmentId: deptId, questions: [{ id: 'q1', question: 'Q1?', options: ['A', 'B'], correctIndex: 0 }] },
  });
  const EXAM_ID = examR.json?.exam?.id;
  log('exam: create', examR.status === 201 && !!EXAM_ID, `id=${EXAM_ID} status=${examR.status} detail=${JSON.stringify(examR.json).substring(0, 100)}`);

  const examInDb = await prisma.examQuiz.findUnique({ where: { id: EXAM_ID } });
  log('exam: exists in DB', !!examInDb, `title=${examInDb?.title}`);

  const delExamR = await req('DELETE', `/api/exams/${EXAM_ID}`, { cookie: ADMIN_COOKIE });
  log('exam: delete', delExamR.status === 200, `status=${delExamR.status}`);

  const delExam = await prisma.examQuiz.findUnique({ where: { id: EXAM_ID } });
  log('exam: gone from DB', delExam === null, `row=${delExam}`);

  // ================== HONOR BOARD ==================
  const honorR = await req('POST', '/api/honor-board', {
    cookie: ADMIN_COOKIE,
    body: { name: 'Persistence Student', studentId: `PERSIST-${RUN}`, email: 'persist@test.edu', departmentId: deptId, level: 'Year 1 (Freshman)', semester: 'Fall 2026', achievementTitle: 'Persistence Achievement', category: 'academic_excellence', description: 'Test', honoredDate: new Date().toISOString().split('T')[0], academicYear: '2026/2027', tags: ['persist'] },
  });
  const HONOR_ID = honorR.json?.entry?.id;
  log('honor: create', honorR.status === 201 && !!HONOR_ID, `id=${HONOR_ID}`);

  const honorInDb = await prisma.honorStudent.findUnique({ where: { id: HONOR_ID } });
  log('honor: exists in DB', !!honorInDb, `name=${honorInDb?.name}`);

  const delHonorR = await req('DELETE', `/api/honor-board/${HONOR_ID}`, { cookie: ADMIN_COOKIE });
  log('honor: delete', delHonorR.status === 200, `status=${delHonorR.status}`);

  const delHonor = await prisma.honorStudent.findUnique({ where: { id: HONOR_ID } });
  log('honor: gone from DB', delHonor === null, `row=${delHonor}`);

  // ================== RESOURCE ==================
  const pdfBytes = Buffer.from('%PDF-1.4\n%Persistence-' + RUN + '\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
  const b64 = pdfBytes.toString('base64');
  const resR = await req('POST', '/api/resources', {
    cookie: ADMIN_COOKIE,
    body: { title: 'Persistence Resource', description: 'Persistence test resource description', category: 'summary', courseId: COURSE_ID || 'course-eng011', courseCode: 'PERSIST', departmentId: deptId, fileType: 'pdf', fileName: `persist-${RUN}.pdf`, fileData: b64, tags: ['persist'] },
  });
  const RES_ID = resR.json?.resource?.id;
  log('resource: create', resR.status === 201 && !!RES_ID, `id=${RES_ID} status=${resR.status} detail=${JSON.stringify(resR.json).substring(0, 150)}`);

  const resInDb = await prisma.resource.findUnique({ where: { id: RES_ID } });
  log('resource: exists in DB', !!resInDb, `title=${resInDb?.title}`);

  const modR = await req('PATCH', `/api/resources/${RES_ID}/moderate`, { cookie: ADMIN_COOKIE, body: { action: 'approve' } });
  log('resource: moderate (approve)', modR.status === 200, `status=${modR.status}`);

  const modRes = await prisma.resource.findUnique({ where: { id: RES_ID } });
  log('resource: DB reflects moderation', modRes?.status === 'approved', `status=${modRes?.status}`);

  // ================== USER ROLE ==================
  const signupR = await req('POST', '/api/auth/signup', {
    body: { fullName: 'Persistence User', email: `persist.role.${RUN}@test.edu`, phoneNumber: '+201001234567', password: 'Password123!', passwordConfirm: 'Password123!', departmentId: deptId, level: 'Year 1 (Freshman)' },
  });
  const TEST_USER_ID = signupR.json?.user?.id;
  log('user: create for role test', signupR.status === 201 && !!TEST_USER_ID, `id=${TEST_USER_ID}`);

  const roleR = await req('POST', '/api/admin/update-role', { cookie: ADMIN_COOKIE, body: { targetUserId: TEST_USER_ID, newRole: 'moderator' } });
  log('user: role change to moderator', roleR.status === 200, `status=${roleR.status}`);

  const modUser = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
  log('user: DB reflects role change', modUser?.role === 'moderator', `role=${modUser?.role}`);

  // ================== SUMMARY ==================
  const failed = results.filter(x => !x.pass);
  console.log(`\n===== PERSISTENCE TEST: ${results.length - failed.length}/${results.length} PASSED =====`);
  if (failed.length) {
    console.log('FAILED:', failed.map(f => f.name).join(' | '));
    process.exit(1);
  }
  console.log('All persistence checks passed: create → DB verify → API verify → update → DB verify → API verify → delete → DB verify → API verify.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(1);
});
