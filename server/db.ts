import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Course, ScheduleItem, ExamQuiz } from '../src/types';
import { INITIAL_COURSES, INITIAL_SCHEDULE, INITIAL_EXAMS_QUIZZES } from '../src/data/mockData';

// ============================================================================
// TYPED DATA MODELS & ENUMS
// ============================================================================

export type Role = 'student' | 'moderator' | 'department_admin' | 'supervisor' | 'super_admin';
export type CourseCategory = 'CORE' | 'ELECTIVE' | 'GENERAL';

export interface StoredUniversity {
  id: string;
  name: string;
  code: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFaculty {
  id: string;
  name: string;
  code: string;
  universityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDepartment {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  universityId: string;
  description?: string;
  iconName?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAcademicLevel {
  id: string;
  name: string;
  code: string;
  universityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSemester {
  id: string;
  name: string;
  academicLevelId: string;
  universityId: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredInstructor {
  id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  departmentId: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  studentId: string;
  role: Role;
  supervisorTitle?: string;
  supervisorScope?: any;
  universityId: string;
  facultyId: string;
  departmentId: string;
  level: string;
  semester: string;
  avatar: string;
  bio: string;
  points?: number;
  badges?: any[];
  savedBookmarks?: string[];
  enrolledCourseIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface StoredStudentProfile {
  id: string;
  userId: string;
  universityId: string;
  facultyId: string;
  departmentId: string;
  levelId?: string;
  semesterId?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  semesterId: string;
  enrolledAt: string;
}

export type PointsLedgerType =
  | 'upload_approved'
  | 'answer_accepted'
  | 'helpful_comment'
  | 'moderation_removal'
  | 'bonus';

export interface StoredPointsLedger {
  id: string;
  userId: string;
  type: PointsLedgerType;
  points: number;
  referenceId?: string;
  reason?: string;
  createdAt: string;
}

export type ResourceCategoryType =
  | 'summary'
  | 'notes'
  | 'previous_exam'
  | 'cheat_sheet'
  | 'study_guide'
  | 'lab_material'
  | 'practice_material'
  | 'reference'
  | 'other'
  | 'lecture_notes'
  | 'lab_manual'
  | 'assignment'
  | 'important_questions'
  | 'reference_book';

export interface StoredResource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategoryType;
  resourceType: string;
  courseId: string;
  courseCode: string;
  courseTitle?: string;
  departmentId: string;
  academicYear: string;
  semester: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'zip' | 'code' | 'image';
  fileSize: string;
  fileSizeBytes: number;
  fileName: string;
  fileKey: string;
  fileData?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: Role;
  uploaderDepartment: string;
  uploadDate: string;
  downloadCount: number;
  viewCount: number;
  rating: number;
  ratingCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulVotedUsers: Map<string, 'helpful' | 'not_helpful'>;
  previewContent?: string;
  downloadUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed';
  moderationStatus: 'pending' | 'approved' | 'rejected';
  verificationStatus: 'official' | 'verified' | 'student_uploaded' | 'rejected';
  moderatedBy?: string;
  moderatedByName?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredModerationAction {
  id: string;
  moderatorId: string;
  targetType: 'resource' | 'comment' | 'post' | 'user';
  targetId: string;
  action: 'approve' | 'flag' | 'remove' | 'ban' | 'warn';
  reason: string;
  pointsReversalId?: string;
  createdAt: string;
}

export interface StoredPost {
  id: string;
  courseId: string;
  courseCode?: string;
  departmentId?: string;
  title: string;
  content: string;
  postType: string;
  authorId: string;
  authorName: string;
  authorDepartment: string;
  authorRole: string;
  authorAvatar?: string;
  createdAt: string;
  upvotes: number;
  upvotedUsers: Set<string>;
  replyCount: number;
  isSolved: boolean;
  isPinned?: boolean;
  views: number;
  tags: string[];
}

export interface StoredComment {
  id: string;
  targetId: string;
  authorId: string;
  authorName: string;
  authorDepartment: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  upvotes: number;
  upvotedUsers: Set<string>;
  isSolution: boolean;
}

export interface StoredNotification {
  id: string;
  userId: string;
  category: 'academic' | 'community' | 'study' | 'system' | 'gamification';
  type: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  read: boolean;
  createdAt: string;
  actionTab?: string;
  actionTargetId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// SIGNED DOWNLOAD TOKEN CRYPTO HELPERS (SERVER-VERIFIED)
// ============================================================================

const DOWNLOAD_HMAC_SECRET = process.env.DOWNLOAD_SECRET;
if (!DOWNLOAD_HMAC_SECRET) {
  throw new Error('[Security] DOWNLOAD_SECRET is not set. Download tokens cannot be issued.');
}

export function generateSignedDownloadToken(fileId: string, expiresInSeconds = 3600): { token: string; expiresAt: string } {
  const expiresTimestamp = Date.now() + expiresInSeconds * 1000;
  const payload = `${fileId}:${expiresTimestamp}`;
  const hmac = crypto.createHmac("sha256", DOWNLOAD_HMAC_SECRET).update(payload).digest("hex");
  const token = `${expiresTimestamp}.${hmac}`;
  return {
    token,
    expiresAt: new Date(expiresTimestamp).toISOString()
  };
}

export function verifySignedDownloadToken(fileId: string, token: string): boolean {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [expiresStr, providedSignature] = parts;
  const expiresTimestamp = parseInt(expiresStr, 10);
  if (isNaN(expiresTimestamp) || Date.now() > expiresTimestamp) {
    return false; // Expired signature
  }

  const payload = `${fileId}:${expiresTimestamp}`;
  const expectedSignature = crypto.createHmac("sha256", DOWNLOAD_HMAC_SECRET).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(providedSignature, "hex"), Buffer.from(expectedSignature, "hex"));
  } catch {
    return false;
  }
}

// ============================================================================
// DATABASE ENGINE
// ============================================================================

export class DatabaseEngine {
  // Relational Entity Stores
  public universities = new Map<string, StoredUniversity>();
  public faculties = new Map<string, StoredFaculty>();
  public departments = new Map<string, StoredDepartment>();
  public academicLevels = new Map<string, StoredAcademicLevel>();
  public semesters = new Map<string, StoredSemester>();
  public instructors = new Map<string, StoredInstructor>();
  public courses = new Map<string, Course & { archivedAt?: string | null; category?: CourseCategory }>();
  public enrollments = new Map<string, StoredEnrollment>();
  public users = new Map<string, StoredUser>();
  public studentProfiles = new Map<string, StoredStudentProfile>();
  public pointsLedger: StoredPointsLedger[] = [];
  public resources = new Map<string, StoredResource>();
  public moderationActions: StoredModerationAction[] = [];
  public schedules = new Map<string, ScheduleItem>();
  public exams = new Map<string, ExamQuiz>();
  public posts = new Map<string, StoredPost>();
  public comments = new Map<string, StoredComment[]>();
  public notifications = new Map<string, StoredNotification>();

  // Compatibility Accessors
  public get usersById(): Map<string, StoredUser> {
    return this.users;
  }
  public get coursesList(): Course[] {
    return Array.from(this.courses.values()).filter((c) => !c.archivedAt);
  }
  public get resourcesList(): StoredResource[] {
    return Array.from(this.resources.values());
  }
  public get schedulesList(): ScheduleItem[] {
    return Array.from(this.schedules.values());
  }
  public get examsList(): ExamQuiz[] {
    return Array.from(this.exams.values());
  }
  public get postsList(): StoredPost[] {
    return Array.from(this.posts.values());
  }
  public get notificationsList(): StoredNotification[] {
    return Array.from(this.notifications.values());
  }
  public get commentsByPostIndex(): Map<string, StoredComment[]> {
    return this.comments;
  }

  // Deterministic Indexes
  private usersByEmail = new Map<string, string>(); // email -> userId
  private coursesByCode = new Map<string, string>(); // code -> courseId
  private coursesByDept = new Map<string, Set<string>>();
  private resourcesByCourse = new Map<string, Set<string>>();
  private schedulesByCourse = new Map<string, Set<string>>();
  private enrollmentsByStudent = new Map<string, Set<string>>();
  private pointsLedgerByUser = new Map<string, StoredPointsLedger[]>();

  constructor() {
    this.seedRelationalData();
  }

  // --------------------------------------------------------------------------
  // HIERARCHY & SEED DATA INITIALIZATION
  // --------------------------------------------------------------------------
  private seedRelationalData() {
    const now = new Date().toISOString();

    // 1. University: Tanta National University (TNU)
    const univ: StoredUniversity = {
      id: 'univ-tnu',
      name: 'جامعة طنطا الأهلية - Tanta National University',
      code: 'TNU',
      domain: 'tnu.edu.eg',
      createdAt: now,
      updatedAt: now
    };
    this.universities.set(univ.id, univ);

    // 2. Faculty: Faculty of Engineering
    const faculty: StoredFaculty = {
      id: 'fac-eng-01',
      name: 'كلية الهندسة - Faculty of Engineering',
      code: 'ENG',
      universityId: univ.id,
      createdAt: now,
      updatedAt: now
    };
    this.faculties.set(faculty.id, faculty);

    // 3. Departments: Computer Engineering (CMP) & Mechatronics Engineering (MTR)
    const deptCmp: StoredDepartment = {
      id: 'dept-cmp',
      name: 'هندسة الحاسبات والذكاء الاصطناعي (Computer Engineering)',
      code: 'CMP',
      facultyId: faculty.id,
      universityId: univ.id,
      description: 'هندسة البرمجيات، النظم المدمجة، الذكاء الاصطناعي، شبكات الحاسب، ومعمارية الحاسبات.',
      iconName: 'Cpu',
      color: 'from-blue-600 to-indigo-500',
      createdAt: now,
      updatedAt: now
    };
    const deptMtr: StoredDepartment = {
      id: 'dept-mtr',
      name: 'هندسة الميكاترونكس والروبوتات (Mechatronics Engineering)',
      code: 'MTR',
      facultyId: faculty.id,
      universityId: univ.id,
      description: 'تكامل النظم الميكانيكية والإلكترونية، الروبوتات، الأتمتة الصناعية، وأنظمة التحكم الحديثة.',
      iconName: 'Bot',
      color: 'from-amber-600 to-orange-500',
      createdAt: now,
      updatedAt: now
    };
    this.departments.set(deptCmp.id, deptCmp);
    this.departments.set(deptMtr.id, deptMtr);

    // 4. Academic Levels
    const level1: StoredAcademicLevel = {
      id: 'lvl-y1',
      name: 'Year 1 (Freshman)',
      code: 'Y1',
      universityId: univ.id,
      createdAt: now,
      updatedAt: now
    };
    const level2: StoredAcademicLevel = {
      id: 'lvl-y2',
      name: 'Year 2 (Sophomore)',
      code: 'Y2',
      universityId: univ.id,
      createdAt: now,
      updatedAt: now
    };
    this.academicLevels.set(level1.id, level1);
    this.academicLevels.set(level2.id, level2);

    // 5. Semesters
    const semFall2026: StoredSemester = {
      id: 'sem-fall-2026',
      name: 'Fall 2026',
      academicLevelId: level1.id,
      universityId: univ.id,
      startDate: '2026-09-20T00:00:00.000Z',
      endDate: '2027-01-28T00:00:00.000Z',
      createdAt: now,
      updatedAt: now
    };
    const semSpring2026: StoredSemester = {
      id: 'sem-spring-2026',
      name: 'Spring 2026',
      academicLevelId: level1.id,
      universityId: univ.id,
      startDate: '2026-02-15T00:00:00.000Z',
      endDate: '2026-06-25T00:00:00.000Z',
      createdAt: now,
      updatedAt: now
    };
    this.semesters.set(semFall2026.id, semFall2026);
    this.semesters.set(semSpring2026.id, semSpring2026);

    // 6. Instructors (First-Class Entities)
    const instructorsList: StoredInstructor[] = [
      { id: 'inst-elshafei', name: 'د. أحمد الشافعي', title: 'دكتور', email: 'a.elshafei@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-abdelrahman', name: 'د. محمود عبد الرحمن', title: 'دكتور', email: 'm.abdelrahman@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-fouad', name: 'د. سامح فؤاد', title: 'دكتور', email: 's.fouad@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-metwally', name: 'د. إبراهيم متولي', title: 'دكتور', email: 'i.metwally@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-hassan', name: 'د. منى حسن', title: 'دكتور', email: 'm.hassan@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-khalil', name: 'د. ريهام خليل', title: 'دكتور', email: 'r.khalil@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-elnaggar', name: 'أ.د. عصام النجار', title: 'أستاذ دكتور', email: 'e.elnaggar@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-galal', name: 'د. طارق جلال', title: 'دكتور', email: 't.galal@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-elshennawy', name: 'د. نهى الشناوي', title: 'دكتور', email: 'n.elshennawy@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-elkady', name: 'د. سحر القاضي', title: 'دكتور', email: 's.elkady@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-elawady', name: 'د. محمد العوضي', title: 'دكتور', email: 'm.elawady@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-salama', name: 'د. مروة سلامة', title: 'دكتور', email: 'm.salama@tnu.edu.eg', departmentId: deptCmp.id, createdAt: now, updatedAt: now },
      { id: 'inst-sherif', name: 'د. حسام الدين شريف', title: 'دكتور', email: 'h.sherif@tnu.edu.eg', departmentId: deptMtr.id, createdAt: now, updatedAt: now },
      { id: 'inst-radwan', name: 'د. علاء رضوان', title: 'دكتور', email: 'a.radwan@tnu.edu.eg', departmentId: deptMtr.id, createdAt: now, updatedAt: now }
    ];

    instructorsList.forEach((inst) => this.instructors.set(inst.id, inst));

    // 7. Seed Real Courses with Category (Core, Elective, General) and Soft-delete flag
    INITIAL_COURSES.forEach((c) => {
      let cat: CourseCategory = 'CORE';
      if (c.code.includes('XE1') || c.title.includes('اختياري')) {
        cat = 'ELECTIVE';
      } else if (c.code.includes('HUM') || c.code.includes('131') || c.code.includes('X32')) {
        cat = 'GENERAL';
      }

      const courseRecord: Course & { archivedAt: string | null; category: CourseCategory } = {
        ...c,
        category: cat,
        archivedAt: null,
        credits: typeof c.credits === 'number' ? c.credits : 3
      };

      this.courses.set(c.id, courseRecord);
      this.coursesByCode.set(c.code.trim().toUpperCase(), c.id);

      if (!this.coursesByDept.has(c.departmentId)) {
        this.coursesByDept.set(c.departmentId, new Set());
      }
      this.coursesByDept.get(c.departmentId)!.add(c.id);
    });

    // 8. Seed Schedules & Exams
    INITIAL_SCHEDULE.forEach((s) => {
      this.schedules.set(s.id, s);
      if (!this.schedulesByCourse.has(s.courseId)) {
        this.schedulesByCourse.set(s.courseId, new Set());
      }
      this.schedulesByCourse.get(s.courseId)!.add(s.id);
    });

    INITIAL_EXAMS_QUIZZES.forEach((e) => {
      this.exams.set(e.id, e);
    });

    // 9. Seed Users (Authenticated, Secure, Zero Hardcoded Backdoors, Deduplicated)
    const adminEmail = (process.env.ADMIN_EMAIL || "eldmrdasheslam1@gmail.com").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error("FATAL: ADMIN_PASSWORD environment variable is required to seed the administrative account.");
    }
    const adminPhone = process.env.ADMIN_PHONE || "+1 555-0100";
    const adminHash = bcrypt.hashSync(adminPassword, bcrypt.genSaltSync(10));

    const moderatorHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), bcrypt.genSaltSync(10));
    const deptAdminHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), bcrypt.genSaltSync(10));
    const supCmpAllHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), bcrypt.genSaltSync(10));
    const supCmpYr1Hash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), bcrypt.genSaltSync(10));
    const supMtrAllHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), bcrypt.genSaltSync(10));
    const studentAlexHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), bcrypt.genSaltSync(10));

    // SINGLE authoritative Super Admin (Deduplicated, zero secondary phantom accounts)
    const superAdminUser: StoredUser = {
      id: "usr-super-admin-01",
      name: "Faculty Super Administrator",
      email: adminEmail,
      phoneNumber: adminPhone,
      passwordHash: adminHash,
      studentId: "0000-FAC-SUPER",
      role: "super_admin",
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Faculty Administration",
      semester: "All Semesters",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bio: "Super Administrator with full authority over courses, files, moderation, and system analytics.",
      savedBookmarks: [],
      enrolledCourseIds: ["course-eng011", "course-aie101", "course-aie103", "course-aie111"],
      createdAt: "2026-01-01T00:00:00.000Z"
    };
    this.saveUserInternal(superAdminUser);

    // Initial Moderator
    const moderatorUser: StoredUser = {
      id: "usr-moderator-01",
      name: "Dr. Content Moderator",
      email: "moderator@tnu.edu.eg",
      phoneNumber: "+1 555-0188",
      passwordHash: moderatorHash,
      studentId: "0000-FAC-MOD",
      role: "moderator",
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Faculty Moderator",
      semester: "All Semesters",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bio: "Academic Content Moderator for study resources and lecture materials.",
      savedBookmarks: [],
      enrolledCourseIds: ["course-eng011"],
      createdAt: "2026-01-05T00:00:00.000Z"
    };
    this.saveUserInternal(moderatorUser);

    // Initial Department Admin
    const deptAdminUser: StoredUser = {
      id: "usr-samer-104",
      name: "Samer Haddad",
      email: "samer.haddad@tnu.edu.eg",
      phoneNumber: "+1 (555) 567-8901",
      passwordHash: deptAdminHash,
      studentId: "2022-ENG-7201",
      role: "department_admin",
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Year 4 (Senior)",
      semester: "Fall 2026",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bio: "Department Representative for Computer Engineering Students Union.",
      savedBookmarks: [],
      enrolledCourseIds: ["course-aie101", "course-aie103"],
      createdAt: "2026-01-10T00:00:00.000Z"
    };
    this.saveUserInternal(deptAdminUser);

    // Initial Supervisors Seed
    const initialSupervisorsData: StoredUser[] = [
      {
        id: 'usr-sup-cmp-all',
        name: 'د. أحمد عبد الفتاح',
        email: 'dr.ahmed.cmp@tnu.edu.eg',
        phoneNumber: '+20 100 111 2222',
        passwordHash: supCmpAllHash,
        studentId: 'SUP-CMP-01',
        role: 'supervisor',
        supervisorTitle: 'أخصائي قسم هندسة الحاسب والذكاء الاصطناعي',
        supervisorScope: {
          departmentId: 'dept-cmp',
          level: 'all',
          canManageCourses: true,
          canUploadResources: true,
          canUploadCertificates: true,
          canManageAssignments: true,
          canModerateDiscussions: true,
          canPublishAnnouncements: true
        },
        universityId: univ.id,
        facultyId: faculty.id,
        departmentId: deptCmp.id,
        level: 'Year 2 (Sophomore)',
        semester: 'Fall 2026',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'مشرف رئيسي متخصص في قسم هندسة الحاسبات.',
        savedBookmarks: [],
        enrolledCourseIds: [],
        createdAt: '2026-01-10T00:00:00.000Z'
      },
      {
        id: 'usr-sup-cmp-yr1',
        name: 'م. عمر الشريف',
        email: 'eng.omar.cmp1@tnu.edu.eg',
        phoneNumber: '+20 100 222 3333',
        passwordHash: supCmpYr1Hash,
        studentId: 'SUP-CMP-Y1',
        role: 'supervisor',
        supervisorTitle: 'أخصائي السنة الأولى (Year 1) - قسم هندسة الحاسب',
        supervisorScope: {
          departmentId: 'dept-cmp',
          level: 'Year 1 (Freshman)',
          canManageCourses: true,
          canUploadResources: true,
          canUploadCertificates: true,
          canManageAssignments: true,
          canModerateDiscussions: true,
          canPublishAnnouncements: true
        },
        universityId: univ.id,
        facultyId: faculty.id,
        departmentId: deptCmp.id,
        level: 'Year 1 (Freshman)',
        semester: 'Fall 2026',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'مشرف متخصص للسنة الأولى بفرع هندسة الحاسبات.',
        savedBookmarks: [],
        enrolledCourseIds: [],
        createdAt: '2026-02-01T00:00:00.000Z'
      },
       {
         id: 'usr-sup-mtr-all',
         name: 'م. يارا حسين',
         email: 'eng.yara.mtr@tnu.edu.eg',
         phoneNumber: '+20 100 333 4444',
         passwordHash: supMtrAllHash,
        studentId: 'SUP-MTR-01',
        role: 'supervisor',
        supervisorTitle: 'أخصائية قسم هندسة الميكاترونكس والروبوتات',
        supervisorScope: {
          departmentId: 'dept-mtr',
          level: 'all',
          canManageCourses: true,
          canUploadResources: true,
          canUploadCertificates: true,
          canManageAssignments: true,
          canModerateDiscussions: true,
          canPublishAnnouncements: true
        },
        universityId: univ.id,
        facultyId: faculty.id,
        departmentId: deptMtr.id,
        level: 'Year 2 (Sophomore)',
        semester: 'Fall 2026',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'أخصائية قسم الميكاترونكس.',
        savedBookmarks: [],
        enrolledCourseIds: [],
        createdAt: '2026-01-15T00:00:00.000Z'
      }
    ];

    initialSupervisorsData.forEach((sup) => this.saveUserInternal(sup));

    // Initial Student: Alex Vance
    const studentAlex: StoredUser = {
      id: "usr-alex-101",
      name: "Alex Vance",
      email: "alex.dev@tnu.edu.eg",
      phoneNumber: "+1 (555) 234-5678",
      passwordHash: studentAlexHash,
      studentId: "2024-ENG-8912",
      role: "student",
      universityId: univ.id,
      facultyId: faculty.id,
      departmentId: deptCmp.id,
      level: "Year 1 (Freshman)",
      semester: "Fall 2026",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      bio: "Freshman Computer Engineering student focused on Embedded Systems and Algorithms.",
      savedBookmarks: ["res-01", "res-02"],
      enrolledCourseIds: ["course-eng011", "course-eng021", "course-eng041", "course-aie101"],
      createdAt: "2026-01-15T08:30:00.000Z"
    };
    this.saveUserInternal(studentAlex);

    // Seed points ledger for student Alex (append-only ledger)
    this.addPointsLedgerEntryInternal(studentAlex.id, 'upload_approved', 50, 'res-01', 'Approved lecture summary notes');
    this.addPointsLedgerEntryInternal(studentAlex.id, 'answer_accepted', 30, 'post-01', 'Accepted solution in Math discussion');
    this.addPointsLedgerEntryInternal(studentAlex.id, 'bonus', 45, 'welcome-bonus', 'Academic onboarding completion');

    // 10. Seed Resources (Study Files) with fileKey and signed download URL
    const initialResourcesData: StoredResource[] = [
      {
        id: 'res-01',
        title: 'ملخص شامل: المصفوفات وطرق حل المعادلات الخطية',
        description: 'ملخص معتمد ومبسط لجميع طرق حل المعادلات الخطية ومقلوب المصفوفة وقاعدة كرامر.',
        category: 'lecture_notes',
        resourceType: 'lecture',
        courseId: 'course-eng011',
        courseCode: 'ENG 011',
        courseTitle: 'الرياضيات الهندسية (1)',
        departmentId: deptCmp.id,
        academicYear: 'Year 1 (Freshman)',
        semester: 'Fall 2026',
        fileType: 'pdf',
        fileSize: '4.2 MB',
        fileSizeBytes: 4404019,
        fileName: 'ENG011_Matrices_Complete_Summary.pdf',
        fileKey: 'uploads/2026/courses/eng011/matrices-summary-v1.pdf',
        uploaderId: studentAlex.id,
        uploaderName: studentAlex.name,
        uploaderRole: studentAlex.role,
        uploaderDepartment: deptCmp.name,
        uploadDate: '2026-10-02T10:30:00.000Z',
        downloadCount: 48,
        viewCount: 156,
        rating: 4.9,
        ratingCount: 18,
        helpfulCount: 22,
        notHelpfulCount: 0,
        helpfulVotedUsers: new Map(),
        downloadUrl: '/api/files/download/res-01',
        status: 'approved',
        moderationStatus: 'approved',
        verificationStatus: 'verified',
        moderatedBy: moderatorUser.id,
        moderatedByName: moderatorUser.name,
        moderatedAt: '2026-10-02T11:00:00.000Z',
        version: 1,
        tags: ['Math', 'Linear Algebra', 'Matrices', 'TNU'],
        createdAt: '2026-10-02T10:30:00.000Z',
        updatedAt: '2026-10-02T11:00:00.000Z'
      },
      {
        id: 'res-02',
        title: 'شيت مسائل محلولة: اتزان الجسيمات والجمالونات (Trusses)',
        description: 'حلول نموذجية وشاملة لمسائل الميكانيكا الهندسية مع رسم مخطط الجسم الحر FBD.',
        category: 'assignment',
        resourceType: 'assignment',
        courseId: 'course-eng021',
        courseCode: 'ENG 021',
        courseTitle: 'الميكانيكا الهندسية (1)',
        departmentId: deptCmp.id,
        academicYear: 'Year 1 (Freshman)',
        semester: 'Fall 2026',
        fileType: 'pdf',
        fileSize: '6.8 MB',
        fileSizeBytes: 7130316,
        fileName: 'ENG021_Trusses_Solved_Problems.pdf',
        fileKey: 'uploads/2026/courses/eng021/trusses-solved-v1.pdf',
        uploaderId: studentAlex.id,
        uploaderName: studentAlex.name,
        uploaderRole: studentAlex.role,
        uploaderDepartment: deptCmp.name,
        uploadDate: '2026-10-05T14:15:00.000Z',
        downloadCount: 65,
        viewCount: 210,
        rating: 5.0,
        ratingCount: 24,
        helpfulCount: 31,
        notHelpfulCount: 1,
        helpfulVotedUsers: new Map(),
        downloadUrl: '/api/files/download/res-02',
        status: 'approved',
        moderationStatus: 'approved',
        verificationStatus: 'official',
        moderatedBy: moderatorUser.id,
        moderatedByName: moderatorUser.name,
        moderatedAt: '2026-10-05T15:00:00.000Z',
        version: 1,
        tags: ['Mechanics', 'Statics', 'Trusses', 'FBD'],
        createdAt: '2026-10-05T14:15:00.000Z',
        updatedAt: '2026-10-05T15:00:00.000Z'
      }
    ];

    initialResourcesData.forEach((res) => {
      this.resources.set(res.id, res);
      if (!this.resourcesByCourse.has(res.courseId)) {
        this.resourcesByCourse.set(res.courseId, new Set());
      }
      this.resourcesByCourse.get(res.courseId)!.add(res.id);
    });

    // 11. Initial Notifications
    const welcomeNotif: StoredNotification = {
      id: 'notif-welcome-01',
      userId: studentAlex.id,
      category: 'system',
      type: 'welcome',
      title: 'مرحباً بك في منصة EngHub',
      titleAr: 'مرحباً بك في منصة EngHub',
      message: 'تم إعداد حسابك الأكاديمي بنجاح. يمكنك الآن تصفح المقررات وتحميل المذكرات المعتمدة.',
      messageAr: 'تم إعداد حسابك الأكاديمي بنجاح. يمكنك الآن تصفح المقررات وتحميل المذكرات المعتمدة.',
      read: false,
      createdAt: now
    };
    this.notifications.set(welcomeNotif.id, welcomeNotif);
  }

  // --------------------------------------------------------------------------
  // USER OPERATIONS
  // --------------------------------------------------------------------------
  private saveUserInternal(user: StoredUser): StoredUser {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.trim().toLowerCase(), user.id);

    // Upsert-safe StudentProfile creation
    const profileId = `profile-${user.id}`;
    const existingProfile = this.studentProfiles.get(profileId);
    const updatedProfile: StoredStudentProfile = {
      id: profileId,
      userId: user.id,
      universityId: user.universityId || 'univ-tnu',
      facultyId: user.facultyId || 'fac-eng-01',
      departmentId: user.departmentId || 'dept-cmp',
      levelId: user.level || 'lvl-y1',
      semesterId: user.semester || 'sem-fall-2026',
      bio: user.bio || existingProfile?.bio || '',
      avatarUrl: user.avatar || existingProfile?.avatarUrl || '',
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.studentProfiles.set(profileId, updatedProfile);

    // Synchronize enrollments
    if (user.enrolledCourseIds && user.enrolledCourseIds.length > 0) {
      if (!this.enrollmentsByStudent.has(user.id)) {
        this.enrollmentsByStudent.set(user.id, new Set());
      }
      user.enrolledCourseIds.forEach((courseId) => {
        const enrollId = `enroll-${user.id}-${courseId}`;
        this.enrollments.set(enrollId, {
          id: enrollId,
          studentId: user.id,
          courseId,
          semesterId: user.semester || 'sem-fall-2026',
          enrolledAt: new Date().toISOString()
        });
        this.enrollmentsByStudent.get(user.id)!.add(courseId);
      });
    }

    return user;
  }

  public getUserByEmail(email: string): StoredUser | null {
    const normalized = email.trim().toLowerCase();
    const userId = this.usersByEmail.get(normalized);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  public getUserById(id: string): StoredUser | null {
    return this.users.get(id) || null;
  }

  public saveUser(user: StoredUser): StoredUser {
    return this.saveUserInternal(user);
  }

  public queryUsers(filter: { search?: string; department?: string; level?: string; role?: string; page?: number; limit?: number }) {
    let result = Array.from(this.users.values());

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.studentId && u.studentId.toLowerCase().includes(q)));
    }
    if (filter.department && filter.department !== 'all') {
      result = result.filter((u) => u.departmentId === filter.department);
    }
    if (filter.level && filter.level !== 'all') {
      result = result.filter((u) => u.level === filter.level);
    }
    if (filter.role && filter.role !== 'all') {
      result = result.filter((u) => u.role === filter.role);
    }

    const total = result.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
      users: paginated.map((u) => this.toSafeUser(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public toSafeUser(user: StoredUser) {
    const calculatedPoints = this.calculateUserPoints(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      studentId: user.studentId,
      role: user.role,
      supervisorTitle: user.supervisorTitle,
      supervisorScope: user.supervisorScope,
      universityId: user.universityId,
      facultyId: user.facultyId,
      departmentId: user.departmentId,
      level: user.level,
      semester: user.semester,
      avatar: user.avatar,
      bio: user.bio,
      points: calculatedPoints,
      badges: user.badges || [],
      savedBookmarks: user.savedBookmarks || [],
      enrolledCourseIds: user.enrolledCourseIds || [],
      createdAt: user.createdAt
    };
  }

  // --------------------------------------------------------------------------
  // POINTS LEDGER & LEADERBOARD (APPEND-ONLY & SERVER-DERIVED)
  // --------------------------------------------------------------------------
  private addPointsLedgerEntryInternal(userId: string, type: PointsLedgerType, points: number, referenceId?: string, reason?: string): StoredPointsLedger {
    const entry: StoredPointsLedger = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      type,
      points,
      referenceId,
      reason,
      createdAt: new Date().toISOString()
    };
    this.pointsLedger.push(entry);

    if (!this.pointsLedgerByUser.has(userId)) {
      this.pointsLedgerByUser.set(userId, []);
    }
    this.pointsLedgerByUser.get(userId)!.push(entry);

    return entry;
  }

  public addPoints(userId: string, type: PointsLedgerType, points: number, referenceId?: string, reason?: string) {
    return this.addPointsLedgerEntryInternal(userId, type, points, referenceId, reason);
  }

  public calculateUserPoints(userId: string): number {
    const entries = this.pointsLedgerByUser.get(userId) || [];
    return entries.reduce((sum, e) => sum + e.points, 0);
  }

  public getLeaderboard(limit = 10) {
    // Exclude administrators and staff from student rankings
    const students = Array.from(this.users.values()).filter((u) => u.role === 'student');

    const ranked = students
      .map((student) => ({
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        departmentId: student.departmentId,
        level: student.level,
        points: this.calculateUserPoints(student.id)
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);

    return ranked;
  }

  // --------------------------------------------------------------------------
  // COURSES (WITH SOFT-DELETE ENFORCEMENT)
  // --------------------------------------------------------------------------
  public queryCourses(filter: { departmentId?: string; level?: string; semester?: string; q?: string; page?: number; limit?: number }) {
    return this.getCourses(filter);
  }

  public getCourses(filter: { departmentId?: string; level?: string; semester?: string; q?: string; page?: number; limit?: number }) {
    // Standard queries filter out soft-deleted courses (archivedAt != null)
    let list = Array.from(this.courses.values()).filter((c) => !c.archivedAt);

    if (filter.departmentId && filter.departmentId !== 'all') {
      list = list.filter((c) => c.departmentId === filter.departmentId);
    }
    if (filter.level && filter.level !== 'all') {
      list = list.filter((c) => c.level === filter.level);
    }
    if (filter.semester && filter.semester !== 'all') {
      list = list.filter((c) => c.semester === filter.semester);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || (c.instructor && c.instructor.toLowerCase().includes(q)));
    }

    const total = list.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 30));
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      courses: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public getCourseById(id: string): (Course & { archivedAt?: string | null; category?: CourseCategory }) | null {
    const course = this.courses.get(id);
    if (!course || course.archivedAt) return null;
    return course;
  }

  public saveCourse(course: Course & { category?: CourseCategory }): Course {
    const existing = this.courses.get(course.id);
    const updated: Course & { archivedAt: string | null; category: CourseCategory } = {
      ...course,
      credits: typeof course.credits === 'number' ? course.credits : 3,
      category: course.category || (course.code.includes('XE1') ? 'ELECTIVE' : 'CORE'),
      archivedAt: existing?.archivedAt || null
    };

    this.courses.set(course.id, updated);
    this.coursesByCode.set(course.code.trim().toUpperCase(), course.id);

    if (!this.coursesByDept.has(course.departmentId)) {
      this.coursesByDept.set(course.departmentId, new Set());
    }
    this.coursesByDept.get(course.departmentId)!.add(course.id);

    return updated;
  }

  public deleteCourse(id: string): boolean {
    // Explicit soft-delete: preserves relational integrity for enrollments, study materials, and grades
    const course = this.courses.get(id);
    if (!course) return false;

    course.archivedAt = new Date().toISOString();
    this.courses.set(id, course);
    return true;
  }

  // --------------------------------------------------------------------------
  // SCHEDULES & EXAMS
  // --------------------------------------------------------------------------
  public querySchedules(filter: { departmentId?: string; level?: string; courseId?: string; dayOfWeek?: string }) {
    return this.getSchedules(filter);
  }

  public getSchedules(filter: { departmentId?: string; level?: string; courseId?: string; dayOfWeek?: string }) {
    let list = Array.from(this.schedules.values());
    if (filter.departmentId && filter.departmentId !== 'all') {
      list = list.filter((s) => s.departmentId === filter.departmentId);
    }
    if (filter.level && filter.level !== 'all') {
      list = list.filter((s) => s.level === filter.level);
    }
    if (filter.courseId && filter.courseId !== 'all') {
      list = list.filter((s) => s.courseId === filter.courseId);
    }
    if (filter.dayOfWeek && filter.dayOfWeek !== 'all') {
      list = list.filter((s) => s.dayOfWeek === filter.dayOfWeek);
    }

    return { schedules: list, total: list.length };
  }

  public getScheduleById(id: string): ScheduleItem | null {
    return this.schedules.get(id) || null;
  }

  public saveSchedule(schedule: ScheduleItem): ScheduleItem {
    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  public deleteSchedule(id: string): boolean {
    return this.schedules.delete(id);
  }

  public queryExams(filter: { departmentId?: string; courseId?: string; topic?: string; difficulty?: string; term?: string; isPastExam?: boolean; q?: string; page?: number; limit?: number }) {
    return this.getExams(filter);
  }

  public getExams(filter: { departmentId?: string; courseId?: string; topic?: string; difficulty?: string; term?: string; isPastExam?: boolean; q?: string; page?: number; limit?: number }) {
    let list = Array.from(this.exams.values());
    if (filter.departmentId && filter.departmentId !== 'all') {
      list = list.filter((e) => e.departmentId === filter.departmentId);
    }
    if (filter.courseId && filter.courseId !== 'all') {
      list = list.filter((e) => e.courseId === filter.courseId);
    }
    if (filter.difficulty && filter.difficulty !== 'all') {
      list = list.filter((e) => e.difficulty === filter.difficulty);
    }
    if (filter.term && filter.term !== 'all') {
      list = list.filter((e) => e.term === filter.term);
    }
    if (filter.isPastExam !== undefined) {
      list = list.filter((e) => e.isPastExam === filter.isPastExam);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || (e.courseCode && e.courseCode.toLowerCase().includes(q)));
    }

    const total = list.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const paginated = list.slice((page - 1) * limit, page * limit);

    return { exams: paginated, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public getExamById(id: string): ExamQuiz | null {
    return this.exams.get(id) || null;
  }

  public saveExam(exam: ExamQuiz): ExamQuiz {
    this.exams.set(exam.id, exam);
    return exam;
  }

  public deleteExam(id: string): boolean {
    return this.exams.delete(id);
  }

  // --------------------------------------------------------------------------
  // RESOURCES & STORAGE ACCESS
  // --------------------------------------------------------------------------
  public queryResources(filter: { courseId?: string; departmentId?: string; category?: string; status?: string; moderationStatus?: string; verificationStatus?: string; uploaderId?: string; search?: string; semester?: string; academicYear?: string; sortBy?: 'recent' | 'downloads' | 'rating'; currentUserId?: string; currentUserRole?: string; currentUserDept?: string; page?: number; limit?: number }) {
    return this.getResources(filter);
  }

  public getResources(filter: { courseId?: string; departmentId?: string; category?: string; status?: string; moderationStatus?: string; verificationStatus?: string; uploaderId?: string; search?: string; semester?: string; academicYear?: string; sortBy?: 'recent' | 'downloads' | 'rating'; currentUserId?: string; currentUserRole?: string; currentUserDept?: string; page?: number; limit?: number }) {
    let list = Array.from(this.resources.values());

    const isElevated = filter.currentUserRole && ['super_admin', 'department_admin', 'moderator', 'supervisor'].includes(filter.currentUserRole);

    if (filter.status && filter.status !== 'all') {
      list = list.filter((r) => r.status === filter.status);
    } else if (!filter.status && !isElevated) {
      // By default, student view returns approved resources
      list = list.filter((r) => r.status === 'approved');
    }
    if (filter.moderationStatus && filter.moderationStatus !== 'all') {
      list = list.filter((r) => r.moderationStatus === filter.moderationStatus);
    }
    if (filter.verificationStatus && filter.verificationStatus !== 'all') {
      list = list.filter((r) => r.verificationStatus === filter.verificationStatus);
    }
    if (filter.uploaderId && filter.uploaderId !== 'all') {
      list = list.filter((r) => r.uploaderId === filter.uploaderId);
    }
    if (filter.courseId && filter.courseId !== 'all') {
      list = list.filter((r) => r.courseId === filter.courseId);
    }
    if (filter.departmentId && filter.departmentId !== 'all') {
      list = list.filter((r) => r.departmentId === filter.departmentId);
    }
    if (filter.category && filter.category !== 'all') {
      list = list.filter((r) => r.category === filter.category);
    }
    if (filter.semester && filter.semester !== 'all') {
      list = list.filter((r) => r.semester === filter.semester);
    }
    if (filter.academicYear && filter.academicYear !== 'all') {
      list = list.filter((r) => r.academicYear === filter.academicYear);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.fileName.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
    }

    if (filter.sortBy === 'downloads') {
      list.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (filter.sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = list.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const paginated = list.slice((page - 1) * limit, page * limit);

    return { resources: paginated.map((r) => this.toSafeResource(r, filter.currentUserId)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public getResourceById(id: string): StoredResource | null {
    return this.resources.get(id) || null;
  }

  public saveResource(resource: StoredResource): StoredResource {
    this.resources.set(resource.id, resource);
    if (!this.resourcesByCourse.has(resource.courseId)) {
      this.resourcesByCourse.set(resource.courseId, new Set());
    }
    this.resourcesByCourse.get(resource.courseId)!.add(resource.id);
    return resource;
  }

  public incrementResourceDownload(id: string): number {
    const res = this.resources.get(id);
    if (res) {
      res.downloadCount = (res.downloadCount || 0) + 1;
      this.resources.set(id, res);
      return res.downloadCount;
    }
    return 0;
  }

  public voteResource(id: string, userId: string, voteType: 'helpful' | 'not_helpful') {
    const res = this.resources.get(id);
    if (!res) return null;

    if (!res.helpfulVotedUsers) {
      res.helpfulVotedUsers = new Map();
    }

    const prevVote = res.helpfulVotedUsers.get(userId);
    if (prevVote === voteType) {
      res.helpfulVotedUsers.delete(userId);
      if (voteType === 'helpful') res.helpfulCount = Math.max(0, res.helpfulCount - 1);
      else res.notHelpfulCount = Math.max(0, res.notHelpfulCount - 1);
    } else {
      if (prevVote === 'helpful') res.helpfulCount = Math.max(0, res.helpfulCount - 1);
      if (prevVote === 'not_helpful') res.notHelpfulCount = Math.max(0, res.notHelpfulCount - 1);

      res.helpfulVotedUsers.set(userId, voteType);
      if (voteType === 'helpful') res.helpfulCount += 1;
      else res.notHelpfulCount += 1;
    }

    this.resources.set(id, res);
    return {
      helpfulCount: res.helpfulCount,
      notHelpfulCount: res.notHelpfulCount,
      userVote: res.helpfulVotedUsers.get(userId) || null
    };
  }

  public toSafeResource(res: StoredResource, userId?: string) {
    return {
      id: res.id,
      title: res.title,
      description: res.description,
      category: res.category,
      resourceType: res.resourceType,
      courseId: res.courseId,
      courseCode: res.courseCode,
      courseTitle: res.courseTitle,
      departmentId: res.departmentId,
      academicYear: res.academicYear,
      semester: res.semester,
      fileType: res.fileType,
      fileSize: res.fileSize,
      fileName: res.fileName,
      uploaderId: res.uploaderId,
      uploaderName: res.uploaderName,
      uploaderRole: res.uploaderRole,
      uploaderDepartment: res.uploaderDepartment,
      uploadDate: res.uploadDate,
      downloadCount: res.downloadCount,
      viewCount: res.viewCount,
      rating: res.rating,
      ratingCount: res.ratingCount,
      helpfulCount: res.helpfulCount,
      notHelpfulCount: res.notHelpfulCount,
      downloadUrl: res.downloadUrl,
      status: res.status,
      moderationStatus: res.moderationStatus,
      verificationStatus: res.verificationStatus,
      moderatedByName: res.moderatedByName,
      moderatedAt: res.moderatedAt,
      rejectionReason: res.rejectionReason,
      version: res.version,
      tags: res.tags,
      createdAt: res.createdAt,
      userVote: userId && res.helpfulVotedUsers ? res.helpfulVotedUsers.get(userId) || null : null
    };
  }

  // --------------------------------------------------------------------------
  // MODERATION ACTIONS (AUDIT LOG & REVERSALS)
  // --------------------------------------------------------------------------
  public logModerationAction(action: Omit<StoredModerationAction, 'id' | 'createdAt'>) {
    const entry: StoredModerationAction = {
      id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...action,
      createdAt: new Date().toISOString()
    };
    this.moderationActions.push(entry);
    return entry;
  }

  // --------------------------------------------------------------------------
  // COMMUNITY DISCUSSIONS & COMMENTS
  // --------------------------------------------------------------------------
  public queryPosts(filter: { courseId?: string; departmentId?: string; postType?: string; category?: string; search?: string; sortBy?: 'recent' | 'popular' | 'unsolved'; isSolved?: boolean; currentUserId?: string; page?: number; limit?: number }) {
    return this.getPosts(filter);
  }

  public getPosts(filter: { courseId?: string; departmentId?: string; postType?: string; category?: string; search?: string; sortBy?: 'recent' | 'popular' | 'unsolved'; isSolved?: boolean; currentUserId?: string; page?: number; limit?: number }) {
    let list = Array.from(this.posts.values());
    if (filter.courseId && filter.courseId !== 'all') {
      list = list.filter((p) => p.courseId === filter.courseId);
    }
    if (filter.departmentId && filter.departmentId !== 'all') {
      list = list.filter((p) => p.departmentId === filter.departmentId);
    }
    if (filter.postType && filter.postType !== 'all') {
      list = list.filter((p) => p.postType === filter.postType);
    }
    if (filter.category && filter.category !== 'all') {
      list = list.filter((p) => p.postType === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
    }
    if (filter.isSolved !== undefined) {
      list = list.filter((p) => p.isSolved === filter.isSolved);
    }

    if (filter.sortBy === 'popular') {
      list.sort((a, b) => b.upvotes - a.upvotes);
    } else if (filter.sortBy === 'unsolved') {
      list = list.filter((p) => !p.isSolved);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = list.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(50, Math.max(1, filter.limit || 20));
    const paginated = list.slice((page - 1) * limit, page * limit);

    return { posts: paginated.map((p) => this.toSafePost(p, filter.currentUserId)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public getPostById(id: string): StoredPost | null {
    return this.posts.get(id) || null;
  }

  public savePost(post: StoredPost): StoredPost {
    this.posts.set(post.id, post);
    return post;
  }

  public toSafePost(post: StoredPost, userId?: string) {
    return {
      id: post.id,
      courseId: post.courseId,
      courseCode: post.courseCode,
      departmentId: post.departmentId,
      title: post.title,
      content: post.content,
      postType: post.postType,
      authorId: post.authorId,
      authorName: post.authorName,
      authorDepartment: post.authorDepartment,
      authorRole: post.authorRole,
      authorAvatar: post.authorAvatar,
      createdAt: post.createdAt,
      upvotes: post.upvotes,
      hasUpvoted: userId ? post.upvotedUsers?.has(userId) : false,
      replyCount: post.replyCount,
      isSolved: post.isSolved,
      isPinned: post.isPinned,
      views: post.views,
      tags: post.tags
    };
  }

  public getCommentsForPost(postId: string, userId?: string): any[] {
    const list = this.comments.get(postId) || [];
    return list.map((c) => ({
      id: c.id,
      targetId: c.targetId,
      authorId: c.authorId,
      authorName: c.authorName,
      authorDepartment: c.authorDepartment,
      authorRole: c.authorRole,
      authorAvatar: c.authorAvatar,
      content: c.content,
      createdAt: c.createdAt,
      upvotes: c.upvotes,
      hasUpvoted: userId ? c.upvotedUsers?.has(userId) : false,
      isSolution: c.isSolution
    }));
  }

  public saveComment(comment: StoredComment): StoredComment {
    if (!this.comments.has(comment.targetId)) {
      this.comments.set(comment.targetId, []);
    }
    this.comments.get(comment.targetId)!.push(comment);

    const post = this.posts.get(comment.targetId);
    if (post) {
      post.replyCount = (post.replyCount || 0) + 1;
      this.posts.set(comment.targetId, post);
    }
    return comment;
  }

  public toSafeComment(comment: StoredComment, userId?: string) {
    return {
      id: comment.id,
      targetId: comment.targetId,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorDepartment: comment.authorDepartment,
      authorRole: comment.authorRole,
      authorAvatar: comment.authorAvatar,
      content: comment.content,
      createdAt: comment.createdAt,
      upvotes: comment.upvotes,
      hasUpvoted: userId ? comment.upvotedUsers?.has(userId) : false,
      isSolution: comment.isSolution
    };
  }

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------
  public queryNotifications(userId: string, filter: { read?: boolean; unreadOnly?: boolean; category?: string; page?: number; limit?: number }) {
    return this.getNotifications(userId, filter);
  }

  public getNotifications(userId: string, filter: { read?: boolean; unreadOnly?: boolean; category?: string; page?: number; limit?: number }) {
    let list = Array.from(this.notifications.values()).filter((n) => n.userId === userId || n.userId === 'all');
    if (filter.unreadOnly) {
      list = list.filter((n) => !n.read);
    } else if (filter.read !== undefined) {
      list = list.filter((n) => n.read === filter.read);
    }
    if (filter.category && filter.category !== 'all') {
      list = list.filter((n) => n.category === filter.category);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = list.filter((n) => !n.read).length;
    const limit = filter.limit || 30;
    const page = Math.max(1, filter.page || 1);
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      notifications: paginated,
      total: list.length,
      page,
      limit,
      unreadCount
    };
  }

  public saveNotification(notification: StoredNotification): StoredNotification {
    this.notifications.set(notification.id, notification);
    return notification;
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const notif = this.notifications.get(id);
    if (!notif || (notif.userId !== userId && notif.userId !== 'all')) return false;
    notif.read = true;
    this.notifications.set(id, notif);
    return true;
  }

  public markAllNotificationsRead(userId: string): number {
    let count = 0;
    this.notifications.forEach((n) => {
      if ((n.userId === userId || n.userId === 'all') && !n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  }

  // --------------------------------------------------------------------------
  // HIERARCHY & METADATA
  // --------------------------------------------------------------------------
  public getHierarchy() {
    return {
      university: Array.from(this.universities.values())[0],
      faculty: Array.from(this.faculties.values())[0],
      departments: Array.from(this.departments.values()),
      academicLevels: Array.from(this.academicLevels.values()),
      semesters: Array.from(this.semesters.values()),
      instructors: Array.from(this.instructors.values())
    };
  }
}

// Global Singleton Instance
export const db = new DatabaseEngine();
