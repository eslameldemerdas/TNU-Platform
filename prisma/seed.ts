import "dotenv/config";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function seed() {
  console.log("[Seed] Starting database seed...");

  await prisma.$connect();
  console.log("[Seed] Connected to PostgreSQL");

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0 && process.env.SEED_FORCE !== "true") {
    console.log(
      `[Seed] Database already has ${existingUsers} users. Skipping seed. Set SEED_FORCE=true to re-seed.`,
    );
    await prisma.$disconnect();
    return;
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "eldmrdasheslam1@gmail.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "FATAL: ADMIN_PASSWORD environment variable is required to seed the administrative account.",
    );
  }
  const adminHash = bcrypt.hashSync(adminPassword, bcrypt.genSaltSync(10));

  const moderatorHash = bcrypt.hashSync(
    crypto.randomBytes(16).toString("hex"),
    bcrypt.genSaltSync(10),
  );
  const deptAdminHash = bcrypt.hashSync(
    crypto.randomBytes(16).toString("hex"),
    bcrypt.genSaltSync(10),
  );
  const supCmpAllHash = bcrypt.hashSync(
    crypto.randomBytes(16).toString("hex"),
    bcrypt.genSaltSync(10),
  );
  const supCmpYr1Hash = bcrypt.hashSync(
    crypto.randomBytes(16).toString("hex"),
    bcrypt.genSaltSync(10),
  );
  const supMtrAllHash = bcrypt.hashSync(
    crypto.randomBytes(16).toString("hex"),
    bcrypt.genSaltSync(10),
  );
  const studentAlexHash = bcrypt.hashSync(
    crypto.randomBytes(16).toString("hex"),
    bcrypt.genSaltSync(10),
  );

  const univ = await prisma.university.upsert({
    where: { id: "univ-tnu" },
    update: {},
    create: {
      id: "univ-tnu",
      name: "جامعة طنطا الأهلية - Tanta National University",
      code: "TNU",
      domain: "tnu.edu.eg",
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { id: "fac-eng-01" },
    update: {},
    create: {
      id: "fac-eng-01",
      name: "كلية الهندسة - Faculty of Engineering",
      code: "ENG",
      universityId: univ.id,
    },
  });

  const deptCmp = await prisma.department.upsert({
    where: { id: "dept-cmp" },
    update: {},
    create: {
      id: "dept-cmp",
      name: "هندسة الحاسبات والذكاء الاصطناعي (Computer Engineering)",
      code: "CMP",
      facultyId: faculty.id,
      universityId: univ.id,
      description:
        "هندسة البرمجيات، النظم المدمجة، الذكاء الاصطناعي، شبكات الحاسب، ومعمارية الحاسبات.",
      iconName: "Cpu",
      color: "from-blue-600 to-indigo-500",
    },
  });

  const deptMtr = await prisma.department.upsert({
    where: { id: "dept-mtr" },
    update: {},
    create: {
      id: "dept-mtr",
      name: "هندسة الميكاترونكس والروبوتات (Mechatronics Engineering)",
      code: "MTR",
      facultyId: faculty.id,
      universityId: univ.id,
      description:
        "تكامل النظم الميكانيكية والإلكترونية، الروبوتات، الأتمتة الصناعية، وأنظمة التحكم الحديثة.",
      iconName: "Bot",
      color: "from-amber-600 to-orange-500",
    },
  });

  const lvlY1 = await prisma.academicLevel.upsert({
    where: { id: "lvl-y1" },
    update: {},
    create: { id: "lvl-y1", name: "Year 1 (Freshman)", code: "Y1", universityId: univ.id },
  });

  const lvlY2 = await prisma.academicLevel.upsert({
    where: { id: "lvl-y2" },
    update: {},
    create: { id: "lvl-y2", name: "Year 2 (Sophomore)", code: "Y2", universityId: univ.id },
  });

  const semFall2026 = await prisma.semester.upsert({
    where: { id: "sem-fall-2026" },
    update: {},
    create: {
      id: "sem-fall-2026",
      name: "Fall 2026",
      academicLevelId: lvlY1.id,
      universityId: univ.id,
      startDate: new Date("2026-09-20"),
      endDate: new Date("2027-01-28"),
    },
  });

  const instructors = [
    {
      id: "inst-elshafei",
      name: "د. أحمد الشافعي",
      title: "دكتور",
      email: "a.elshafei@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-abdelrahman",
      name: "د. محمود عبد الرحمن",
      title: "دكتور",
      email: "m.abdelrahman@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-fouad",
      name: "د. سامح فؤاد",
      title: "دكتور",
      email: "s.fouad@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-metwally",
      name: "د. إبراهيم متولي",
      title: "دكتور",
      email: "i.metwally@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-hassan",
      name: "د. منى حسن",
      title: "دكتور",
      email: "m.hassan@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-khalil",
      name: "د. ريهام خليل",
      title: "دكتور",
      email: "r.khalil@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-elnaggar",
      name: "أ.د. عصام النجار",
      title: "أستاذ دكتور",
      email: "e.elnaggar@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-galal",
      name: "د. طارق جلال",
      title: "دكتور",
      email: "t.galal@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-elshennawy",
      name: "د. نهى الشناوي",
      title: "دكتور",
      email: "n.elshennawy@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-elkady",
      name: "د. سحر القاضي",
      title: "دكتور",
      email: "s.elkady@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-elawady",
      name: "د. محمد العوضي",
      title: "دكتور",
      email: "m.elawady@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-salama",
      name: "د. مروة سلامة",
      title: "دكتور",
      email: "m.salama@tnu.edu.eg",
      departmentId: deptCmp.id,
    },
    {
      id: "inst-sherif",
      name: "د. حسام الدين شريف",
      title: "دكتور",
      email: "h.sherif@tnu.edu.eg",
      departmentId: deptMtr.id,
    },
    {
      id: "inst-radwan",
      name: "د. علاء رضوان",
      title: "دكتور",
      email: "a.radwan@tnu.edu.eg",
      departmentId: deptMtr.id,
    },
  ];

  for (const inst of instructors) {
    await prisma.instructor.upsert({
      where: { id: inst.id },
      update: {},
      create: inst,
    });
  }

  const users = [
    {
      id: "usr-super-admin-01",
      email: adminEmail,
      passwordHash: adminHash,
      name: "Faculty Super Administrator",
      phone: process.env.ADMIN_PHONE || "+1 555-0100",
      studentId: "0000-FAC-SUPER",
      role: "super_admin" as Role,
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Faculty Administration",
      semester: "All Semesters",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bio: "Super Administrator with full authority over courses, files, moderation, and system analytics.",
      enrolledCourseIds: ["course-eng011", "course-aie101", "course-aie103", "course-aie111"],
    },
    {
      id: "usr-moderator-01",
      email: "moderator@tnu.edu.eg",
      passwordHash: moderatorHash,
      name: "Dr. Content Moderator",
      phone: "+1 555-0188",
      studentId: "0000-FAC-MOD",
      role: "moderator" as Role,
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Faculty Moderator",
      semester: "All Semesters",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bio: "Academic Content Moderator for study resources and lecture materials.",
      enrolledCourseIds: ["course-eng011"],
    },
    {
      id: "usr-samer-104",
      email: "samer.haddad@tnu.edu.eg",
      passwordHash: deptAdminHash,
      name: "Samer Haddad",
      phone: "+1 (555) 567-8901",
      studentId: "2022-ENG-7201",
      role: "department_admin" as Role,
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Year 4 (Senior)",
      semester: "Fall 2026",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bio: "Department Representative for Computer Engineering Students Union.",
      enrolledCourseIds: ["course-aie101", "course-aie103"],
    },
    {
      id: "usr-sup-cmp-all",
      email: "dr.ahmed.cmp@tnu.edu.eg",
      passwordHash: supCmpAllHash,
      name: "د. أحمد عبد الفتاح",
      phone: "+20 100 111 2222",
      studentId: "SUP-CMP-01",
      role: "supervisor" as Role,
      supervisorTitle: "أخصائي قسم هندسة الحاسب والذكاء الاصطناعي",
      supervisorScope: {
        departmentId: "dept-cmp",
        level: "all",
        canManageCourses: true,
        canUploadResources: true,
        canUploadCertificates: true,
        canManageAssignments: true,
        canModerateDiscussions: true,
        canPublishAnnouncements: true,
      },
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bio: "مشرف رئيسي متخصص في قسم هندسة الحاسبات.",
      enrolledCourseIds: [],
    },
    {
      id: "usr-sup-cmp-yr1",
      email: "eng.omar.cmp1@tnu.edu.eg",
      passwordHash: supCmpYr1Hash,
      name: "م. عمر الشريف",
      phone: "+20 100 222 3333",
      studentId: "SUP-CMP-Y1",
      role: "supervisor" as Role,
      supervisorTitle: "أخصائي السنة الأولى (Year 1) - قسم هندسة الحاسب",
      supervisorScope: {
        departmentId: "dept-cmp",
        level: "Year 1 (Freshman)",
        canManageCourses: true,
        canUploadResources: true,
        canUploadCertificates: true,
        canManageAssignments: true,
        canModerateDiscussions: true,
        canPublishAnnouncements: true,
      },
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bio: "مشرف متخصص للسنة الأولى بفرع هندسة الحاسبات.",
      enrolledCourseIds: [],
    },
    {
      id: "usr-sup-mtr-all",
      email: "eng.yara.mtr@tnu.edu.eg",
      passwordHash: supMtrAllHash,
      name: "م. يارا حسين",
      phone: "+20 100 333 4444",
      studentId: "SUP-MTR-01",
      role: "supervisor" as Role,
      supervisorTitle: "أخصائية قسم هندسة الميكاترونكس والروبوتات",
      supervisorScope: {
        departmentId: "dept-mtr",
        level: "all",
        canManageCourses: true,
        canUploadResources: true,
        canUploadCertificates: true,
        canManageAssignments: true,
        canModerateDiscussions: true,
        canPublishAnnouncements: true,
      },
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptMtr.id,
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      bio: "أخصائية قسم الميكاترونكس.",
      enrolledCourseIds: [],
    },
    {
      id: "usr-alex-101",
      email: "alex.dev@tnu.edu.eg",
      passwordHash: studentAlexHash,
      name: "Alex Vance",
      phone: "+1 (555) 234-5678",
      studentId: "2024-ENG-8912",
      role: "student" as Role,
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      bio: "Freshman Computer Engineering student focused on Embedded Systems and Algorithms.",
      enrolledCourseIds: ["course-eng011", "course-eng021", "course-eng041", "course-aie101"],
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }

  const courses = [
    {
      id: "course-eng011",
      code: "ENG 011",
      title: "الرياضيات الهندسية (1)",
      departmentId: deptCmp.id,
      levelId: lvlY1.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. أحمد الشافعي",
      instructorEmail: "a.elshafei@tnu.edu.eg",
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      description: "تفاضل وتكامل، تطبيقات هندسية.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-eng021",
      code: "ENG 021",
      title: "الميكانيكا الهندسية (1)",
      departmentId: deptCmp.id,
      levelId: lvlY1.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. محمود عبد الرحمن",
      instructorEmail: "m.abdelrahman@tnu.edu.eg",
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      description: "اتزان الأجسام، عزوم، مقاطع.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-eng041",
      code: "ENG 041",
      title: "الفيزياء الهندسية (1)",
      departmentId: deptCmp.id,
      levelId: lvlY1.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. سامح فؤاد",
      instructorEmail: "s.fouad@tnu.edu.eg",
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      description: "ميكانيكا كلاسيكية، موجات.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-eng031",
      code: "ENG 031",
      title: "الرسم الهندسي",
      departmentId: deptCmp.id,
      levelId: lvlY1.id,
      semesterId: semFall2026.id,
      credits: 2,
      instructor: "د. إبراهيم متولي",
      instructorEmail: "i.metwally@tnu.edu.eg",
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      description: "أساسيات الرسم الهندسي والتصميم.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-eng051",
      code: "ENG 051",
      title: "الكيمياء الهندسية",
      departmentId: deptCmp.id,
      levelId: lvlY1.id,
      semesterId: semFall2026.id,
      credits: 2,
      instructor: "د. منى حسن",
      instructorEmail: "m.hassan@tnu.edu.eg",
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      description: "مبادئ الكيمياء للتطبيقات الهندسية.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-hum011",
      code: "HUM 011",
      title: "اللغة الإنجليزية (1)",
      departmentId: deptCmp.id,
      levelId: lvlY1.id,
      semesterId: semFall2026.id,
      credits: 2,
      instructor: "د. ريهام خليل",
      instructorEmail: "r.khalil@tnu.edu.eg",
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      description: "مهارات اللغة الإنجليزية الأكاديمية.",
      category: "GENERAL",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-aie101",
      code: "AIE 101",
      title: "الدوائر الكهربية (1)",
      departmentId: deptCmp.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. خالد توفيق",
      instructorEmail: "k.tawfik@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "أساسيات الدوائر الكهربية.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-aie111",
      code: "AIE 111",
      title: "أسس البرمجة الهيكلية",
      departmentId: deptCmp.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. شريف عبد العظيم",
      instructorEmail: "s.abdelazim@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "برمجة بلغة C/C++.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-aie103",
      code: "AIE 103",
      title: "التصميم المنطقي الرقمي",
      departmentId: deptCmp.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. ياسر الشربيني",
      instructorEmail: "y.elsherbini@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "جبر بول، بوابات، Karnaugh.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-humx32",
      code: "HUM X32",
      title: "مهارات الاتصال والعرض",
      departmentId: deptCmp.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 2,
      instructor: "د. نرمين مصطفى",
      instructorEmail: "n.mostafa@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "مهارات العرض والتقديم.",
      category: "GENERAL",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-engx13",
      code: "ENG X13",
      title: "الرياضيات الهندسية (3)",
      departmentId: deptCmp.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. أحمد الشافعي",
      instructorEmail: "a.elshafei@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description:
        "المعادلات التفاضلية العادية من الرتبة الأولى والرتب الأعلى، تحويلات لابلاس واستخداماتها في حل المعادلات التفاضلية متسلسلات فورير.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-hum131",
      code: "HUM 131",
      title: "مقدمة إلى البرمجة وتكنولوجيا المعلومات",
      departmentId: deptCmp.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 2,
      instructor: "د. طارق محمود",
      instructorEmail: "t.mahmoud@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description:
        "أساسيات البرمجة، المفاهيم الأولية لتقنية المعلومات، خوارزميات التفكير المنطقي والهياكل البرمجية البسيطة.",
      category: "GENERAL",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-engx13-mtr",
      code: "ENG X13",
      title: "الرياضيات الهندسية (3)",
      departmentId: deptMtr.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. أحمد الشافعي",
      instructorEmail: "a.elshafei@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "معادلات تفاضلية، لابلاس.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-mpe121-mtr",
      code: "MPE 121",
      title: "هندسة حرارية",
      departmentId: deptMtr.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. طارق الخولي",
      instructorEmail: "t.elkholy@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "ديناميكا حرارية.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-pde111-mtr",
      code: "PDE 111",
      title: "مقاومة المواد",
      departmentId: deptMtr.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. محمود عبد الرحمن",
      instructorEmail: "m.abdelrahman@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "إجهادات وانفعالات.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-epe111-mtr",
      code: "EPE 111",
      title: "هندسة كهربية",
      departmentId: deptMtr.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 3,
      instructor: "د. خالد توفيق",
      instructorEmail: "k.tawfik@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "دوائر كهربية.",
      category: "CORE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-hum131-mtr",
      code: "HUM 131",
      title: "مقدمة البرمجة وتكنولوجيا المعلومات",
      departmentId: deptMtr.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 2,
      instructor: "د. شريف عبد العظيم",
      instructorEmail: "s.abdelazim@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "أساسيات البرمجة.",
      category: "GENERAL",
      universityId: univ.id,
      facultyId: faculty.id,
    },
    {
      id: "course-humxe1-mtr",
      code: "HUM XE1",
      title: "مقرر اختياري جامعة (1)",
      departmentId: deptMtr.id,
      levelId: lvlY2.id,
      semesterId: semFall2026.id,
      credits: 2,
      instructor: "د. رانيا سعيد",
      instructorEmail: "r.said@tnu.edu.eg",
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      description: "مقرر إنساني اختياري.",
      category: "ELECTIVE",
      universityId: univ.id,
      facultyId: faculty.id,
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {},
      create: course as any,
    });
  }

  const resources = [
    {
      id: "res-01",
      title: "ملخص شامل: المصفوفات وطرق حل المعادلات الخطية",
      description: "ملخص معتمد.",
      category: "lecture_notes",
      resourceType: "lecture",
      fileKey: "uploads/2026/courses/eng011/matrices-summary-v1.pdf",
      courseId: "course-eng011",
      courseCode: "ENG 011",
      courseTitle: "الرياضيات الهندسية (1)",
      departmentId: deptCmp.id,
      universityId: "univ-tnu",
      facultyId: "fac-eng-01",
      academicYear: "Year 1 (Freshman)",
      semester: "Fall 2026",
      fileType: "pdf",
      fileSize: "4.2 MB",
      fileSizeBytes: 4404019,
      fileName: "ENG011_Matrices_Complete_Summary.pdf",
      uploaderId: "usr-alex-101",
      uploaderName: "Alex Vance",
      uploaderRole: "student",
      uploaderDepartment: "هندسة الحاسب والذكاء الاصطناعي",
      uploadDate: "2026-10-02",
      downloadsCount: 48,
      viewCount: 156,
      rating: 4.9,
      ratingCount: 18,
      helpfulCount: 22,
      notHelpfulCount: 0,
      status: "approved",
      moderationStatus: "approved",
      verificationStatus: "verified",
      moderatedBy: "usr-moderator-01",
      moderatedByName: "Dr. Content Moderator",
      moderatedAt: "2026-10-02T11:00:00Z",
      version: 1,
      tags: ["Math", "Linear Algebra"],
      createdAt: "2026-10-02T10:30:00Z",
      updatedAt: "2026-10-02T11:00:00Z",
    },
    {
      id: "res-02",
      title: "شيت مسائل محلولة: اتزان الجسيمات والجمالونات",
      description: "حلول نموذجية.",
      category: "assignment",
      resourceType: "assignment",
      fileKey: "uploads/2026/courses/eng021/trusses-solved-v1.pdf",
      courseId: "course-eng021",
      courseCode: "ENG 021",
      courseTitle: "الميكانيكا الهندسية (1)",
      departmentId: deptCmp.id,
      universityId: "univ-tnu",
      facultyId: "fac-eng-01",
      academicYear: "Year 1 (Freshman)",
      semester: "Fall 2026",
      fileType: "pdf",
      fileSize: "6.8 MB",
      fileSizeBytes: 7130316,
      fileName: "ENG021_Trusses_Solved_Problems.pdf",
      uploaderId: "usr-alex-101",
      uploaderName: "Alex Vance",
      uploaderRole: "student",
      uploaderDepartment: "هندسة الحاسب والذكاء الاصطناعي",
      uploadDate: "2026-10-05",
      downloadsCount: 65,
      viewCount: 210,
      rating: 5.0,
      ratingCount: 24,
      helpfulCount: 31,
      notHelpfulCount: 1,
      status: "approved",
      moderationStatus: "approved",
      verificationStatus: "official",
      moderatedBy: "usr-moderator-01",
      moderatedByName: "Dr. Content Moderator",
      moderatedAt: "2026-10-05T15:00:00Z",
      version: 1,
      tags: ["Mechanics", "Statics"],
      createdAt: "2026-10-05T14:15:00Z",
      updatedAt: "2026-10-05T15:00:00Z",
    },
  ];

  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { id: resource.id },
      update: {},
      create: resource as any,
    });
  }

  const notifications = [
    {
      id: "notif-welcome-01",
      userId: "usr-alex-101",
      category: "system",
      type: "welcome",
      title: "مرحباً بك في منصة EngHub",
      titleAr: "مرحباً بك في منصة EngHub",
      message: "تم إعداد حسابك الأكاديمي بنجاح.",
      messageAr: "تم إعداد حسابك الأكاديمي بنجاح.",
      read: false,
      createdAt: new Date(),
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {},
      create: notif,
    });
  }

  const honorStudents = [
    {
      id: "honor-1",
      userId: "usr-alex-101",
      name: "م. سارة محمود إبراهيم",
      studentId: "20220412",
      email: "sarah.mahmoud@eng.tnu.edu.eg",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
      departmentId: "dept-cmp",
      departmentName: "هندسة الحاسبات والتحكم",
      level: "الفرقة الرابعة (Senior)",
      semester: "ربيع 2026",
      achievementTitle: "المركز الأول في هاكاثون الذكاء الاصطناعي الوطني (AI Egypt Challenge 2026)",
      category: "hackathon_competition",
      description: "ابتكار منظومة تشخيصية مبكرة لأمراض الشبكية باستخدام نماذج الرؤية الحاسوبية.",
      honoredDate: new Date("2026-05-15"),
      academicYear: "2025/2026",
      gpaOrMetric: "المركز الأول 🥇",
      badgeLabel: "بطل الهاكاثون الوطني",
      certificateUrl:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
      projectUrl: "https://github.com/sarah-eng/retina-ai-diagnostic",
      supervisorName: "أ.د. طارق الحديدي",
      featured: true,
      applauseCount: 142,
      tags: ["AI", "Computer Vision"],
      createdById: "usr-admin-01",
      createdByName: "Admin",
    },
    {
      id: "honor-2",
      userId: "usr-alex-101",
      name: "م. عمر ياسر عبد الرحمن",
      studentId: "20220188",
      email: "omar.yasser@eng.tnu.edu.eg",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      departmentId: "dept-mtr",
      departmentName: "هندسة الميكاترونكس والأوتوميشن",
      level: "الفرقة الرابعة (Senior)",
      semester: "ربيع 2026",
      achievementTitle: "المركز الأول في مسابقة الروبوتات البحرية (AUV RoboSub)",
      category: "robotics_ai",
      description: "قيادة فريق تصميم روبوت غواص ذاتي القيادة.",
      honoredDate: new Date("2026-04-22"),
      academicYear: "2025/2026",
      gpaOrMetric: "الميدالية الذهبية 🏆",
      badgeLabel: "قائد فريق الروبوتات",
      certificateUrl:
        "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=800&auto=format&fit=crop&q=80",
      projectUrl: "https://github.com/omar-mtr/auv-slam-navigation",
      supervisorName: "د. خالد عبد الفتاح",
      featured: true,
      applauseCount: 118,
      tags: ["Robotics", "ROS2"],
      createdById: "usr-admin-01",
      createdByName: "Admin",
    },
  ];

  for (const honor of honorStudents) {
    await prisma.honorStudent.upsert({
      where: { id: honor.id },
      update: {},
      create: honor as any,
    });
  }

  // ---- Schedules & Exam bank (from the canonical catalog data) ----
  const { INITIAL_SCHEDULE, INITIAL_EXAMS_QUIZZES } = await import("../src/data/mockData");

  const courseMeta = new Map(
    courses.map((c) => [c.id, { departmentId: c.departmentId, level: c.level, title: c.title }]),
  );

  for (const s of INITIAL_SCHEDULE) {
    const meta = courseMeta.get(s.courseId);
    if (!meta) continue;
    await prisma.scheduleItem.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        courseId: s.courseId,
        courseCode: s.courseCode,
        courseName: s.title || meta.title,
        departmentId: meta.departmentId,
        level: meta.level,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location,
        type: s.type,
        instructorName: s.instructor,
      } as any,
    });
  }

  for (const e of INITIAL_EXAMS_QUIZZES) {
    const meta = courseMeta.get(e.courseId);
    if (!meta) continue;
    await prisma.examQuiz.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        courseId: e.courseId,
        courseCode: e.courseCode,
        courseTitle: meta.title,
        departmentId: meta.departmentId,
        title: e.title,
        type: e.term || "Quiz",
        term: e.term || "Quiz",
        durationMinutes: e.durationMinutes ?? 60,
        totalMarks: (e as any).totalMarks ?? 100,
        difficulty: e.difficulty ?? "Medium",
        isPastExam: Boolean((e as any).isPastExam),
        questions: e.questions as any,
      } as any,
    });
  }

  console.log("[Seed] Database seeded successfully");
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("[Seed] Fatal error:", err);
  process.exit(1);
});
