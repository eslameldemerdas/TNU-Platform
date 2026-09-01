import React, { useState, useEffect, useRef } from 'react';
import { StudyFile, UserRole, Course, Department, Announcement, CampusEvent, EventCategory, UserProfile, SupervisorScope, Assignment, ScheduleItem } from '../../types';
import { ShieldAlert, CheckCircle2, XCircle, FileText, Plus, Activity, Users, Lock, ShieldCheck, RefreshCw, Search, Megaphone, Pin, Trash2, Send, AlertTriangle, Bell, Sparkles, Calendar, Edit3, Eye, UserCheck, Download, Check, Layers, Clock, MapPin, Tag, Mail, Phone, Award, UserPlus, Settings, CheckSquare, Square, Filter, ChevronDown, Building2, Upload } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { INITIAL_SUPERVISORS, ALL_MOCK_USERS } from '../../data/mockData';
import { getSupervisorScopeLabel } from '../../utils/permissionUtils';
import { getCourseCoverSvg } from '../../utils/courseCovers';

import { CourseFormModal } from './CourseFormModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { SupervisorAssignmentManager } from './SupervisorAssignmentManager';
import { SupervisorScheduleManager } from './SupervisorScheduleManager';
import { AdminAuditDashboard } from './AdminAuditDashboard';
import { HonorRollManager } from './HonorRollManager';
import { getAuthHeaders } from '../../lib/storage';

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  studentId: string;
  role: UserRole;
  supervisorTitle?: string;
  supervisorScope?: SupervisorScope;
  universityId?: string;
  facultyId?: string;
  departmentId: string;
  level: string;
  semester?: string;
  points: number;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

interface AdminModerationViewProps {
  userRole: UserRole;
  currentUser?: UserProfile | null;
  pendingFiles: StudyFile[];
  courses: Course[];
  departments: Department[];
  announcements?: Announcement[];
  events?: CampusEvent[];
  assignments?: Assignment[];
  schedule?: ScheduleItem[];
  onApproveFile: (fileId: string) => void;
  onRejectFile: (fileId: string, reason: string) => void;
  onAddCourse: (course: Partial<Course>) => void;
  onUpdateCourse?: (courseId: string, courseData: Partial<Course>) => void;
  onDeleteCourse?: (courseId: string) => void;
  onAddAnnouncement?: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  onDeleteAnnouncement?: (announcementId: string) => void;
  onTogglePinAnnouncement?: (announcementId: string) => void;
  onAddEvent?: (event: Omit<CampusEvent, 'id' | 'rsvpCount'>) => void;
  onUpdateEvent?: (eventId: string, event: Partial<CampusEvent>) => void;
  onDeleteEvent?: (eventId: string) => void;
  onToggleEventStatus?: (eventId: string) => void;
  onAddAssignment?: (asgn: Partial<Assignment>) => void;
  onUpdateAssignment?: (id: string, asgn: Partial<Assignment>) => void;
  onDeleteAssignment?: (id: string) => void;
  onAddScheduleItem?: (item: Omit<ScheduleItem, 'id'>) => void;
  onUpdateScheduleItem?: (id: string, item: Partial<ScheduleItem>) => void;
  onDeleteScheduleItem?: (id: string) => void;
}

export const AdminModerationView: React.FC<AdminModerationViewProps> = ({
  userRole,
  currentUser,
  pendingFiles,
  courses,
  departments,
  announcements = [],
  events = [],
  assignments = [],
  schedule = [],
  onApproveFile,
  onRejectFile,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onTogglePinAnnouncement,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleEventStatus,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onAddScheduleItem,
  onUpdateScheduleItem,
  onDeleteScheduleItem
}) => {
  const { t, language } = useTranslation();
  
  // Tab control: super_admin & moderators get 'queue', 'courses', 'users', 'supervisors', 'assignments', 'schedule', 'announcements', 'events', 'honor_board', 'audit'.
  const [activeTab, setActiveTab] = useState<'queue' | 'courses' | 'users' | 'supervisors' | 'assignments' | 'schedule' | 'announcements' | 'events' | 'honor_board' | 'audit'>('supervisors');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Course Management State
  const [courseFormModalOpen, setCourseFormModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [cCode, setCCode] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cDeptId, setCDeptId] = useState(departments[0]?.id || 'dept-cmp-01');
  const [cInstructor, setCInstructor] = useState('');
  const [cCredits, setCCredits] = useState(3);

  // New Announcement Form State
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancPriority, setAncPriority] = useState<'urgent' | 'normal' | 'low'>('urgent');
  const [ancScope, setAncScope] = useState<'university' | 'faculty' | 'department'>('faculty');
  const [ancTargetDept, setAncTargetDept] = useState<string>(departments[0]?.id || '');
  const [ancIsPinned, setAncIsPinned] = useState(true);

  // Event Management State & Form
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [viewRegistrantsEvent, setViewRegistrantsEvent] = useState<CampusEvent | null>(null);

  const [evtTitle, setEvtTitle] = useState('');
  const [evtCategory, setEvtCategory] = useState<EventCategory>('workshop');
  const [evtOrganizer, setEvtOrganizer] = useState('عمادة الكلية ونادي التكنولوجيا');
  const [evtDate, setEvtDate] = useState('2026-08-28');
  const [evtTime, setEvtTime] = useState('10:00 - 13:00');
  const [evtLocation, setEvtLocation] = useState('المدرج المركزي - كلية الهندسة');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtSpeaker, setEvtSpeaker] = useState('');
  const [evtSpeakerTitle, setEvtSpeakerTitle] = useState('');
  const [evtMaxCapacity, setEvtMaxCapacity] = useState<number>(50);
  const [evtTargetAudience, setEvtTargetAudience] = useState('جميع طلاب الهندسة');
  const [evtRequirements, setEvtRequirements] = useState('');
  const [evtContactEmail, setEvtContactEmail] = useState('events@eng.gnu.edu');
  const [evtContactPhone, setEvtContactPhone] = useState('+20 100 000 1122');
  const [evtTags, setEvtTags] = useState('Engineering, Workshop');
  const [evtImage, setEvtImage] = useState('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80');
  const [evtStatus, setEvtStatus] = useState<'published' | 'draft'>('published');

  const evtImageInputRef = useRef<HTMLInputElement>(null);
  const [isEvtImageDragging, setIsEvtImageDragging] = useState(false);
  const [evtImageFileName, setEvtImageFileName] = useState('');

  const handleEvtImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)');
      return;
    }
    setEvtImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setEvtImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Preset Helper for Activity Templates
  const applyEventTemplate = (type: 'workshop' | 'hackathon' | 'field_trip' | 'seminar' | 'competition') => {
    if (type === 'workshop') {
      setEvtTitle('ورشة عمل برمجية: تطوير برامج الأنظمة المدمجة مع C++20');
      setEvtCategory('workshop');
      setEvtOrganizer('نادي الهندسة والذكاء الاصطناعي');
      setEvtTime('10:00 - 13:00');
      setEvtLocation('معمل الحاسبات المركزي A302');
      setEvtDescription('ورشة تدريبية تطبيقية تغطي تصميم البرامج عالية الكفاءة للمتحكمات الدقيقة وتطبيق معايير C++ Modern المتقدمة.');
      setEvtSpeaker('د. مهندس طارق الخولي');
      setEvtSpeakerTitle('أستاذ الأنظمة المدمجة بجامعة GNUE');
      setEvtMaxCapacity(40);
      setEvtTargetAudience('طلاب السنة الثانية والثالثة - حاسبات وميكاترونكس');
      setEvtRequirements('احضار الحاسوب المحمول مع تثبيت بيئة VS Code وCompiler C++');
      setEvtTags('C++, Embedded Systems, VSCode, Coding');
      setEvtImage('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80');
    } else if (type === 'hackathon') {
      setEvtTitle('هكاثون الابتكار الهندسي وتطبيقات الذكاء الاصطناعي');
      setEvtCategory('hackathon');
      setEvtOrganizer('عمادة الكلية وجمعية IEEE');
      setEvtTime('09:00 - 21:00 (على مدار يومين)');
      setEvtLocation('المدرج الكبير والبهو الرئيسي للكلية');
      setEvtDescription('منافسة هندسية لتطوير حلول مبتكرة في مجالات الطاقة النظيفة، الروبوتات، والمدن الذكية باستخدام الذكاء الاصطناعي.');
      setEvtSpeaker('لجنة تحكيم من كبار خبراء الصناعة والجامعة');
      setEvtSpeakerTitle('خبراء ومستشارون تقنيون');
      setEvtMaxCapacity(120);
      setEvtTargetAudience('جميع الطلاب ومجموعات مشاريع التخرج');
      setEvtRequirements('تشكيل فريق من 3-5 طلاب، وفكرة مشروع أولي');
      setEvtTags('Hackathon, AI, Innovation, IEEE, Competition');
      setEvtImage('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80');
    } else if (type === 'field_trip') {
      setEvtTitle('رحلة ميدانية علمية: زيارة مجمع المصانع والخطوط الأوتوماتيكية');
      setEvtCategory('field_trip');
      setEvtOrganizer('إدارة الأنشطة الطلابية ورعاية الشباب');
      setEvtTime('08:00 - 16:00');
      setEvtLocation('التجمع أمام البوابة الرئيسية للكلية - التحرك بالأوتوبيسات');
      setEvtDescription('زيارة ميدانية موجهة للتعرف على خطوط الإنتاج الحديثة وروبوتات التجميع الصناعية وأنظمة السيطرة والجودة.');
      setEvtSpeaker('م. أحمد القاضي');
      setEvtSpeakerTitle('مدير الصيانة والجودة بالمجمع الصناعي');
      setEvtMaxCapacity(35);
      setEvtTargetAudience('طلاب قسم الميكاترونكس والكهرباء والإنتاج');
      setEvtRequirements('الالتزام بحذاء السلامة (Safety Shoes) والزي الرسمي للكلية');
      setEvtTags('Field Trip, Industrial, Robotics, Automation');
      setEvtImage('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80');
    } else if (type === 'seminar') {
      setEvtTitle('ندوة علمية: مستقبل هندسة الحاسبات وسوق العمل العالمي لعام 2026');
      setEvtCategory('guest_lecture');
      setEvtOrganizer('قسم هندسة الحاسبات ومكتب العلاقات الخرجين');
      setEvtTime('12:00 - 14:00');
      setEvtLocation('قاعة المؤتمرات 101');
      setEvtDescription('ندوة حوارية تفاعلية تتناول أهم المهارات المطلوبة في سوق العمل الحديث، التحضير لمقابلات العمل الفنية، وفرص المنح الدراسية بالخارج.');
      setEvtSpeaker('د. كريم عبد الرحمن');
      setEvtSpeakerTitle('كبير مهندسي البرمجيات بشركة عالمية');
      setEvtMaxCapacity(100);
      setEvtTargetAudience('طلاب السنوات النهائية والخرجين الجدد');
      setEvtRequirements('التسجيل المسبق والحضور بالموعد المحدد');
      setEvtTags('Career, Seminar, Computer Engineering, Future');
      setEvtImage('https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80');
    } else if (type === 'competition') {
      setEvtTitle('مسابقة أفضل مشروع ابتكاري في الميكاترونكس والروبوتات');
      setEvtCategory('competition');
      setEvtOrganizer('قسم الميكاترونكس والجمعية العملية');
      setEvtTime('11:00 - 15:00');
      setEvtLocation('معمل الروبوتات المتقدمة B104');
      setEvtDescription('معرض ومسابقة سنوية لعرض أفضل مشاريع الطلاب والأجهزة الروبوتية المبتكرة مع تقديم جوائز مالية وشهادات تقدير.');
      setEvtSpeaker('د. سارة جنكينز');
      setEvtSpeakerTitle('رئيس قسم الميكاترونكس');
      setEvtMaxCapacity(60);
      setEvtTargetAudience('فرق المشاريع الطلابية من جميع السنوات');
      setEvtRequirements('تقديم ملخص تنفيذي للمشروع ونسخة تجريبية تعمل');
      setEvtTags('Robotics, Mechatronics, Innovation, Awards');
      setEvtImage('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80');
    }
  };

  // User Directory & Role Management State
  const [userList, setUserList] = useState<AdminUserRecord[]>(() =>
    ALL_MOCK_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phoneNumber: '+20 100 000 0000',
      studentId: u.studentId,
      role: u.role,
      supervisorTitle: u.supervisorTitle,
      supervisorScope: u.supervisorScope,
      universityId: u.universityId,
      facultyId: u.facultyId,
      departmentId: u.departmentId,
      level: u.level,
      semester: u.semester,
      avatar: u.avatar,
      bio: u.bio,
      points: u.points,
      createdAt: u.createdAt
    }))
  );
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userDeptFilter, setUserDeptFilter] = useState<string>('all');
  const [userLevelFilter, setUserLevelFilter] = useState<string>('all');
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserRecord | null>(null);
  const [pendingNewRole, setPendingNewRole] = useState<UserRole>('student');
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState<{ id: string; name: string } | null>(null);
  const [roleMessage, setRoleMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Supervisor Scope & Specialization Management State
  const [supervisorsList, setSupervisorsList] = useState<UserProfile[]>(INITIAL_SUPERVISORS);
  const [supervisorFilterDept, setSupervisorFilterDept] = useState<string>('all');
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<UserProfile | null>(null);

  // Supervisor Form state
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supTitle, setSupTitle] = useState('');
  const [supDeptId, setSupDeptId] = useState('dept-cmp');
  const [supLevel, setSupLevel] = useState<string>('all');
  const [supCanManageCourses, setSupCanManageCourses] = useState(true);
  const [supCanUploadResources, setSupCanUploadResources] = useState(true);
  const [supCanUploadCertificates, setSupCanUploadCertificates] = useState(true);
  const [supCanManageAssignments, setSupCanManageAssignments] = useState(true);
  const [supCanModerateDiscussions, setSupCanModerateDiscussions] = useState(true);
  const [supCanPublishAnnouncements, setSupCanPublishAnnouncements] = useState(true);

  const handleOpenNewSupervisorModal = () => {
    setEditingSupervisor(null);
    setSupName('');
    setSupEmail('');
    setSupTitle('أخصائي أكاديمي للقسم');
    setSupDeptId('dept-cmp');
    setSupLevel('all');
    setSupCanManageCourses(true);
    setSupCanUploadResources(true);
    setSupCanUploadCertificates(true);
    setSupCanManageAssignments(true);
    setSupCanModerateDiscussions(true);
    setSupCanPublishAnnouncements(true);
    setShowSupervisorModal(true);
  };

  const handleEditSupervisorClick = (sup: UserProfile) => {
    setEditingSupervisor(sup);
    setSupName(sup.name);
    setSupEmail(sup.email);
    setSupTitle(sup.supervisorTitle || 'مشرف أخصائي');
    setSupDeptId(sup.supervisorScope?.departmentId || sup.departmentId || 'dept-cmp');
    setSupLevel(sup.supervisorScope?.level || 'all');
    setSupCanManageCourses(sup.supervisorScope?.canManageCourses ?? true);
    setSupCanUploadResources(sup.supervisorScope?.canUploadResources ?? true);
    setSupCanUploadCertificates(sup.supervisorScope?.canUploadCertificates ?? true);
    setSupCanManageAssignments(sup.supervisorScope?.canManageAssignments ?? true);
    setSupCanModerateDiscussions(sup.supervisorScope?.canModerateDiscussions ?? true);
    setSupCanPublishAnnouncements(sup.supervisorScope?.canPublishAnnouncements ?? true);
    setShowSupervisorModal(true);
  };

  const handleSaveSupervisorScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supEmail.trim()) return;

    const newScope: SupervisorScope = {
      departmentId: supDeptId,
      level: supLevel as any,
      canManageCourses: supCanManageCourses,
      canUploadResources: supCanUploadResources,
      canUploadCertificates: supCanUploadCertificates,
      canManageAssignments: supCanManageAssignments,
      canModerateDiscussions: supCanModerateDiscussions,
      canPublishAnnouncements: supCanPublishAnnouncements
    };

    if (editingSupervisor) {
      setSupervisorsList((prev) =>
        prev.map((s) =>
          s.id === editingSupervisor.id
            ? {
                ...s,
                name: supName.trim(),
                email: supEmail.trim(),
                supervisorTitle: supTitle.trim(),
                supervisorScope: newScope
              }
            : s
        )
      );
      setRoleMessage({ text: `تم تحديث صلاحيات ونطاق إشراف (${supName}) بنجاح!`, type: 'success' });
    } else {
      const newSup: UserProfile = {
        id: `usr-sup-${Date.now()}`,
        name: supName.trim(),
        email: supEmail.trim(),
        studentId: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'supervisor',
        supervisorTitle: supTitle.trim() || 'مشرف أخصائي للقسم',
        supervisorScope: newScope,
        universityId: 'univ-1',
        facultyId: 'fac-1',
        departmentId: supDeptId === 'all' ? 'dept-cmp' : supDeptId,
        level: supLevel === 'all' ? 'Year 1 (Freshman)' : (supLevel as any),
        semester: 'Fall 2026',
        avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
        bio: `أخصائي مسند لقسم ${supDeptId}`,
        points: 1000,
        badges: [],
        savedBookmarks: [],
        enrolledCourseIds: [],
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSupervisorsList((prev) => [newSup, ...prev]);
      setRoleMessage({ text: `تم تعيين المشرف الأخصائي الجديد (${supName}) بنجاح!`, type: 'success' });
    }

    try {
      await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          targetUserId: editingSupervisor?.id,
          targetEmail: supEmail.trim(),
          newRole: 'supervisor',
          supervisorTitle: supTitle.trim(),
          supervisorScope: newScope
        })
      });
    } catch (e) {
      // Local state is updated
    }

    setShowSupervisorModal(false);
    setTimeout(() => setRoleMessage(null), 4000);
  };

  const handleRemoveSupervisor = (supId: string, supName: string) => {
    setSupervisorToDelete({ id: supId, name: supName });
  };

  const handleConfirmRemoveSupervisor = () => {
    if (!supervisorToDelete) return;
    const { id: supId, name: supName } = supervisorToDelete;
    setSupervisorsList((prev) => prev.filter((s) => s.id !== supId));
    setRoleMessage({ text: `تم إلغاء صفة المشرف عن (${supName}) وعودته كطالب عادي.`, type: 'success' });
    setSupervisorToDelete(null);
    setTimeout(() => setRoleMessage(null), 4000);
  };

  const fetchUsers = async () => {
    if (userRole === 'student') return;

    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const userMap = new Map<string, AdminUserRecord>();

      // Pre-fill with local mock directory (students, supervisors, admins) keyed uniquely by ID
      ALL_MOCK_USERS.forEach((u) => {
        userMap.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          phoneNumber: '+20 100 000 0000',
          studentId: u.studentId,
          role: u.role,
          supervisorTitle: u.supervisorTitle,
          supervisorScope: u.supervisorScope,
          universityId: u.universityId,
          facultyId: u.facultyId,
          departmentId: u.departmentId,
          level: u.level,
          semester: u.semester,
          avatar: u.avatar,
          bio: u.bio,
          points: u.points,
          createdAt: u.createdAt
        });
      });

      if (res.ok) {
        const data = await res.json();
        const serverUsers = data.users || [];
        serverUsers.forEach((u: any) => {
          if (u) {
            // Find existing key by ID first, then by email
            let targetKey = u.id;
            if (!targetKey || !userMap.has(targetKey)) {
              if (u.email) {
                for (const [k, val] of userMap.entries()) {
                  if (val.email.toLowerCase() === u.email.toLowerCase()) {
                    targetKey = k;
                    break;
                  }
                }
              }
            }
            const finalKey = targetKey || u.id || u.email;
            if (finalKey) {
              const existing = userMap.get(finalKey);
              userMap.set(finalKey, {
                ...existing,
                ...u,
                id: u.id || existing?.id || finalKey
              });
            }
          }
        });
      }

      setUserList(Array.from(userMap.values()));
    } catch {
      // Graceful fallback to local mock directory without error noise
      const fallbackMap = new Map<string, AdminUserRecord>();
      ALL_MOCK_USERS.forEach((u) => {
        fallbackMap.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          phoneNumber: '+20 100 000 0000',
          studentId: u.studentId,
          role: u.role,
          supervisorTitle: u.supervisorTitle,
          supervisorScope: u.supervisorScope,
          universityId: u.universityId,
          facultyId: u.facultyId,
          departmentId: u.departmentId,
          level: u.level,
          semester: u.semester,
          avatar: u.avatar,
          bio: u.bio,
          points: u.points,
          createdAt: u.createdAt
        });
      });
      setUserList(Array.from(fallbackMap.values()));
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (userRole !== 'student') {
      fetchUsers();
    }
  }, [userRole]);

  useEffect(() => {
    if (activeTab === 'users' && userRole !== 'student') {
      fetchUsers();
    }
  }, [activeTab, userRole]);

  // Handle non-admin role gating (Student Access Denied)
  if (userRole === 'student') {
    return (
      <div className="p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          {t.admin.accessDeniedTitle}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {t.admin.accessDeniedMessage}
        </p>
      </div>
    );
  }

  const handleReject = (fileId: string) => {
    onRejectFile(fileId, rejectReason || 'Content does not meet quality standards.');
    setSelectedFileId(null);
    setRejectReason('');
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCode || !cTitle) return;
    onAddCourse({
      code: cCode,
      title: cTitle,
      departmentId: cDeptId,
      instructor: cInstructor || 'Dr. Assigned Professor',
      instructorEmail: 'prof@eng.gnu.edu',
      credits: cCredits,
      level: 'Year 2 (Sophomore)',
      semester: 'Fall 2026',
      scheduleDayTime: 'Mon/Wed 10:00 - 11:30 AM',
      location: 'Hall B',
      description: 'Newly registered faculty course.',
      prerequisites: [],
      syllabus: ['Module 1: Foundations'],
      gradingScheme: [{ category: 'Final Exam', weight: 100 }],
      bannerImage: getCourseCoverSvg(cCode),
      fileCount: 0,
      discussionCount: 0
    });
    setCCode('');
    setCTitle('');
    setCourseFormModalOpen(false);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUserForRole) return;
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          targetUserId: selectedUserForRole.id,
          targetEmail: selectedUserForRole.email,
          newRole: pendingNewRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRoleMessage({ text: data.message || t.admin.roleUpdatedSuccess, type: 'success' });
        // Update local list
        setUserList((prev) =>
          prev.map((u) => (u.id === selectedUserForRole.id || u.email === selectedUserForRole.email ? { ...u, role: pendingNewRole } : u))
        );
      } else {
        const errorMsg = typeof data.error === 'string'
          ? data.error
          : (data.error?.message || data.message || 'Failed to update user role');
        setRoleMessage({ text: String(errorMsg), type: 'error' });
      }
    } catch (e: any) {
      setRoleMessage({ text: 'Network or server error updating role.', type: 'error' });
    } finally {
      setShowRoleConfirmModal(false);
      setSelectedUserForRole(null);
    }
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;

    if (onAddAnnouncement) {
      onAddAnnouncement({
        title: ancTitle.trim(),
        content: ancContent.trim(),
        priority: ancPriority,
        scope: ancScope,
        targetId: ancScope === 'department' ? ancTargetDept : undefined,
        isPinned: ancIsPinned,
        authorName: userRole === 'super_admin' ? (language === 'ar' ? 'إدارة الكلية' : 'Faculty Administration') : (language === 'ar' ? 'عمادة ومجلس الإشراف' : 'Supervisory Board'),
        authorRole: userRole
      });

      setAncTitle('');
      setAncContent('');
      setAncPriority('urgent');
      setAncIsPinned(true);
      setRoleMessage({ text: t.admin.announcementPublished, type: 'success' });
      setTimeout(() => setRoleMessage(null), 5000);
    }
  };

  const handleOpenNewEventModal = () => {
    setEditingEventId(null);
    setEvtTitle('');
    setEvtCategory('workshop');
    setEvtOrganizer('عمادة الكلية ونادي التكنولوجيا');
    setEvtDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    setEvtTime('10:00 - 13:00');
    setEvtLocation('المدرج المركزي - كلية الهندسة');
    setEvtDescription('');
    setEvtSpeaker('');
    setEvtSpeakerTitle('');
    setEvtMaxCapacity(50);
    setEvtTargetAudience('جميع طلاب الهندسة');
    setEvtRequirements('');
    setEvtContactEmail('events@eng.gnu.edu');
    setEvtContactPhone('+20 100 000 1122');
    setEvtTags('Engineering, Activity');
    setEvtImage('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80');
    setEvtStatus('published');
    setShowEventModal(true);
  };

  const handleEditEventClick = (event: CampusEvent) => {
    setEditingEventId(event.id);
    setEvtTitle(event.title);
    setEvtCategory(event.category || 'workshop');
    setEvtOrganizer(event.organizer);
    setEvtDate(event.date);
    setEvtTime(event.time);
    setEvtLocation(event.location);
    setEvtDescription(event.description);
    setEvtSpeaker(event.speaker || '');
    setEvtSpeakerTitle(event.speakerTitle || '');
    setEvtMaxCapacity(event.maxCapacity || 50);
    setEvtTargetAudience(event.targetAudience || 'جميع طلاب الهندسة');
    setEvtRequirements(event.requirements || '');
    setEvtContactEmail(event.contactEmail || 'events@eng.gnu.edu');
    setEvtContactPhone(event.contactPhone || '');
    setEvtTags(event.tags ? event.tags.join(', ') : '');
    setEvtImage(event.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80');
    setEvtStatus(event.status === 'draft' ? 'draft' : 'published');
    setShowEventModal(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtLocation.trim()) return;

    const parsedTags = evtTags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingEventId) {
      if (onUpdateEvent) {
        onUpdateEvent(editingEventId, {
          title: evtTitle.trim(),
          category: evtCategory,
          organizer: evtOrganizer.trim(),
          date: evtDate,
          time: evtTime,
          location: evtLocation.trim(),
          description: evtDescription.trim(),
          speaker: evtSpeaker.trim() || undefined,
          speakerTitle: evtSpeakerTitle.trim() || undefined,
          maxCapacity: evtMaxCapacity,
          targetAudience: evtTargetAudience.trim() || undefined,
          requirements: evtRequirements.trim() || undefined,
          contactEmail: evtContactEmail.trim() || undefined,
          contactPhone: evtContactPhone.trim() || undefined,
          tags: parsedTags,
          image: evtImage,
          status: evtStatus
        });
        setRoleMessage({ text: 'تم تحديث بيانات الفعالية بنجاح!', type: 'success' });
      }
    } else {
      if (onAddEvent) {
        onAddEvent({
          title: evtTitle.trim(),
          category: evtCategory,
          organizer: evtOrganizer.trim(),
          date: evtDate,
          time: evtTime,
          location: evtLocation.trim(),
          description: evtDescription.trim(),
          speaker: evtSpeaker.trim() || undefined,
          speakerTitle: evtSpeakerTitle.trim() || undefined,
          maxCapacity: evtMaxCapacity,
          targetAudience: evtTargetAudience.trim() || undefined,
          requirements: evtRequirements.trim() || undefined,
          contactEmail: evtContactEmail.trim() || undefined,
          contactPhone: evtContactPhone.trim() || undefined,
          tags: parsedTags,
          image: evtImage,
          status: evtStatus,
          registeredStudents: []
        });
        setRoleMessage({ text: 'تم نشر الفعالية/النشاط الطلابي بنجاح!', type: 'success' });
      }
    }

    setShowEventModal(false);
    setTimeout(() => setRoleMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Role Banner */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 text-amber-300 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {userRole === 'super_admin' ? t.admin.promoteSuperAdmin : userRole.replace('_', ' ')} - {t.admin.panelTitle}
            </h2>
            <p className="text-xs text-slate-300">
              {t.admin.panelSubtitle}
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Role: {userRole}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'queue'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t.admin.queueTab} ({pendingFiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'courses'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.coursesTab} ({courses.length})</span>
        </button>

        {/* Supervisors & Specialization Management Tab */}
        <button
          onClick={() => setActiveTab('supervisors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'supervisors'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-300" />
          <span>إدارة المشرفين والتخصصات ({supervisorsList.length})</span>
        </button>

        {/* Assignments Management Tab */}
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'assignments'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-purple-300" />
          <span>التكليفات والواجبات ({assignments.length})</span>
        </button>

        {/* Timetable Schedule Management Tab */}
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-300" />
          <span>جدول الحضور والمحاضرات ({schedule.length})</span>
        </button>

        {/* Users Division Tab: Accessible to Overseers & Admins */}
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.admin.usersTab}</span>
        </button>

        {/* Official Announcements Tab */}
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'announcements'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>{t.admin.announcementsTab} ({announcements.length})</span>
        </button>

        {/* Student Activities & Events Tab */}
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'events'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>إدارة الأنشطة والفعاليات ({events.length})</span>
        </button>

        {/* Honor Roll & Achievers Management Tab */}
        <button
          onClick={() => setActiveTab('honor_board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'honor_board'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>لوحة الشرف والطلاب المتميزين</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{t.admin.auditTab}</span>
        </button>
      </div>

      {roleMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            roleMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <span>
            {typeof roleMessage.text === 'object'
              ? (roleMessage.text as any)?.message || JSON.stringify(roleMessage.text)
              : String(roleMessage.text)}
          </span>
          <button onClick={() => setRoleMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* 1. MODERATION QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {t.admin.pendingQueue}
          </h3>

          {pendingFiles.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Moderation Queue Clear</h4>
              <p className="text-xs text-slate-400">All submitted study files have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-slate-900 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          Pending Approval
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Uploader: {file.uploaderName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{file.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{file.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => onApproveFile(file.id)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all min-h-[44px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.common.approve}</span>
                      </button>

                      <button
                        onClick={() => setSelectedFileId(file.id)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all min-h-[44px]"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{t.common.reject}</span>
                      </button>
                    </div>
                  </div>

                  {selectedFileId === file.id && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 space-y-2 text-xs">
                      <p className="font-bold text-rose-950 dark:text-rose-200">Rejection Reason Feedback:</p>
                      <input
                        type="text"
                        placeholder="State reason (e.g., Incomplete solutions, blurry scan...)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedFileId(null)} className="px-2.5 py-1 text-slate-500">
                          {t.common.cancel}
                        </button>
                        <button
                          onClick={() => handleReject(file.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. COURSE REGISTRY */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                إدارة وسجل المقررات الدراسية ({courses.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                صلاحيات كاملة للسوبر أدمن لإضافة المواد الهندسية، تعديل الساعات والأساتذة أو حذف المقرر نهائياً.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCourse(null);
                setCourseFormModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة مقرر دراسي جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => {
              const deptName = departments.find((d) => d.id === c.departmentId)?.name || 'كلية الهندسة';
              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {c.code}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {c.credits} ساعات معتمدة • {c.level}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {c.description || 'لا يوجد وصف للمادة'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>القسم: <strong>{deptName}</strong></span>
                      <span>الأستاذ: <strong>{c.instructor}</strong></span>
                    </div>
                  </div>

                  {/* Actions for Super Admin & Department Admin */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setEditingCourse(c);
                        setCourseFormModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>تعديل المادة</span>
                    </button>

                    <button
                      onClick={() => setDeletingCourse(c)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUPERVISORS & SPECIALIZATION MANAGEMENT TAB */}
      {activeTab === 'supervisors' && (
        <div className="space-y-6 animate-fade-in">
          {/* Metrics Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300">
              <span className="text-[11px] font-extrabold uppercase block text-purple-600 dark:text-purple-400">إجمالي المشرفين الأخصائيين</span>
              <span className="text-2xl font-black">{supervisorsList.length}</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300">
              <span className="text-[11px] font-extrabold uppercase block text-blue-600 dark:text-blue-400">مشرفو قسم الحاسبات</span>
              <span className="text-2xl font-black">
                {supervisorsList.filter((s) => s.supervisorScope?.departmentId === 'dept-cmp' || s.departmentId === 'dept-cmp').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <span className="text-[11px] font-extrabold uppercase block text-amber-600 dark:text-amber-400">مشرفو قسم الميكاترونكس</span>
              <span className="text-2xl font-black">
                {supervisorsList.filter((s) => s.supervisorScope?.departmentId === 'dept-mtr' || s.departmentId === 'dept-mtr').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <span className="text-[11px] font-extrabold uppercase block text-emerald-600 dark:text-emerald-400">مشرفو السنة الأولى فقط</span>
              <span className="text-2xl font-black">
                {supervisorsList.filter((s) => s.supervisorScope?.level && s.supervisorScope.level.includes('Year 1')).length}
              </span>
            </div>
          </div>

          {/* Department Filter & Actions Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-purple-500" />
              <span>تصفية حسب التخصص:</span>
              <select
                value={supervisorFilterDept}
                onChange={(e) => setSupervisorFilterDept(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">كافة الأقسام التخصصية ({supervisorsList.length})</option>
                <option value="dept-cmp">قسم هندسة الحاسبات والذكاء الاصطناعي</option>
                <option value="dept-mtr">قسم هندسة الميكاترونكس والروبوتات</option>
              </select>
            </div>

            <button
              onClick={handleOpenNewSupervisorModal}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ تعيين مشرف أخصائي جديد</span>
            </button>
          </div>

          {/* Supervisors Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supervisorsList
              .filter((s) => {
                if (supervisorFilterDept === 'all') return true;
                const d = s.supervisorScope?.departmentId || s.departmentId;
                return d === supervisorFilterDept || d === `${supervisorFilterDept}-01` || d === 'all';
              })
              .map((sup) => {
                const isSuper = sup.role === 'super_admin';
                const scope = sup.supervisorScope;

                const sameDeptSupervisors = supervisorsList.filter(
                  (other) =>
                    other.id !== sup.id &&
                    (other.supervisorScope?.departmentId === scope?.departmentId ||
                      other.departmentId === sup.departmentId)
                );
                const hasMultipleSupervisors = sameDeptSupervisors.length > 0 && !isSuper;

                return (
                  <div
                    key={sup.id}
                    className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 hover:border-purple-500/40 transition-all relative"
                  >
                    {/* Top User Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={sup.avatar}
                          alt={sup.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-500/30 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {sup.name}
                            </h4>
                            {isSuper && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                {language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                            {sup.supervisorTitle || getSupervisorScopeLabel(sup, departments)}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {sup.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditSupervisorClick(sup)}
                          title="تعديل نطاق الصلاحيات"
                          className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all text-xs flex items-center gap-1 font-bold"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        {!isSuper && (
                          <button
                            onClick={() => handleRemoveSupervisor(sup.id, sup.name)}
                            title="إلغاء صفة المشرف"
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scope & Specialization Badges */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>النطاق والتخصص المسند:</span>
                        {hasMultipleSupervisors && (
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            👥 يوجد {sameDeptSupervisors.length + 1} مشرفين لهذا التخصص
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold text-xs flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          {scope?.departmentId === 'dept-cmp' || sup.departmentId === 'dept-cmp'
                            ? 'قسم هندسة الحاسبات'
                            : scope?.departmentId === 'dept-mtr' || sup.departmentId === 'dept-mtr'
                            ? 'قسم هندسة الميكاترونكس'
                            : 'كافة الأقسام بالكلية'}
                        </span>

                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-xs flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-purple-500" />
                          {scope?.level && scope.level !== 'all' ? scope.level : 'جميع السنوات والفرائق'}
                        </span>
                      </div>
                    </div>

                    {/* Permissions List */}
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-400 block">الصلاحيات الممنوحة داخل التخصص:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className={`flex items-center gap-1.5 font-semibold ${scope?.canManageCourses !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>تعديل المقررات والمنهج</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-semibold ${scope?.canUploadResources !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>رفع المراجع والمعامل</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-semibold ${scope?.canUploadCertificates !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>إسناد الشهادات الأكاديمية</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-semibold ${scope?.canPublishAnnouncements !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>نشر إعلانات القسم</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. USERS DIVISION (Users & Role Management) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Header & Overview Banner */}
          <div className="p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-slate-900/10 dark:bg-slate-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {t.admin.usersTab}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {t.admin.usersTabDesc}
                </p>
              </div>

              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* Privilege & Restriction Callout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">{language === 'ar' ? 'صلاحيات المشرف التعليمي:' : 'Academic Moderator Privileges:'}</strong>
                  <span className="text-[11px] opacity-90">{t.admin.simpleAdminPrivileges}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">{language === 'ar' ? 'ضوابط رفع المصادر والمواد:' : 'Resource Upload Regulations:'}</strong>
                  <span className="text-[11px] opacity-90">{t.admin.uploadRestrictedNotice}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t.admin.searchUsersPlaceholder}
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={userDeptFilter}
                onChange={(e) => setUserDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">جميع الأقسام</option>
                <option value="dept-cmp">💻 هندسة الحاسبات</option>
                <option value="dept-mtr">🤖 هندسة الميكاترونكس</option>
              </select>

              <select
                value={userLevelFilter}
                onChange={(e) => setUserLevelFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">جميع الفرق</option>
                <option value="Year 1 (Freshman)">السنة الأولى</option>
                <option value="Year 2 (Sophomore)">السنة الثانية</option>
              </select>

              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                <button
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    userRoleFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.admin.filterAllRoles} ({userList.length})
                </button>
                <button
                  onClick={() => setUserRoleFilter('student')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    userRoleFilter === 'student'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.admin.filterStudents} ({userList.filter((u) => u.role === 'student').length})
                </button>
                <button
                  onClick={() => setUserRoleFilter('admins')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    userRoleFilter === 'admins'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.admin.filterAdmins} ({userList.filter((u) => u.role !== 'student').length})
                </button>
              </div>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {userList
              .filter((u) => {
                const matchesRole =
                  userRoleFilter === 'all'
                    ? true
                    : userRoleFilter === 'student'
                    ? u.role === 'student'
                    : u.role !== 'student';
                const matchesDept =
                  userDeptFilter === 'all' || !u.departmentId || u.departmentId === userDeptFilter;
                const matchesLevel =
                  userLevelFilter === 'all' || !u.level || u.level === userLevelFilter;
                const matchesQuery =
                  u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  (u.studentId && u.studentId.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                  (u.departmentId && u.departmentId.toLowerCase().includes(userSearchQuery.toLowerCase()));
                return matchesRole && matchesDept && matchesLevel && matchesQuery;
              })
              .map((u) => (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    {/* User Header Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.name}</h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{u.email}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ID: {u.studentId || u.id} • {u.phoneNumber || 'No Phone'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                          u.role === 'super_admin'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                            : u.role === 'department_admin'
                            ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
                            : u.role === 'moderator'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {u.role === 'super_admin'
                          ? (language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin')
                          : u.role === 'department_admin'
                          ? (language === 'ar' ? 'مسؤول قسم' : 'Dept Admin')
                          : u.role === 'supervisor'
                          ? (language === 'ar' ? 'مشرف أكاديمي' : 'Supervisor')
                          : u.role === 'moderator'
                          ? (language === 'ar' ? 'مشرف محتوى' : 'Moderator')
                          : (language === 'ar' ? 'طالب' : 'Student')}
                      </span>
                    </div>

                    {/* Academic & Bio Details */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                        <span>{language === 'ar' ? 'القسم:' : 'Department:'} <strong className="text-slate-900 dark:text-slate-100">{departments.find(d => d.id === u.departmentId)?.name || u.departmentId || (language === 'ar' ? 'كلية الهندسة' : 'Engineering')}</strong></span>
                        <span>{language === 'ar' ? 'المستوى:' : 'Level:'} <strong className="text-slate-900 dark:text-slate-100">{u.level || (language === 'ar' ? 'مقيد' : 'Enrolled')}</strong></span>
                      </div>
                      {u.bio && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                          "{u.bio}"
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span>{language === 'ar' ? 'النقاط:' : 'Points:'} <strong className="text-amber-500 tabular-nums">{u.points || 0} {language === 'ar' ? 'نقطة' : 'pts'}</strong></span>
                        <span>{language === 'ar' ? 'تاريخ الانضمام:' : 'Joined:'} {u.createdAt ? new Date(u.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : (language === 'ar' ? 'نشط' : 'Active')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Upgrade Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {u.role === 'student' ? (
                      <button
                        onClick={() => {
                          setSelectedUserForRole(u);
                          setPendingNewRole('moderator');
                          setShowRoleConfirmModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t.admin.upgradeToAdmin}</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'حساب بصلاحيات إدارية' : 'Admin Privileges Active'}
                        </span>
                        <select
                          value={u.role}
                          onChange={(e) => {
                            setSelectedUserForRole(u);
                            setPendingNewRole(e.target.value as UserRole);
                            setShowRoleConfirmModal(true);
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold cursor-pointer focus:outline-none"
                        >
                          <option value="student">{t.admin.demoteStudent}</option>
                          <option value="moderator">{t.admin.promoteModerator}</option>
                          <option value="department_admin">{t.admin.promoteDeptAdmin}</option>
                          <option value="super_admin">{t.admin.promoteSuperAdmin}</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Role Change Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={showRoleConfirmModal && Boolean(selectedUserForRole)}
        title={t.admin.confirmRoleChangeTitle}
        message={`${t.admin.confirmRoleChangeText} ${selectedUserForRole?.name} (${selectedUserForRole?.email}) من "${selectedUserForRole?.role}" إلى "${pendingNewRole}"؟`}
        confirmText={t.common.confirm}
        cancelText={t.common.cancel}
        variant="warning"
        onCancel={() => setShowRoleConfirmModal(false)}
        onConfirm={() => {
          handleConfirmRoleChange();
        }}
      />

      {/* OFFICIAL ANNOUNCEMENTS MANAGEMENT TAB */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-indigo-950/40 dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                <Megaphone className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{t.admin.officialAnnouncementsTitle}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Live Broadcast
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  قم بنشر إعلانات رسمية هامة يتم تعميمها فوراً على جميع الطلاب والمستخدمين وتظهر في الشاشات الرئيسية والحرم الجامعي.
                </p>
              </div>
            </div>
          </div>

          {/* Form to Create New Announcement */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Send className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {t.admin.publishAnnouncement}
              </h4>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.admin.announcementTitle} *
                  </label>
                  <input
                    type="text"
                    required
                    value={ancTitle}
                    onChange={(e) => setAncTitle(e.target.value)}
                    placeholder="مثال: تقديم المواعيد النهائية لتسليم مشاريع التخرج / بدء تسجيل المقررات"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.admin.announcementContent} *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ancContent}
                    onChange={(e) => setAncContent(e.target.value)}
                    placeholder="اكتب المحتوى التفصيلي للإعلان الرسمي الموجه لطلاب الكلية..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.admin.priority}
                  </label>
                  <select
                    value={ancPriority}
                    onChange={(e) => setAncPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="urgent">{t.admin.urgent} 🔥</option>
                    <option value="normal">{t.admin.normal} 📢</option>
                    <option value="low">{t.admin.low} 📌</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.admin.scope}
                  </label>
                  <select
                    value={ancScope}
                    onChange={(e) => setAncScope(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="faculty">{t.admin.allUsers}</option>
                    <option value="department">قسم أكاديمي معين</option>
                    <option value="university">الجامعة عامة</option>
                  </select>
                </div>

                {ancScope === 'department' && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      اختر القسم المستهدف
                    </label>
                    <select
                      value={ancTargetDept}
                      onChange={(e) => setAncTargetDept(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={ancIsPinned}
                    onChange={(e) => setAncIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>{t.admin.pinAnnouncement}</span>
                </label>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 min-h-[42px]"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>{t.admin.publishAnnouncement}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Published Announcements */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>سجل الإعلانات المنشورة ({announcements.length})</span>
              </h4>
            </div>

            {announcements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا يوجد إعلانات منشورة حتى الآن. قم بإضافة إعلان رسمي من النموذج أعلاه.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((anc) => (
                  <div
                    key={anc.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      anc.isPinned
                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {anc.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Pin className="w-3 h-3" />
                              <span>مثبت في الأعلى</span>
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              anc.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                                : anc.priority === 'normal'
                                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                                : 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30'
                            }`}
                          >
                            {anc.priority === 'urgent' ? '🔥 عاجل ورسمي' : anc.priority === 'normal' ? '📢 إعلان عادي' : '📌 تنويه'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {anc.date}
                          </span>
                        </div>

                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-1">
                          {anc.title}
                        </h5>

                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {anc.content}
                        </p>

                        <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>صادر عن: <strong>{anc.authorName}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onTogglePinAnnouncement && (
                          <button
                            onClick={() => onTogglePinAnnouncement(anc.id)}
                            title={anc.isPinned ? 'إلغاء التثبيت' : 'تثبيت الإعلان'}
                            className={`p-2 rounded-xl border text-xs transition-all ${
                              anc.isPinned
                                ? 'bg-amber-500 text-white border-amber-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteAnnouncement && (
                          <button
                            onClick={() => onDeleteAnnouncement(anc.id)}
                            title={t.admin.deleteAnnouncement}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. STUDENT ACTIVITIES & EVENTS MANAGEMENT */}
      {activeTab === 'events' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <span className="text-[11px] font-extrabold uppercase block text-emerald-600 dark:text-emerald-400">إجمالي الفعاليات والأنشطة</span>
              <span className="text-2xl font-black">{events.length}</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300">
              <span className="text-[11px] font-extrabold uppercase block text-indigo-600 dark:text-indigo-400">الفعاليات المنشورة للطلاب</span>
              <span className="text-2xl font-black">
                {events.filter((e) => e.status !== 'draft' && e.status !== 'cancelled').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <span className="text-[11px] font-extrabold uppercase block text-amber-600 dark:text-amber-400">المسودات المؤجلة</span>
              <span className="text-2xl font-black">
                {events.filter((e) => e.status === 'draft').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300">
              <span className="text-[11px] font-extrabold uppercase block text-purple-600 dark:text-purple-400">إجمالي المقاعد المسجلة</span>
              <span className="text-2xl font-black">
                {events.reduce((acc, curr) => acc + (curr.rsvpCount || 0), 0)}
              </span>
            </div>
          </div>

          {/* Presets & Add Action Bar */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <span>نماذج جاهزة لإضافة فعاليات وأنشطة طلابية جديدة</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اختر أحد القوالب الجاهزة أدناه للتعبئة التلقائية، أو انقر فوق إضافة نشاط لتخصيص كامل الحقول.
                </p>
              </div>

              <button
                onClick={handleOpenNewEventModal}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نشاط / فعالية جديدة</span>
              </button>
            </div>

            {/* Template Presets Buttons */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                اختر نموذجاً جاهزاً للتعبئة السريعة:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    applyEventTemplate('workshop');
                    setShowEventModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>💻 ورشة برمجية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    applyEventTemplate('hackathon');
                    setShowEventModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>⚡ هكاثون هندسي</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    applyEventTemplate('field_trip');
                    setShowEventModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>🚌 رحلة ميدانية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    applyEventTemplate('seminar');
                    setShowEventModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>🎤 ندوة خبير</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    applyEventTemplate('competition');
                    setShowEventModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>🏆 مسابقة ابتكار</span>
                </button>
              </div>
            </div>
          </div>

          {/* Events Table / Grid */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              سجل الفعاليات والأنشطة الطلابية
            </h4>

            {events.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا توجد أفعاليات أو أنشطة مضافة حالياً. انقر فوق "إضافة نشاط" لبدء الإضافة.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((evt) => {
                  const cap = evt.maxCapacity || 50;
                  const rsvps = evt.rsvpCount || 0;
                  const pct = Math.min(100, Math.round((rsvps / cap) * 100));

                  return (
                    <div
                      key={evt.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 relative group hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                              {evt.category}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                evt.status === 'draft'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              }`}
                            >
                              {evt.status === 'draft' ? 'مسودة' : 'منشور للطلاب'}
                            </span>
                          </div>

                          <h5 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                            {evt.title}
                          </h5>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {evt.description}
                          </p>
                        </div>

                        {evt.image && (
                          <img
                            src={evt.image}
                            alt={evt.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        )}
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{evt.date} ({evt.time})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      </div>

                      {/* Registrants Capacity Progress */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">الحضور المكتمل:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {rsvps} / {cap} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Admin Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                        <button
                          onClick={() => setViewRegistrantsEvent(evt)}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>عرض قائمة المسجلين ({evt.registeredStudents?.length || evt.rsvpCount})</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleEventStatus && onToggleEventStatus(evt.id)}
                            title="تبديل حالة النشر"
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                          >
                            {evt.status === 'draft' ? 'نشر' : 'حفظ كمسودة'}
                          </button>

                          <button
                            onClick={() => handleEditEventClick(evt)}
                            title="تعديل الفعالية"
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteEvent && onDeleteEvent(evt.id)}
                            title="حذف الفعالية"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS MANAGEMENT */}
      {activeTab === 'assignments' && (
        <SupervisorAssignmentManager
          user={currentUser || null}
          assignments={assignments}
          courses={courses}
          departments={departments}
          onAddAssignment={onAddAssignment || (() => {})}
          onUpdateAssignment={onUpdateAssignment || (() => {})}
          onDeleteAssignment={onDeleteAssignment || (() => {})}
        />
      )}

      {/* SCHEDULE MANAGEMENT */}
      {activeTab === 'schedule' && (
        <SupervisorScheduleManager
          user={currentUser || null}
          schedule={schedule}
          courses={courses}
          departments={departments}
          onAddScheduleItem={onAddScheduleItem || (() => {})}
          onUpdateScheduleItem={onUpdateScheduleItem || (() => {})}
          onDeleteScheduleItem={onDeleteScheduleItem || (() => {})}
        />
      )}

      {/* HONOR ROLL & ACHIEVERS MANAGEMENT */}
      {activeTab === 'honor_board' && (
        <HonorRollManager
          departments={departments}
          currentUser={currentUser}
        />
      )}

      {/* 6. AUDIT LOGS */}
      {activeTab === 'audit' && (
        <AdminAuditDashboard currentUser={currentUser} userRole={userRole} />
      )}

      {/* EVENT FORM TEMPLATE MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <span>{editingEventId ? 'تعديل بيانات الفعالية والنشاط' : 'نموذج إدخال فعالية / نشاط طلابي جديد'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  قم بتعبئة بيانات الفعالية ونشرها للطلاب مباشرة في Campus Hub.
                </p>
              </div>

              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Category & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نوع النشاط/الفعالية</label>
                  <select
                    value={evtCategory}
                    onChange={(e) => setEvtCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="workshop">💻 ورشة عمل (Workshop)</option>
                    <option value="hackathon">⚡ هكاثون (Hackathon)</option>
                    <option value="guest_lecture">🎤 محاضرة ضيف / ندوة</option>
                    <option value="field_trip">🚌 رحلة ميدانية</option>
                    <option value="competition">🏆 مسابقة علمية</option>
                    <option value="social">🎉 نشاط اجتماعي / ترفيهي</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان الفعالية أو النشاط *</label>
                  <input
                    type="text"
                    required
                    value={evtTitle}
                    onChange={(e) => setEvtTitle(e.target.value)}
                    placeholder="مثال: ورشة العمل التطبيقية لبرمجة FPGA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Organizer & Speaker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الجهة المنظمة</label>
                  <input
                    type="text"
                    value={evtOrganizer}
                    onChange={(e) => setEvtOrganizer(e.target.value)}
                    placeholder="مثال: نادي الميكاترونكس / قسم الحاسبات"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المحاضر / المتحدث الرئيسي</label>
                  <input
                    type="text"
                    value={evtSpeaker}
                    onChange={(e) => setEvtSpeaker(e.target.value)}
                    placeholder="اسم المتحدث أو الضيف"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Speaker Title & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">صفة أو رتبة المتحدث</label>
                  <input
                    type="text"
                    value={evtSpeakerTitle}
                    onChange={(e) => setEvtSpeakerTitle(e.target.value)}
                    placeholder="مثال: أستاذ الذكاء الاصطناعي / كبير مهندسي Siemens"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">السعة الاستيعابية (عدد المقاعد) *</label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={Number.isNaN(evtMaxCapacity) || evtMaxCapacity === undefined ? '' : evtMaxCapacity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEvtMaxCapacity(Number.isNaN(val) ? ('' as any) : val);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">التوقيت *</label>
                  <input
                    type="text"
                    required
                    value={evtTime}
                    onChange={(e) => setEvtTime(e.target.value)}
                    placeholder="10:00 - 13:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المكان / القاعة *</label>
                  <input
                    type="text"
                    required
                    value={evtLocation}
                    onChange={(e) => setEvtLocation(e.target.value)}
                    placeholder="مثال: المدرج B / قاعة المؤتمرات"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تفاصيل ونبذة عن الفعالية *</label>
                <textarea
                  rows={3}
                  required
                  value={evtDescription}
                  onChange={(e) => setEvtDescription(e.target.value)}
                  placeholder="اكتب وصفاً جذاباً يوضح أهداف الفعالية وما سيستفيده الطالب..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              {/* Target Audience & Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الفئة المستهدفة</label>
                  <input
                    type="text"
                    value={evtTargetAudience}
                    onChange={(e) => setEvtTargetAudience(e.target.value)}
                    placeholder="مثال: جميع طلاب الكلية / طلاب السنة الثالثة"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المتطلبات المسبقة (إن وجدت)</label>
                  <input
                    type="text"
                    value={evtRequirements}
                    onChange={(e) => setEvtRequirements(e.target.value)}
                    placeholder="مثال: احضار جهاز حاسوب محمول / معرفة بلغة C++"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Contact Email & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">البريد أو هاتف الاستفسار</label>
                  <input
                    type="text"
                    value={evtContactEmail}
                    onChange={(e) => setEvtContactEmail(e.target.value)}
                    placeholder="events@eng.gnu.edu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">صورة غلاف الفعالية (من جهازك مباشرة)</label>
                  <input
                    type="file"
                    ref={evtImageInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleEvtImageFile(file);
                    }}
                    className="hidden"
                  />

                  {evtImage ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <img
                        src={evtImage}
                        alt="Event Banner"
                        className="w-12 h-10 rounded-lg object-cover border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {evtImageFileName || 'صورة غلاف الفعالية'}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          تم اختيار الغلاف بنجاح
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => evtImageInputRef.current?.click()}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-[11px] font-bold hover:bg-slate-50"
                        >
                          تغيير
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEvtImage('');
                            setEvtImageFileName('');
                            if (evtImageInputRef.current) evtImageInputRef.current.value = '';
                          }}
                          className="p-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          title="إزالة الغلاف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => evtImageInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsEvtImageDragging(true);
                      }}
                      onDragLeave={() => setIsEvtImageDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsEvtImageDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleEvtImageFile(file);
                      }}
                      className={`border border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                        isEvtImageDragging
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500/5 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Upload className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">رفع صورة الغلاف من جهازك</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Radio */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">حالة النشر والظهور</span>
                  <span className="text-[11px] text-slate-500">اختر إما النشر الفوري للطلاب أو الحفظ كمسودة للتعديل لاحقاً.</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="evtStatus"
                      value="published"
                      checked={evtStatus === 'published'}
                      onChange={() => setEvtStatus('published')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>نشر فوري</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="evtStatus"
                      value="draft"
                      checked={evtStatus === 'draft'}
                      onChange={() => setEvtStatus('draft')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>حفظ كمسودة</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEventId ? 'حفظ التعديلات' : 'نشر الفعالية للطلاب'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW REGISTRANTS MODAL */}
      {viewRegistrantsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-500" />
                  <span>قائمة الطلاب المسجلين في الفعالية</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {viewRegistrantsEvent.title} (الإجمالي: {viewRegistrantsEvent.registeredStudents?.length || viewRegistrantsEvent.rsvpCount} طالب)
                </p>
              </div>

              <button
                onClick={() => setViewRegistrantsEvent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {(!viewRegistrantsEvent.registeredStudents || viewRegistrantsEvent.registeredStudents.length === 0) ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    تم حجز المقاعد عن طريق RSVP السريع ({viewRegistrantsEvent.rsvpCount} طالب).
                  </p>
                  <p className="text-[11px] text-slate-400">
                    عند تسجيل الطلاب باستخدام حواسبهم يظهر اسم الطالب ورقم القيد البرمجي هنا تلقائياً.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">اسم الطالب</th>
                        <th className="p-3">البريد الأكاديمي</th>
                        <th className="p-3">الرقم الجامعي</th>
                        <th className="p-3">القسم</th>
                        <th className="p-3">تاريخ التسجيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {viewRegistrantsEvent.registeredStudents.map((st, idx) => (
                        <tr key={st.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{st.name}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">{st.email}</td>
                          <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">{st.studentId || 'N/A'}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{st.departmentName || 'عام'}</td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{st.registeredAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                السعة القصوى: {viewRegistrantsEvent.maxCapacity || 50} مقعد
              </span>

              <button
                onClick={() => {
                  const headers = 'Name,Email,StudentId,Department,RegisteredAt\n';
                  const rows = (viewRegistrantsEvent.registeredStudents || [])
                    .map((s) => `"${s.name}","${s.email}","${s.studentId || ''}","${s.departmentName || ''}","${s.registeredAt}"`)
                    .join('\n');
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `registrants-${viewRegistrantsEvent.id}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>تصدير القائمة (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPERVISOR ASSIGNMENT & SCOPE MODAL */}
      {showSupervisorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50 dark:bg-slate-800/60">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>{editingSupervisor ? 'تعديل نطاق وصلاحيات المشرف' : 'تعيين مشرف وتحديد التخصص والسنة الدراسية'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  حدد القسم والفرقة الدراسية والصلاحيات المسموح بها لهذا المشرف.
                </p>
              </div>

              <button
                onClick={() => setShowSupervisorModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupervisorScope} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المشرف / الأخصائي *</label>
                  <input
                    type="text"
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="مثال: د. طارق عبد المجيد / م. عمر الشريف"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="supervisor@tnu.edu.eg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المسمى الوظيفي / الصفة الأكاديمية</label>
                <input
                  type="text"
                  value={supTitle}
                  onChange={(e) => setSupTitle(e.target.value)}
                  placeholder="مثال: أخصائي السنة الأولى - قسم هندسة الحاسبات"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Department & Academic Level Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-purple-50/50 dark:bg-slate-950/60 border border-purple-500/20">
                <div>
                  <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">القسم المستهدف (التخصص) *</label>
                  <select
                    value={supDeptId}
                    onChange={(e) => setSupDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-xs"
                  >
                    <option value="dept-cmp">💻 قسم هندسة الحاسبات والذكاء الاصطناعي</option>
                    <option value="dept-mtr">🤖 قسم هندسة الميكاترونكس والروبوتات</option>
                    <option value="all">🌐 كافة الأقسام (إشراف عام)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">السنة الدراسية المستهدفة *</label>
                  <select
                    value={supLevel}
                    onChange={(e) => setSupLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-xs"
                  >
                    <option value="all">📚 جميع السنوات المتاحة (السنة الأولى والثانية)</option>
                    <option value="Year 1 (Freshman)">🎓 السنة الأولى (إعدادي)</option>
                    <option value="Year 2 (Sophomore)">📘 السنة الثانية - الترم الأول</option>
                  </select>
                </div>
              </div>

              {/* Capability Toggles */}
              <div className="space-y-2 pt-2">
                <label className="block font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  حدد الصلاحيات الممنوحة داخل هذا التخصص:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20">
                    <input
                      type="checkbox"
                      checked={supCanManageCourses}
                      onChange={(e) => setSupCanManageCourses(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">إضافة وتعديل المقررات الدراسية</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20">
                    <input
                      type="checkbox"
                      checked={supCanUploadResources}
                      onChange={(e) => setSupCanUploadResources(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">رفع واقتراح المراجع والمعامل</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20">
                    <input
                      type="checkbox"
                      checked={supCanUploadCertificates}
                      onChange={(e) => setSupCanUploadCertificates(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">إسناد الشهادات الأكاديمية</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20">
                    <input
                      type="checkbox"
                      checked={supCanPublishAnnouncements}
                      onChange={(e) => setSupCanPublishAnnouncements(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">نشر إعلانات رسمية للقسم</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSupervisorModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-md transition-all"
                >
                  حفظ وتعريف نطاق المشرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Creation / Editing Modal */}
      <CourseFormModal
        isOpen={courseFormModalOpen}
        onClose={() => {
          setCourseFormModalOpen(false);
          setEditingCourse(null);
        }}
        initialCourse={editingCourse}
        departments={departments}
        onSubmit={(courseData) => {
          if (editingCourse) {
            if (onUpdateCourse) {
              onUpdateCourse(editingCourse.id, courseData);
            }
          } else {
            onAddCourse(courseData);
          }
          setCourseFormModalOpen(false);
          setEditingCourse(null);
        }}
      />

      {/* Confirm Delete Course Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCourse)}
        title="حذف المقرر الدراسي بالكامل"
        message={`هل أنت أستاذ/مسؤول تأكد من حذف مادة "${deletingCourse?.title}" (${deletingCourse?.code}) بالكامل؟ لن يتمكن الطلاب من الوصول لهذه المادة.`}
        confirmText="تأكيد حذف المادة"
        cancelText="إلغاء"
        variant="danger"
        onCancel={() => setDeletingCourse(null)}
        onConfirm={() => {
          if (deletingCourse && onDeleteCourse) {
            onDeleteCourse(deletingCourse.id);
          }
          setDeletingCourse(null);
        }}
      />

      {/* Confirm Remove Supervisor Modal */}
      <ConfirmModal
        isOpen={Boolean(supervisorToDelete)}
        title="إلغاء صفة المشرف الأكاديمي"
        message={`هل أنت متأكد من إلغاء صفة المشرف وتجريد الصلاحيات الأكاديمية من (${supervisorToDelete?.name})؟`}
        confirmText="تأكيد إلغاء الإشراف"
        cancelText="إلغاء"
        variant="danger"
        onCancel={() => setSupervisorToDelete(null)}
        onConfirm={handleConfirmRemoveSupervisor}
      />
    </div>
  );
};
