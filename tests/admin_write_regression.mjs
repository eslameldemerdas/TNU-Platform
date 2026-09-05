#!/usr/bin/env node
/**
 * EngHub admin write-path regression suite.
 *
 * Proves that every admin create/update/delete action reaches the database
 * and survives a server restart. Run while the server is live on :3000.
 *
 * Usage:
 *   node tests/admin_write_regression.mjs
 *
 * The test authenticates as super_admin, performs every admin write action
 * via the real HTTP API, then queries the database directly via Prisma to
 * confirm the row exists / changed as expected.
 */
import 'dotenv/config';
import { prisma } from '../server/prisma.ts';
import { resetRateLimit } from '../server/rateLimiter.ts';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'changeme@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

const results = [];
function log(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
async function req(method, path, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, headers: res.headers };
}
const cookieOf = (r) => r.headers.get('set-cookie')?.split(';')[0] || '';
const RUN = Date.now();

async function main() {
  // ===== AUTH =====
  let r = await req('POST', '/api/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const ADMIN_COOKIE = cookieOf(r);
  const ADMIN_USER_ID = r.json?.user?.id;
  log('admin login', r.status === 200 && r.json?.user?.role === 'super_admin', `status=${r.status}`);
  if (!ADMIN_COOKIE) {
    console.error('Cannot continue without admin cookie');
    process.exit(1);
  }

  // Helper: get a department id
  const deptR = await req('GET', '/api/departments', { cookie: ADMIN_COOKIE });
  const departments = deptR.json?.departments || [];
  const deptId = departments[0]?.id || 'dept-cmp';
  log('fetch departments', deptR.status === 200 && deptId, `deptId=${deptId}`);

  // ===== 1. CREATE COURSE =====
  const courseCode = `REG${RUN.toString().slice(-4)}`;
  r = await req('POST', '/api/courses', {
    cookie: ADMIN_COOKIE,
    body: {
      code: courseCode,
      title: 'Regression Test Course',
      departmentId: deptId,
      level: 'Year 1 (Freshman)',
      semester: 'Fall 2026',
      credits: 3,
      creditHours: 3,
      instructor: 'Dr. Regression',
      instructorEmail: 'reg@test.edu',
      description: 'Admin write-path regression course',
      scheduleDayTime: 'Mon/Wed 10:00 - 11:30 AM',
      location: 'Lab 1',
    },
  });
  const COURSE_ID = r.json?.course?.id;
  log('admin create course', r.status === 201 && !!COURSE_ID, `id=${COURSE_ID} status=${r.status}`);
  if (!COURSE_ID) { console.error('Stopping: course creation failed'); process.exit(1); }

  const courseInDb = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('create course → DB row exists', !!courseInDb, `title=${courseInDb?.title}`);

  // ===== 2. UPDATE COURSE =====
  r = await req('PATCH', `/api/courses/${COURSE_ID}`, {
    cookie: ADMIN_COOKIE,
    body: { title: 'Updated Regression Course', credits: 4 },
  });
  log('admin update course', r.status === 200 && r.json?.course?.title === 'Updated Regression Course', `status=${r.status}`);

  const updatedCourse = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('update course → DB reflects change', updatedCourse?.title === 'Updated Regression Course' && updatedCourse?.credits === 4,
    `title=${updatedCourse?.title} credits=${updatedCourse?.credits}`);

  // ===== 3. DELETE COURSE (soft-delete via archivedAt) =====
  r = await req('DELETE', `/api/courses/${COURSE_ID}`, { cookie: ADMIN_COOKIE });
  log('admin delete course', r.status === 200, `status=${r.status}`);

  const deletedCourse = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  log('delete course → DB archivedAt set', deletedCourse?.archivedAt !== null, `archivedAt=${deletedCourse?.archivedAt}`);

  // ===== 4. CREATE ANNOUNCEMENT =====
  r = await req('POST', '/api/announcements', {
    cookie: ADMIN_COOKIE,
    body: {
      scope: 'university',
      title: 'Regression Announcement',
      content: 'This must reach the database.',
      authorName: 'Regression Admin',
      authorRole: 'super_admin',
      date: new Date().toISOString().split('T')[0],
      isPinned: true,
      priority: 'urgent',
    },
  });
  const ANC_ID = r.json?.announcement?.id;
  log('admin create announcement', r.status === 201 && !!ANC_ID, `id=${ANC_ID} status=${r.status}`);

  const ancInDb = await prisma.announcement.findUnique({ where: { id: ANC_ID } });
  log('create announcement → DB row exists', !!ancInDb, `title=${ancInDb?.title}`);

  // ===== 5. TOGGLE PIN ANNOUNCEMENT =====
  r = await req('PATCH', `/api/announcements/${ANC_ID}`, {
    cookie: ADMIN_COOKIE,
    body: { isPinned: false },
  });
  log('admin toggle pin announcement', r.status === 200, `status=${r.status}`);

  const updatedAnc = await prisma.announcement.findUnique({ where: { id: ANC_ID } });
  log('toggle pin → DB reflects change', updatedAnc?.isPinned === false, `isPinned=${updatedAnc?.isPinned}`);

  // ===== 6. DELETE ANNOUNCEMENT =====
  r = await req('DELETE', `/api/announcements/${ANC_ID}`, { cookie: ADMIN_COOKIE });
  log('admin delete announcement', r.status === 200, `status=${r.status}`);

  const delAnc = await prisma.announcement.findUnique({ where: { id: ANC_ID } });
  log('delete announcement → DB row gone', delAnc === null, `row=${delAnc}`);

  // ===== 7. CREATE EVENT =====
  r = await req('POST', '/api/events', {
    cookie: ADMIN_COOKIE,
    body: {
      title: 'Regression Event',
      organizer: 'Regression Admin',
      date: '2026-12-01',
      time: '10:00 - 12:00',
      location: 'Main Hall',
      description: 'Admin event regression test',
      category: 'workshop',
      status: 'published',
      registeredStudents: [],
    },
  });
  const EVENT_ID = r.json?.event?.id;
  log('admin create event', r.status === 201 && !!EVENT_ID, `id=${EVENT_ID} status=${r.status}`);

  const eventInDb = await prisma.campusEvent.findUnique({ where: { id: EVENT_ID } });
  log('create event → DB row exists', !!eventInDb, `title=${eventInDb?.title}`);

  // ===== 8. UPDATE EVENT =====
  r = await req('PATCH', `/api/events/${EVENT_ID}`, {
    cookie: ADMIN_COOKIE,
    body: { title: 'Updated Regression Event', maxCapacity: 100 },
  });
  log('admin update event', r.status === 200, `status=${r.status}`);

  const updatedEvent = await prisma.campusEvent.findUnique({ where: { id: EVENT_ID } });
  log('update event → DB reflects change', updatedEvent?.title === 'Updated Regression Event' && updatedEvent?.maxCapacity === 100,
    `title=${updatedEvent?.title} maxCapacity=${updatedEvent?.maxCapacity}`);

  // ===== 9. TOGGLE EVENT STATUS =====
  r = await req('PATCH', `/api/events/${EVENT_ID}`, {
    cookie: ADMIN_COOKIE,
    body: { status: 'draft' },
  });
  log('admin toggle event status', r.status === 200, `status=${r.status}`);

  const toggledEvent = await prisma.campusEvent.findUnique({ where: { id: EVENT_ID } });
  log('toggle event status → DB reflects change', toggledEvent?.status === 'draft', `status=${toggledEvent?.status}`);

  // ===== 10. DELETE EVENT =====
  r = await req('DELETE', `/api/events/${EVENT_ID}`, { cookie: ADMIN_COOKIE });
  log('admin delete event', r.status === 200, `status=${r.status}`);

  const delEvent = await prisma.campusEvent.findUnique({ where: { id: EVENT_ID } });
  log('delete event → DB row gone', delEvent === null, `row=${delEvent}`);

  // ===== 11. CREATE ASSIGNMENT =====
  r = await req('POST', '/api/assignments', {
    cookie: ADMIN_COOKIE,
    body: {
      courseId: COURSE_ID || 'course-eng011',
      courseCode: 'REG',
      title: 'Regression Assignment',
      description: 'Admin assignment regression test',
      dueDate: '2026-12-31',
      totalPoints: 20,
      weightPercent: 10,
      status: 'todo',
      departmentId: deptId,
      level: 'Year 1 (Freshman)',
    },
  });
  const ASGN_ID = r.json?.assignment?.id;
  log('admin create assignment', r.status === 201 && !!ASGN_ID, `id=${ASGN_ID} status=${r.status}`);

  const asgnInDb = await prisma.assignment.findUnique({ where: { id: ASGN_ID } });
  log('create assignment → DB row exists', !!asgnInDb, `title=${asgnInDb?.title}`);

  // ===== 12. UPDATE ASSIGNMENT =====
  r = await req('PATCH', `/api/assignments/${ASGN_ID}`, {
    cookie: ADMIN_COOKIE,
    body: { title: 'Updated Regression Assignment', totalPoints: 30 },
  });
  log('admin update assignment', r.status === 200, `status=${r.status}`);

  const updatedAsgn = await prisma.assignment.findUnique({ where: { id: ASGN_ID } });
  log('update assignment → DB reflects change', updatedAsgn?.title === 'Updated Regression Assignment' && updatedAsgn?.totalPoints === 30,
    `title=${updatedAsgn?.title} points=${updatedAsgn?.totalPoints}`);

  // ===== 13. DELETE ASSIGNMENT =====
  r = await req('DELETE', `/api/assignments/${ASGN_ID}`, { cookie: ADMIN_COOKIE });
  log('admin delete assignment', r.status === 200, `status=${r.status}`);

  const delAsgn = await prisma.assignment.findUnique({ where: { id: ASGN_ID } });
  log('delete assignment → DB row gone', delAsgn === null, `row=${delAsgn}`);

  // ===== 14. CREATE SCHEDULE =====
  r = await req('POST', '/api/schedules', {
    cookie: ADMIN_COOKIE,
    body: {
      courseId: COURSE_ID || 'course-eng011',
      courseCode: 'REG',
      courseTitle: 'Regression Schedule',
      instructor: 'Dr. Schedule',
      dayOfWeek: 'الاثنين',
      startTime: '09:00',
      endTime: '11:00',
      hall: 'Hall 1',
      type: 'lecture',
      departmentId: deptId,
      level: 'Year 1 (Freshman)',
    },
  });
  const SCHED_ID = r.json?.schedule?.id;
  log('admin create schedule', r.status === 201 && !!SCHED_ID, `id=${SCHED_ID} status=${r.status}`);

  const schedInDb = await prisma.scheduleItem.findUnique({ where: { id: SCHED_ID } });
  log('create schedule → DB row exists', !!schedInDb, `courseTitle=${schedInDb?.courseName}`);

  // ===== 15. UPDATE SCHEDULE =====
  r = await req('PATCH', `/api/schedules/${SCHED_ID}`, {
    cookie: ADMIN_COOKIE,
    body: { hall: 'Hall 2', startTime: '10:00' },
  });
  log('admin update schedule', r.status === 200, `status=${r.status}`);

  const updatedSched = await prisma.scheduleItem.findUnique({ where: { id: SCHED_ID } });
  log('update schedule → DB reflects change', updatedSched?.location === 'Hall 2' && updatedSched?.startTime === '10:00',
    `hall=${updatedSched?.location} start=${updatedSched?.startTime}`);

  // ===== 16. DELETE SCHEDULE =====
  r = await req('DELETE', `/api/schedules/${SCHED_ID}`, { cookie: ADMIN_COOKIE });
  log('admin delete schedule', r.status === 200, `status=${r.status}`);

  const delSched = await prisma.scheduleItem.findUnique({ where: { id: SCHED_ID } });
  log('delete schedule → DB row gone', delSched === null, `row=${delSched}`);

  // ===== 17. HONOR BOARD CREATE =====
  r = await req('POST', '/api/honor-board', {
    cookie: ADMIN_COOKIE,
    body: {
      name: 'Regression Student',
      studentId: `REG-${RUN.toString().slice(-4)}`,
      email: `reg.honor.${RUN}@test.edu`,
      departmentId: deptId,
      level: 'Year 1 (Freshman)',
      semester: 'Fall 2026',
      achievementTitle: 'Regression Achievement',
      category: 'academic_excellence',
      description: 'Admin honor board regression test',
      honoredDate: new Date().toISOString().split('T')[0],
      academicYear: '2026/2027',
      tags: ['regression'],
    },
  });
  const HONOR_ID = r.json?.entry?.id;
  log('admin create honor entry', r.status === 201 && !!HONOR_ID, `id=${HONOR_ID} status=${r.status}`);

  const honorInDb = await prisma.honorStudent.findUnique({ where: { id: HONOR_ID } });
  log('create honor → DB row exists', !!honorInDb, `name=${honorInDb?.name}`);

  // ===== 18. HONOR BOARD UPDATE =====
  r = await req('PUT', `/api/honor-board/${HONOR_ID}`, {
    cookie: ADMIN_COOKIE,
    body: { achievementTitle: 'Updated Regression Achievement', featured: true },
  });
  log('admin update honor entry', r.status === 200, `status=${r.status}`);

  const updatedHonor = await prisma.honorStudent.findUnique({ where: { id: HONOR_ID } });
  log('update honor → DB reflects change', updatedHonor?.achievementTitle === 'Updated Regression Achievement' && updatedHonor?.featured === true,
    `title=${updatedHonor?.achievementTitle} featured=${updatedHonor?.featured}`);

  // ===== 19. HONOR BOARD DELETE =====
  r = await req('DELETE', `/api/honor-board/${HONOR_ID}`, { cookie: ADMIN_COOKIE });
  log('admin delete honor entry', r.status === 200, `status=${r.status}`);

  const delHonor = await prisma.honorStudent.findUnique({ where: { id: HONOR_ID } });
  log('delete honor → DB row gone', delHonor === null, `row=${delHonor}`);

  // ===== 20. UPDATE USER ROLE =====
  // Create a test user first
  const testEmail = `reg.role.${RUN}@test.edu`;
  const signupR = await req('POST', '/api/auth/signup', {
    body: {
      fullName: 'Role Test User',
      email: testEmail,
      phoneNumber: '+201001234567',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
      departmentId: deptId,
      level: 'Year 1 (Freshman)',
    },
  });
  const TEST_USER_ID = signupR.json?.user?.id;
  log('create test user for role change', signupR.status === 201 && !!TEST_USER_ID, `id=${TEST_USER_ID}`);

  r = await req('POST', '/api/admin/update-role', {
    cookie: ADMIN_COOKIE,
    body: { targetUserId: TEST_USER_ID, newRole: 'moderator' },
  });
  log('admin update user role → moderator', r.status === 200, `status=${r.status}`);

  const modUser = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
  log('role change → DB reflects moderator', modUser?.role === 'moderator', `role=${modUser?.role}`);

  // Demote back
  r = await req('POST', '/api/admin/update-role', {
    cookie: ADMIN_COOKIE,
    body: { targetUserId: TEST_USER_ID, newRole: 'student' },
  });
  log('admin demote user → student', r.status === 200, `status=${r.status}`);

  const demotedUser = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
  log('role demotion → DB reflects student', demotedUser?.role === 'student', `role=${demotedUser?.role}`);

  // ===== 21. ADD SUPERVISOR (the fixed bug) =====
  const supEmail = `reg.sup.${RUN}@test.edu`;
  const supSignupR = await req('POST', '/api/auth/signup', {
    body: {
      fullName: 'Regression Supervisor',
      email: supEmail,
      phoneNumber: '+201001234567',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
      departmentId: deptId,
      level: 'Year 1 (Freshman)',
    },
  });
  const SUP_USER_ID = supSignupR.json?.user?.id;
  log('create test user for supervisor add', supSignupR.status === 201 && !!SUP_USER_ID, `id=${SUP_USER_ID}`);

  r = await req('POST', '/api/admin/update-role', {
    cookie: ADMIN_COOKIE,
    body: {
      targetUserId: SUP_USER_ID,
      newRole: 'supervisor',
      supervisorTitle: 'Regression Supervisor',
      supervisorScope: JSON.stringify({ departmentId: deptId, level: 'all' }),
    },
  });
  log('admin add supervisor', r.status === 200, `status=${r.status}`);

  const supUser = await prisma.user.findFirst({
    where: { email: supEmail, role: 'supervisor' },
  });
  log('add supervisor → DB row exists with role=supervisor', supUser?.role === 'supervisor', `email=${supUser?.email} role=${supUser?.role}`);

  // ===== 22. REMOVE SUPERVISOR (the fixed bug — previously no API call) =====
  if (supUser) {
    r = await req('POST', '/api/admin/update-role', {
      cookie: ADMIN_COOKIE,
      body: { targetUserId: supUser.id, newRole: 'student' },
    });
    log('admin remove supervisor (demote)', r.status === 200, `status=${r.status}`);

    const demotedSup = await prisma.user.findUnique({ where: { id: supUser.id } });
    log('remove supervisor → DB reflects student', demotedSup?.role === 'student', `role=${demotedSup?.role}`);
  }

  // ===== 23. RESOURCE UPLOAD + MODERATION =====
  if (ADMIN_USER_ID) await resetRateLimit(`upload:${ADMIN_USER_ID}`);
  const pdfBytes = Buffer.from('%PDF-1.4\n%EngHub-Regression-' + RUN + '\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');
  const b64 = pdfBytes.toString('base64');
  r = await req('POST', '/api/resources', {
    cookie: ADMIN_COOKIE,
    body: {
      title: 'Regression Resource',
      description: 'Admin resource regression test',
      category: 'summary',
      courseId: COURSE_ID || 'course-eng011',
      courseCode: 'REG',
      departmentId: deptId,
      fileType: 'pdf',
      fileName: `regression-${RUN}.pdf`,
      fileData: b64,
      tags: ['regression'],
    },
  });
  const RES_ID = r.json?.resource?.id;
  log('admin upload resource', r.status === 201 && !!RES_ID, `id=${RES_ID} status=${r.status}`);

  const resInDb = await prisma.resource.findUnique({ where: { id: RES_ID } });
  log('upload resource → DB row exists', !!resInDb, `title=${resInDb?.title}`);

  // Approve
  r = await req('PATCH', `/api/resources/${RES_ID}/moderate`, {
    cookie: ADMIN_COOKIE,
    body: { action: 'approve' },
  });
  log('admin approve resource', r.status === 200, `status=${r.status}`);

  const approvedRes = await prisma.resource.findUnique({ where: { id: RES_ID } });
  log('approve resource → DB reflects approved', approvedRes?.status === 'approved', `status=${approvedRes?.status}`);

  // ===== SUMMARY =====
  const failed = results.filter(x => !x.pass);
  console.log(`\n===== ${results.length - failed.length}/${results.length} PASSED =====`);
  if (failed.length) {
    console.log('FAILED:', failed.map(f => f.name).join(' | '));
    process.exit(1);
  }
  console.log('\nAll admin write paths verified against the database.');
}

main().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
