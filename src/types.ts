export type AcademicLevel = 'Year 1 (Freshman)' | 'Year 2 (Sophomore)';
export type Semester = 'Fall 2026' | 'Spring 2026' | 'Summer 2026';
export type UserRole = 'student' | 'moderator' | 'department_admin' | 'supervisor' | 'super_admin';

export interface SupervisorScope {
  departmentId: string | 'all'; // e.g., 'dept-cmp', 'dept-mtr', or 'all'
  level?: AcademicLevel | 'all'; // e.g., 'Year 1 (Freshman)', 'Year 2 (Sophomore)', etc. or 'all'
  assignedCourseIds?: string[]; // list of specific course IDs or empty for all in scope
  canManageCourses?: boolean; // Add/edit course details, syllabus, schedule
  canUploadResources?: boolean; // Upload & approve study materials, labs, lectures
  canUploadCertificates?: boolean; // Issue/upload certificates
  canManageAssignments?: boolean; // Add and grade assignments
  canModerateDiscussions?: boolean; // Moderate Q&A & comments
  canPublishAnnouncements?: boolean; // Broadcast official notices for their scope
}

export interface Department {
  id: string;
  code: string; // e.g. 'CMP', 'MTR', 'ELE'
  name: string;
  facultyId: string;
  description: string;
  studentCount: number;
  courseCount: number;
  iconName: string;
  color: string;
}

export interface University {
  id: string;
  name: string;
  code: string;
  faculties: Faculty[];
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
  departments: Department[];
}

export interface Course {
  id: string;
  code: string; // e.g. CS201, MC301
  title: string;
  departmentId: string;
  level: AcademicLevel;
  semester: Semester;
  credits: number;
  instructor: string;
  instructorEmail: string;
  description: string;
  syllabus: string[];
  scheduleDayTime: string;
  location: string;
  prerequisites: string[];
  gradingScheme: { category: string; weight: number }[];
  fileCount: number;
  discussionCount: number;
  bannerImage?: string;
}

export type ResourceCategory =
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

export type FileCategory = ResourceCategory;

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed';
export type ResourceModerationStatus = 'pending' | 'approved' | 'rejected';
export type ResourceVerificationStatus = 'official' | 'verified' | 'student_uploaded' | 'rejected';

export interface StudyFile {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseCode?: string;
  courseTitle?: string;
  departmentId?: string;
  academicYear?: string;
  semester?: string;
  category: FileCategory;
  fileType: 'pdf' | 'docx' | 'pptx' | 'zip' | 'code' | 'image';
  fileSize: string;
  fileSizeBytes?: number;
  fileName?: string;
  fileData?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole;
  uploaderDepartment: string;
  uploadDate: string;
  downloadCount: number;
  viewCount: number;
  rating: number; // 1 to 5
  ratingCount: number;
  helpfulCount?: number;
  notHelpfulCount?: number;
  userVote?: 'helpful' | 'not_helpful' | null;
  previewContent?: string;
  downloadUrl: string;
  status: ModerationStatus;
  moderationStatus?: ResourceModerationStatus;
  verificationStatus?: ResourceVerificationStatus;
  moderatedBy?: string;
  moderatedByName?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  version: number;
  tags: string[];
  isBookmarked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AcademicResource = StudyFile;

export interface Comment {
  id: string;
  parentId?: string; // For threaded 1-level reply nesting
  targetType: 'file' | 'discussion';
  targetId: string;
  authorId: string;
  authorName: string;
  authorDepartment: string;
  authorRole: UserRole;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  upvotes: number;
  hasUpvoted?: boolean;
  isSolution?: boolean;
}

export interface DiscussionThread {
  id: string;
  courseId: string;
  courseCode?: string;
  departmentId?: string;
  title: string;
  content: string;
  postType?: PostCategoryType;
  authorId: string;
  authorName: string;
  authorDepartment: string;
  authorRole: UserRole;
  authorAvatar?: string;
  createdAt: string;
  upvotes: number;
  hasUpvoted?: boolean;
  replyCount: number;
  isSolved?: boolean;
  isPinned?: boolean;
  views?: number;
  tags: string[];
}

export type AssignmentStatus = 'todo' | 'in_progress' | 'submitted' | 'graded';

export interface Assignment {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  weightPercent: number;
  status: AssignmentStatus;
  gradeAchieved?: number;
  submissionNotes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  departmentId?: string;
  level?: AcademicLevel;
  createdByName?: string;
  createdByRole?: string;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  type: 'lecture' | 'section' | 'lab' | 'office_hour' | 'exam';
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة' | string;
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  location: string;
  instructor: string;
  departmentId?: string;
  level?: AcademicLevel;
  attendanceNotes?: string;
}

export interface PointsLedgerEntry {
  id: string;
  userId: string;
  type: 'upload_approved' | 'helpful_answer' | 'file_rated' | 'solved_exam_q' | 'reversal_file_removed' | 'reversal_spam';
  points: number; // positive or negative
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  studentId: string;
  role: UserRole;
  supervisorScope?: SupervisorScope;
  supervisorTitle?: string;
  universityId: string;
  facultyId: string;
  departmentId: string;
  departmentName?: string;
  level: AcademicLevel;
  semester: Semester;
  avatar: string;
  bio: string;
  points: number; // derived from ledger
  badges: Badge[];
  savedBookmarks: string[]; // file IDs
  enrolledCourseIds: string[];
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  color: string;
}

export interface Announcement {
  id: string;
  scope: 'university' | 'faculty' | 'department' | 'course';
  targetId?: string; // departmentId or courseId
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  date: string;
  isPinned?: boolean;
  priority: 'low' | 'normal' | 'urgent';
}

export type EventCategory = 'workshop' | 'hackathon' | 'guest_lecture' | 'social' | 'competition' | 'field_trip' | 'seminar';

export interface EventRegistrant {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  departmentName?: string;
  registeredAt: string;
}

export interface EventAgendaItem {
  time: string;
  topic: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  organizer: string;
  departmentId?: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: EventCategory;
  rsvpCount: number;
  hasRsvped?: boolean;
  image?: string;
  maxCapacity?: number;
  speaker?: string;
  speakerTitle?: string;
  targetAudience?: string;
  requirements?: string;
  contactEmail?: string;
  contactPhone?: string;
  tags?: string[];
  status?: 'published' | 'draft' | 'cancelled';
  registeredStudents?: EventRegistrant[];
  agenda?: EventAgendaItem[];
}

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  date: string;
  contactInfo: string;
  status: 'active' | 'resolved';
  reporterName: string;
  category: 'electronics' | 'calculator' | 'kit' | 'documents' | 'personal';
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: 'textbook' | 'hardware_kit' | 'drawing_gear' | 'components' | 'other';
  condition: 'like_new' | 'good' | 'fair';
  sellerName: string;
  sellerDepartment: string;
  contactInfo?: string;
  whatsappNumber: string;
  date: string;
  status: 'available' | 'sold';
  image?: string;
  images?: string[];
}

export interface StudentClub {
  id: string;
  name: string;
  tagline: string;
  description: string;
  departmentId?: string;
  memberCount: number;
  leadName: string;
  isJoined?: boolean;
  tags: string[];
  bannerUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type ExamTermType = 'Midterm' | 'Final' | 'Quiz' | 'Practical';

export interface ExamQuiz {
  id: string;
  title: string;
  courseId: string;
  courseCode: string;
  departmentId: string;
  topic: string;
  difficulty: QuizDifficulty;
  durationMinutes: number;
  questions: QuizQuestion[];
  year?: string;
  term?: ExamTermType;
  isPastExam?: boolean;
  solutionPdfUrl?: string;
  createdAt: string;
  totalAttempts?: number;
  averageScore?: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  answers: { questionId: string; selectedIndex: number; isCorrect: boolean }[];
  timeTakenSeconds: number;
  submittedAt: string;
  pointsEarned: number;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  courseId?: string;
  courseCode?: string;
  taskName: string;
  durationMinutes: number;
  mode: 'focus' | 'short_break' | 'long_break';
  completedAt: string;
  pointsAwarded: number;
}

export type PostCategoryType =
  | 'question'
  | 'resource_share'
  | 'study_tip'
  | 'exam_discussion'
  | 'project_help';

export interface PostReaction {
  userId: string;
  type: 'like' | 'helpful' | 'insightful';
}

export type NotificationCategory =
  | 'academic'
  | 'community'
  | 'study'
  | 'system'
  | 'gamification';

export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
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

// ----------------------------------------------------
// HONOR BOARD & STUDENT ACHIEVEMENTS
// ----------------------------------------------------
export type HonorCategory =
  | 'academic_excellence'   // تفوق وامتياز دراسي (Top GPA / Valedictorian)
  | 'hackathon_competition' // مسابقات وهاكاثونات هندسية وبرمجية
  | 'scientific_research'   // أبحاث علمية ونشر دولي
  | 'graduation_project'   // مشاريع تخرج مميزة ونماذج صناعية
  | 'robotics_ai'           // روبوتات، أنظمة مدمجة وذكاء اصطناعي
  | 'innovation_patents'    // ابتكارات وبراءات اختراع ونماذج أولية
  | 'student_leadership'    // قيادة طلابية وتنظيم مؤتمرات ومبادرات
  | 'community_impact';     // خدمة مجتمعية وأنشطة تطوعية

export interface HonorStudent {
  id: string;
  userId: string;
  name: string;
  studentId?: string;
  email?: string;
  avatar?: string;
  departmentId: string;
  departmentName?: string;
  level: string; // e.g. 'الفرقة الرابعة', 'الفرقة الثالثة', 'Year 3 (Junior)'
  semester?: string;
  achievementTitle: string; // e.g. 'المركز الأول في هاكاثون الابتكار الهندسي 2026'
  category: HonorCategory;
  description: string; // تفاصيل وشرح الإنجاز وما تم تحقيقه
  honoredDate: string; // e.g. 'مايو 2026' or '2026-05-15'
  academicYear: string; // e.g. '2025/2026'
  gpaOrMetric?: string; // e.g. 'GPA: 3.98' or 'المركز الأول 🥇' or 'Best Paper Award'
  badgeLabel?: string; // e.g. 'الأول على الدفعة', 'بطل المسابقة', 'مبتكر متميز'
  certificateUrl?: string; // رابط الشهادة أو وثيقة التكريم
  projectUrl?: string; // رابط المشروع أو الكود أو الورقة البحثية
  supervisorName?: string; // المشرف الأكاديمي (e.g. 'أ.د. طارق الحديدي')
  featured: boolean; // تثبيت في المنصة الرئيسية Spotlight
  applauseCount: number; // إجمالي التهنئات والتصفيق 👏
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}
