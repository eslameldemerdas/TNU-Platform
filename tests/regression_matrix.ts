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

const cookieOf = (r: { headers: Headers }) => r.headers?.get('set-cookie')?.split(';')[0] || '';
const RUN = Date.now();

async function main() {
  console.log('=== FULL REGRESSION MATRIX ===\n');

  const loginR = await req('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const ADMIN_COOKIE = cookieOf(loginR);
  log('admin login', loginR.status === 200, `status=${loginR.status}`);
  if (!ADMIN_COOKIE) { console.error('Cannot continue without admin cookie'); process.exit(1); }

  const deptR = await req('GET', '/api/departments', { cookie: ADMIN_COOKIE });
  const deptId = deptR.json?.departments?.[0]?.id || 'dept-cmp';

  // ================== COURSES ==================
  console.log('\n--- COURSES ---');
  const courseCode = `REG${RUN.toString().slice(-4)}`;
  const cr = await req('POST', '/api/courses', {
    cookie: ADMIN_COOKIE,
    body: { code: courseCode, title: 'Regression Test Course', departmentId: deptId, level: 'Year 1 (Freshman)', semester: 'Fall 2026', credits: 3, creditHours: 3, instructor: 'Dr. Test', instructorEmail: 'test@test.edu', description: 'Regression test course for persistence' },
  });
  const COURSE_ID = cr.json?.course?.id;
  log('courses: create', cr.status === 201 && !!COURSE_ID, `id=${COURSE_ID}`);

  const courseInDb = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('courses: in DB', !!courseInDb, `title=${courseInDb?.title}`);

  const courseApiR = await req('GET', `/api/courses?q=${encodeURIComponent(courseCode)}`, { cookie: ADMIN_COOKIE });
  const courseInApi = (Array.isArray(courseApiR.json) ? courseApiR.json : courseApiR.json?.courses || []).find((c: any) => c.id === COURSE_ID);
  log('courses: read via API', !!courseInApi, `code=${courseInApi?.code}`);

  const ur = await req('PATCH', `/api/courses/${COURSE_ID}`, { cookie: ADMIN_COOKIE, body: { title: 'Updated Regression Course' } });
  log('courses: update', ur.status === 200, `status=${ur.status}`);

  const updatedCourse = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('courses: DB reflects update', updatedCourse?.title === 'Updated Regression Course', `title=${updatedCourse?.title}`);

  const updatedApiR = await req('GET', `/api/courses?q=${encodeURIComponent('Updated Regression Course')}`, { cookie: ADMIN_COOKIE });
  const updatedInApi = (Array.isArray(updatedApiR.json) ? updatedApiR.json : updatedApiR.json?.courses || []).find((c: any) => c.id === COURSE_ID);
  log('courses: visible via API after update', !!updatedInApi, `title=${updatedInApi?.title}`);

  const dr = await req('DELETE', `/api/courses/${COURSE_ID}`, { cookie: ADMIN_COOKIE });
  log('courses: delete', dr.status === 200, `status=${dr.status}`);

  const deletedCourse = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('courses: archived in DB', deletedCourse?.archivedAt !== null, `archivedAt=${deletedCourse?.archivedAt}`);

  const delApiR = await req('GET', `/api/courses?q=${encodeURIComponent(courseCode)}`, { cookie: ADMIN_COOKIE });
  const delInApi = (Array.isArray(delApiR.json) ? delApiR.json : delApiR.json?.courses || []).find((c: any) => c.id === COURSE_ID);
  log('courses: gone from API', !delInApi, `found=${!!delInApi}`);

  // ================== FILES/RESOURCES ==================
  console.log('\n--- FILES/RESOURCES ---');
  const signupR = await req('POST', '/api/auth/signup', {
    body: { fullName: 'Regression User', email: `reg.user.${RUN}@test.edu`, phoneNumber: '+201001234567', password: 'Password123!', passwordConfirm: 'Password123!', departmentId: deptId, level: 'Year 1 (Freshman)' },
  });
  const TEST_USER_ID = signupR.json?.user?.id;
  log('files: create user for resource test', signupR.status === 201 && !!TEST_USER_ID, `id=${TEST_USER_ID}`);

  const userLoginR = await req('POST', '/api/auth/login', { body: { email: `reg.user.${RUN}@test.edu`, password: 'Password123!' } });
  const USER_COOKIE = cookieOf(userLoginR);

  const pdfBytes = Buffer.from('%PDF-1.4\n%Regression\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
  const b64 = pdfBytes.toString('base64');
  const resR = await req('POST', '/api/resources', {
    cookie: USER_COOKIE,
    body: { title: 'Regression Resource', description: 'Regression test resource for persistence testing purposes', category: 'summary', courseId: COURSE_ID || 'course-eng011', courseCode: 'REG', departmentId: deptId, fileType: 'pdf', fileName: `reg-${RUN}.pdf`, fileData: b64 },
  });
  const RES_ID = resR.json?.resource?.id;
  log('files: create', resR.status === 201 && !!RES_ID, `id=${RES_ID}`);

  const resInDb = await prisma.resource.findUnique({ where: { id: RES_ID } });
  log('files: in DB', !!resInDb, `title=${resInDb?.title}`);

  const modR = await req('PATCH', `/api/resources/${RES_ID}/moderate`, { cookie: ADMIN_COOKIE, body: { action: 'approve' } });
  log('files: update (moderate)', modR.status === 200, `status=${modR.status}`);

  const modRes = await prisma.resource.findUnique({ where: { id: RES_ID } });
  log('files: DB reflects moderation', modRes?.status === 'approved', `status=${modRes?.status}`);

  const resApiR = await req('GET', `/api/resources?limit=100`, { cookie: USER_COOKIE });
  const resList = (Array.isArray(resApiR.json) ? resApiR.json : resApiR.json?.resources || []);
  const resInApi = resList.find((r: any) => r.id === RES_ID);
  log('files: read via API', !!resInApi, `title=${resInApi?.title}`);

  // Note: Resource hard-delete endpoint does not exist; moderation is the supported update path.

  // ================== ANNOUNCEMENTS ==================
  console.log('\n--- ANNOUNCEMENTS ---');
  const ancR = await req('POST', '/api/announcements', {
    cookie: ADMIN_COOKIE,
    body: { scope: 'university', title: 'Regression Announcement', content: 'Test announcement content', authorName: 'Admin', authorRole: 'super_admin', date: new Date().toISOString().split('T')[0], isPinned: true, priority: 'normal' },
  });
  const ANC_ID = ancR.json?.announcement?.id;
  log('announcements: create', ancR.status === 201 && !!ANC_ID, `id=${ANC_ID}`);

  const ancInDb = await prisma.announcement.findUnique({ where: { id: ANC_ID } });
  log('announcements: in DB', !!ancInDb, `title=${ancInDb?.title}`);

  const ancApiR = await req('GET', '/api/announcements', { cookie: ADMIN_COOKIE });
  const ancInApi = ancApiR.json?.announcements?.find((a: any) => a.id === ANC_ID);
  log('announcements: read via API', !!ancInApi, `title=${ancInApi?.title}`);

  const upAncR = await req('PATCH', `/api/announcements/${ANC_ID}`, { cookie: ADMIN_COOKIE, body: { title: 'Updated Announcement' } });
  log('announcements: update', upAncR.status === 200, `status=${upAncR.status}`);

  const delAncR = await req('DELETE', `/api/announcements/${ANC_ID}`, { cookie: ADMIN_COOKIE });
  log('announcements: delete', delAncR.status === 200, `status=${delAncR.status}`);

  const delAnc = await prisma.announcement.findUnique({ where: { id: ANC_ID } });
  log('announcements: gone from DB', delAnc === null, `row=${delAnc}`);

  // ================== EVENTS ==================
  console.log('\n--- EVENTS ---');
  const evtR = await req('POST', '/api/events', {
    cookie: ADMIN_COOKIE,
    body: { title: 'Regression Event', organizer: 'Admin', date: '2026-12-01', time: '10:00', location: 'Hall', description: 'Test event description', category: 'workshop', status: 'published', registeredStudents: [] },
  });
  const EVT_ID = evtR.json?.event?.id;
  log('events: create', evtR.status === 201 && !!EVT_ID, `id=${EVT_ID}`);

  const evtInDb = await prisma.campusEvent.findUnique({ where: { id: EVT_ID } });
  log('events: in DB', !!evtInDb, `title=${evtInDb?.title}`);

  const evtApiR = await req('GET', '/api/events', { cookie: ADMIN_COOKIE });
  const evtInApi = evtApiR.json?.events?.find((e: any) => e.id === EVT_ID);
  log('events: read via API', !!evtInApi, `title=${evtInApi?.title}`);

  const upEvtR = await req('PATCH', `/api/events/${EVT_ID}`, { cookie: ADMIN_COOKIE, body: { title: 'Updated Event' } });
  log('events: update', upEvtR.status === 200, `status=${upEvtR.status}`);

  const delEvtR = await req('DELETE', `/api/events/${EVT_ID}`, { cookie: ADMIN_COOKIE });
  log('events: delete', delEvtR.status === 200, `status=${delEvtR.status}`);

  const delEvt = await prisma.campusEvent.findUnique({ where: { id: EVT_ID } });
  log('events: gone from DB', delEvt === null, `row=${delEvt}`);

  // ================== ASSIGNMENTS ==================
  console.log('\n--- ASSIGNMENTS ---');
  const asgnR = await req('POST', '/api/assignments', {
    cookie: ADMIN_COOKIE,
    body: { courseId: COURSE_ID || 'course-eng011', courseCode: 'REG', title: 'Regression Assignment', description: 'Test assignment description', dueDate: '2026-12-31', totalPoints: 20, weightPercent: 10, status: 'todo', departmentId: deptId, level: 'Year 1 (Freshman)' },
  });
  const ASGN_ID = asgnR.json?.assignment?.id;
  log('assignments: create', asgnR.status === 201 && !!ASGN_ID, `id=${ASGN_ID}`);

  const asgnInDb = await prisma.assignment.findUnique({ where: { id: ASGN_ID } });
  log('assignments: in DB', !!asgnInDb, `title=${asgnInDb?.title}`);

  const asgnApiR = await req('GET', '/api/assignments', { cookie: ADMIN_COOKIE });
  const asgnInApi = asgnApiR.json?.assignments?.find((a: any) => a.id === ASGN_ID);
  log('assignments: read via API', !!asgnInApi, `title=${asgnInApi?.title}`);

  const upAsgnR = await req('PATCH', `/api/assignments/${ASGN_ID}`, { cookie: ADMIN_COOKIE, body: { title: 'Updated Assignment' } });
  log('assignments: update', upAsgnR.status === 200, `status=${upAsgnR.status}`);

  const delAsgnR = await req('DELETE', `/api/assignments/${ASGN_ID}`, { cookie: ADMIN_COOKIE });
  log('assignments: delete', delAsgnR.status === 200, `status=${delAsgnR.status}`);

  const delAsgn = await prisma.assignment.findUnique({ where: { id: ASGN_ID } });
  log('assignments: gone from DB', delAsgn === null, `row=${delAsgn}`);

  // ================== SCHEDULE ==================
  console.log('\n--- SCHEDULE ---');
  const schedR = await req('POST', '/api/schedules', {
    cookie: ADMIN_COOKIE,
    body: { courseId: COURSE_ID || 'course-eng011', courseCode: 'REG', courseTitle: 'Regression Schedule', instructor: 'Dr. Test', dayOfWeek: 'Monday', startTime: '09:00', endTime: '11:00', hall: 'Hall 1', type: 'lecture', departmentId: deptId, level: 'Year 1 (Freshman)' },
  });
  const SCHED_ID = schedR.json?.schedule?.id;
  log('schedule: create', schedR.status === 201 && !!SCHED_ID, `id=${SCHED_ID}`);

  const schedInDb = await prisma.scheduleItem.findUnique({ where: { id: SCHED_ID } });
  log('schedule: in DB', !!schedInDb, `courseName=${schedInDb?.courseName}`);

  const schedApiR = await req('GET', '/api/schedules', { cookie: ADMIN_COOKIE });
  const schedInApi = schedApiR.json?.schedules?.find((s: any) => s.id === SCHED_ID);
  log('schedule: read via API', !!schedInApi, `title=${schedInApi?.title}`);

  const upSchedR = await req('PATCH', `/api/schedules/${SCHED_ID}`, { cookie: ADMIN_COOKIE, body: { hall: 'Hall 2' } });
  log('schedule: update', upSchedR.status === 200, `status=${upSchedR.status}`);

  const delSchedR = await req('DELETE', `/api/schedules/${SCHED_ID}`, { cookie: ADMIN_COOKIE });
  log('schedule: delete', delSchedR.status === 200, `status=${delSchedR.status}`);

  const delSched = await prisma.scheduleItem.findUnique({ where: { id: SCHED_ID } });
  log('schedule: gone from DB', delSched === null, `row=${delSched}`);

  // ================== EXAMS ==================
  console.log('\n--- EXAMS ---');
  const examR = await req('POST', '/api/exams', {
    cookie: ADMIN_COOKIE,
    body: { courseId: COURSE_ID || 'course-eng011', courseCode: 'REG', title: 'Regression Exam', durationMinutes: 60, totalMarks: 100, difficulty: 'Medium', term: 'Quiz', departmentId: deptId, questions: [{ id: 'q1', question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctIndex: 0 }] },
  });
  const EXAM_ID = examR.json?.exam?.id;
  log('exams: create', examR.status === 201 && !!EXAM_ID, `id=${EXAM_ID}`);

  const examInDb = await prisma.examQuiz.findUnique({ where: { id: EXAM_ID } });
  log('exams: in DB', !!examInDb, `title=${examInDb?.title}`);

  const examApiR = await req('GET', '/api/exams', { cookie: ADMIN_COOKIE });
  const examInApi = examApiR.json?.exams?.find((e: any) => e.id === EXAM_ID);
  log('exams: read via API', !!examInApi, `title=${examInApi?.title}`);

  const upExamR = await req('PATCH', `/api/exams/${EXAM_ID}`, { cookie: ADMIN_COOKIE, body: { title: 'Updated Exam' } });
  log('exams: update', upExamR.status === 200, `status=${upExamR.status}`);

  const delExamR = await req('DELETE', `/api/exams/${EXAM_ID}`, { cookie: ADMIN_COOKIE });
  log('exams: delete', delExamR.status === 200, `status=${delExamR.status}`);

  const delExam = await prisma.examQuiz.findUnique({ where: { id: EXAM_ID } });
  log('exams: gone from DB', delExam === null, `row=${delExam}`);

  // ================== COMMUNITY/DISCUSSIONS ==================
  console.log('\n--- COMMUNITY/DISCUSSIONS ---');
  const postR = await req('POST', '/api/posts', {
    cookie: USER_COOKIE,
    body: { title: 'Regression Post', content: 'Test content for regression testing purposes', courseId: COURSE_ID || 'course-eng011', courseCode: 'REG', departmentId: deptId, postType: 'question' },
  });
  const POST_ID = postR.json?.post?.id;
  log('discussions: create', postR.status === 201 && !!POST_ID, `id=${POST_ID}`);

  const postInDb = await prisma.discussionThread.findUnique({ where: { id: POST_ID } });
  log('discussions: in DB', !!postInDb, `title=${postInDb?.title}`);

  const postApiR = await req('GET', '/api/posts', { cookie: USER_COOKIE });
  const postInApi = postApiR.json?.posts?.find((p: any) => p.id === POST_ID);
  log('discussions: read via API', !!postInApi, `title=${postInApi?.title}`);

  // Note: Discussion post PATCH/DELETE endpoints are not implemented in current API.
  // Only create, read, upvote, comment, and solve are available.

  // ================== NOTIFICATIONS ==================
  console.log('\n--- NOTIFICATIONS ---');
  const notifR = await req('GET', '/api/notifications', { cookie: USER_COOKIE });
  log('notifications: read via API', notifR.status === 200, `count=${notifR.json?.notifications?.length || 0}`);

  // ================== ADMIN USERS ==================
  console.log('\n--- ADMIN USERS ---');
  const usersR = await req('GET', '/api/admin/users', { cookie: ADMIN_COOKIE });
  log('admin users: read via API', usersR.status === 200, `total=${usersR.json?.total}`);

  const roleR = await req('POST', '/api/admin/update-role', { cookie: ADMIN_COOKIE, body: { targetUserId: TEST_USER_ID, newRole: 'moderator' } });
  log('admin users: update role', roleR.status === 200, `status=${roleR.status}`);

  const modUser = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
  log('admin users: DB reflects role', modUser?.role === 'moderator', `role=${modUser?.role}`);

  // Reset role back to student
  await prisma.user.update({ where: { id: TEST_USER_ID }, data: { role: 'student' } });

  // ================== SUMMARY ==================
  const failed = results.filter(x => !x.pass);
  console.log(`\n===== REGRESSION MATRIX: ${results.length - failed.length}/${results.length} PASSED =====`);
  if (failed.length) {
    console.log('FAILED:', failed.map(f => f.name).join(' | '));
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(1);
});
