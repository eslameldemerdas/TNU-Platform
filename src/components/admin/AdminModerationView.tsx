import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
  Activity,
  Users,
  Lock,
  ShieldCheck,
  RefreshCw,
  Search,
  Megaphone,
  Pin,
  Trash2,
  Send,
  Bell,
  Calendar,
  Edit3,
  UserCheck,
  Download,
  Check,
  Layers,
  Clock,
  MapPin,
  Award,
  UserPlus,
  Settings,
  CheckSquare,
  Filter,
  Building2,
  Upload,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { getAuthHeaders } from "../../lib/storage";
import {
  StudyFile,
  UserRole,
  Course,
  Department,
  Announcement,
  CampusEvent,
  EventCategory,
  UserProfile,
  SupervisorScope,
  Assignment,
  ScheduleItem,
} from "../../types";
import { getCourseCoverSvg } from "../../utils/courseCovers";
import { getSupervisorScopeLabel } from "../../utils/permissionUtils";

import { ConfirmModal } from "../common/ConfirmModal";

import { Card, Button, Badge, Avatar, Input, Textarea, Select } from "../ui";

import { AdminAuditDashboard } from "./AdminAuditDashboard";
import { CourseFormModal } from "./CourseFormModal";
import { HonorRollManager } from "./HonorRollManager";
import { SupervisorAssignmentManager } from "./SupervisorAssignmentManager";
import { SupervisorScheduleManager } from "./SupervisorScheduleManager";

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
  onAddAnnouncement?: (announcement: Omit<Announcement, "id" | "date">) => Promise<void>;
  onDeleteAnnouncement?: (announcementId: string) => void;
  onTogglePinAnnouncement?: (announcementId: string) => void;
  onAddEvent?: (event: Omit<CampusEvent, "id" | "rsvpCount">) => Promise<void>;
  onUpdateEvent?: (eventId: string, event: Partial<CampusEvent>) => Promise<void>;
  onDeleteEvent?: (eventId: string) => void;
  onToggleEventStatus?: (eventId: string) => void;
  onAddAssignment?: (asgn: Partial<Assignment>) => void;
  onUpdateAssignment?: (id: string, asgn: Partial<Assignment>) => void;
  onDeleteAssignment?: (id: string) => void;
  onAddScheduleItem?: (item: Omit<ScheduleItem, "id">) => void;
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
  onDeleteScheduleItem,
}) => {
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<
    | "queue"
    | "courses"
    | "users"
    | "supervisors"
    | "assignments"
    | "schedule"
    | "announcements"
    | "events"
    | "honor_board"
    | "audit"
  >("supervisors");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const [courseFormModalOpen, setCourseFormModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [cCode, setCCode] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cDeptId, _setCDeptId] = useState(departments[0]?.id || "dept-cmp-01");
  const [cInstructor, _setCInstructor] = useState("");
  const [cCredits, _setCCredits] = useState(3);

  const [ancTitle, setAncTitle] = useState("");
  const [ancContent, setAncContent] = useState("");
  const [ancPriority, setAncPriority] = useState<"urgent" | "normal" | "low">("urgent");
  const [ancScope, setAncScope] = useState<"university" | "faculty" | "department">("faculty");
  const [ancTargetDept, setAncTargetDept] = useState<string>(departments[0]?.id || "");
  const [ancIsPinned, setAncIsPinned] = useState(true);

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [viewRegistrantsEvent, setViewRegistrantsEvent] = useState<CampusEvent | null>(null);

  const [evtTitle, setEvtTitle] = useState("");
  const [evtCategory, setEvtCategory] = useState<EventCategory>("workshop");
  const [evtOrganizer, setEvtOrganizer] = useState("عمادة الكلية ونادي التكنولوجيا");
  const [evtDate, setEvtDate] = useState("2026-08-28");
  const [evtTime, setEvtTime] = useState("10:00 - 13:00");
  const [evtLocation, setEvtLocation] = useState("المدرج المركزي - كلية الهندسة");
  const [evtDescription, setEvtDescription] = useState("");
  const [evtSpeaker, setEvtSpeaker] = useState("");
  const [evtSpeakerTitle, setEvtSpeakerTitle] = useState("");
  const [evtMaxCapacity, setEvtMaxCapacity] = useState<number>(50);
  const [evtTargetAudience, setEvtTargetAudience] = useState("جميع طلاب الهندسة");
  const [evtRequirements, setEvtRequirements] = useState("");
  const [evtContactEmail, setEvtContactEmail] = useState("events@eng.gnu.edu");
  const [evtContactPhone, setEvtContactPhone] = useState("+20 100 000 1122");
  const [evtTags, setEvtTags] = useState("Engineering, Workshop");
  const [evtImage, setEvtImage] = useState(
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
  );
  const [evtStatus, setEvtStatus] = useState<"published" | "draft">("published");

  const evtImageInputRef = useRef<HTMLInputElement>(null);
  const [isEvtImageDragging, setIsEvtImageDragging] = useState(false);
  const [evtImageFileName, setEvtImageFileName] = useState("");

  const handleEvtImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)");
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

  const applyEventTemplate = (
    type: "workshop" | "hackathon" | "field_trip" | "seminar" | "competition",
  ) => {
    if (type === "workshop") {
      setEvtTitle("ورشة عمل برمجية: تطوير برامج الأنظمة المدمجة مع C++20");
      setEvtCategory("workshop");
      setEvtOrganizer("نادي الهندسة والذكاء الاصطناعي");
      setEvtTime("10:00 - 13:00");
      setEvtLocation("معمل الحاسبات المركزي A302");
      setEvtDescription(
        "ورشة تدريبية تطبيقية تغطي تصميم البرامج عالية الكفاءة للمتحكمات الدقيقة وتطبيق معايير C++ Modern المتقدمة.",
      );
      setEvtSpeaker("د. مهندس طارق الخولي");
      setEvtSpeakerTitle("أستاذ الأنظمة المدمجة بجامعة GNUE");
      setEvtMaxCapacity(40);
      setEvtTargetAudience("طلاب السنة الثانية والثالثة - حاسبات وميكاترونكس");
      setEvtRequirements("احضار الحاسوب المحمول مع تثبيت بيئة VS Code وCompiler C++");
      setEvtTags("C++, Embedded Systems, VSCode, Coding");
      setEvtImage(
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
      );
    } else if (type === "hackathon") {
      setEvtTitle("هكاثون الابتكار الهندسي وتطبيقات الذكاء الاصطناعي");
      setEvtCategory("hackathon");
      setEvtOrganizer("عمادة الكلية وجمعية IEEE");
      setEvtTime("09:00 - 21:00 (على مدار يومين)");
      setEvtLocation("المدرج الكبير والبهو الرئيسي للكلية");
      setEvtDescription(
        "منافسة هندسية لتطوير حلول مبتكرة في مجالات الطاقة النظيفة، الروبوتات، والمدن الذكية باستخدام الذكاء الاصطناعي.",
      );
      setEvtSpeaker("لجنة تحكيم من كبار خبراء الصناعة والجامعة");
      setEvtSpeakerTitle("خبراء ومستشارون تقنيون");
      setEvtMaxCapacity(120);
      setEvtTargetAudience("جميع الطلاب ومجموعات مشاريع التخرج");
      setEvtRequirements("تشكيل فريق من 3-5 طلاب، وفكرة مشروع أولي");
      setEvtTags("Hackathon, AI, Innovation, IEEE, Competition");
      setEvtImage(
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
      );
    } else if (type === "field_trip") {
      setEvtTitle("رحلة ميدانية علمية: زيارة مجمع المصانع والخطوط الأوتوماتيكية");
      setEvtCategory("field_trip");
      setEvtOrganizer("إدارة الأنشطة الطلابية ورعاية الشباب");
      setEvtTime("08:00 - 16:00");
      setEvtLocation("التجمع أمام البوابة الرئيسية للكلية - التحرك بالأوتوبيسات");
      setEvtDescription(
        "زيارة ميدانية موجهة للتعرف على خطوط الإنتاج الحديثة وروبوتات التجميع الصناعية وأنظمة السيطرة والجودة.",
      );
      setEvtSpeaker("م. أحمد القاضي");
      setEvtSpeakerTitle("مدير الصيانة والجودة بالمجمع الصناعي");
      setEvtMaxCapacity(35);
      setEvtTargetAudience("طلاب قسم الميكاترونكس والكهرباء والإنتاج");
      setEvtRequirements("الالتزام بحذاء السلامة (Safety Shoes) والزي الرسمي للكلية");
      setEvtTags("Field Trip, Industrial, Robotics, Automation");
      setEvtImage(
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      );
    } else if (type === "seminar") {
      setEvtTitle("ندوة علمية: مستقبل هندسة الحاسبات وسوق العمل العالمي لعام 2026");
      setEvtCategory("guest_lecture");
      setEvtOrganizer("قسم هندسة الحاسبات ومكتب العلاقات الخرجين");
      setEvtTime("12:00 - 14:00");
      setEvtLocation("قاعة المؤتمرات 101");
      setEvtDescription(
        "ندوة حوارية تفاعلية تتناول أهم المهارات المطلوبة في سوق العمل الحديث، التحضير لمقابلات العمل الفنية، وفرص المنح الدراسية بالخارج.",
      );
      setEvtSpeaker("د. كريم عبد الرحمن");
      setEvtSpeakerTitle("كبير مهندسي البرمجيات بشركة عالمية");
      setEvtMaxCapacity(100);
      setEvtTargetAudience("طلاب السنوات النهائية والخرجين الجدد");
      setEvtRequirements("التسجيل المسبق والحضور بالموعد المحدد");
      setEvtTags("Career, Seminar, Computer Engineering, Future");
      setEvtImage(
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
      );
    } else if (type === "competition") {
      setEvtTitle("مسابقة أفضل مشروع ابتكاري في الميكاترونكس والروبوتات");
      setEvtCategory("competition");
      setEvtOrganizer("قسم الميكاترونكس والجمعية العملية");
      setEvtTime("11:00 - 15:00");
      setEvtLocation("معمل الروبوتات المتقدمة B104");
      setEvtDescription(
        "معرض ومسابقة سنوية لعرض أفضل مشاريع الطلاب والأجهزة الروبوتية المبتكرة مع تقديم جوائز مالية وشهادات تقدير.",
      );
      setEvtSpeaker("د. سارة جنكينز");
      setEvtSpeakerTitle("رئيس قسم الميكاترونكس");
      setEvtMaxCapacity(60);
      setEvtTargetAudience("فرق المشاريع الطلابية من جميع السنوات");
      setEvtRequirements("تقديم ملخص تنفيذي للمشروع ونسخة تجريبية تعمل");
      setEvtTags("Robotics, Mechatronics, Innovation, Awards");
      setEvtImage(
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
      );
    }
  };

  const [userList, setUserList] = useState<AdminUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userDeptFilter, setUserDeptFilter] = useState<string>("all");
  const [userLevelFilter, setUserLevelFilter] = useState<string>("all");
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserRecord | null>(null);
  const [pendingNewRole, setPendingNewRole] = useState<UserRole>("student");
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [roleMessage, setRoleMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [supervisorsList, setSupervisorsList] = useState<UserProfile[]>([]);
  const [supervisorFilterDept, setSupervisorFilterDept] = useState<string>("all");
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<UserProfile | null>(null);

  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supTitle, setSupTitle] = useState("");
  const [supDeptId, setSupDeptId] = useState("dept-cmp");
  const [supLevel, setSupLevel] = useState<string>("all");
  const [supCanManageCourses, setSupCanManageCourses] = useState(true);
  const [supCanUploadResources, setSupCanUploadResources] = useState(true);
  const [supCanUploadCertificates, setSupCanUploadCertificates] = useState(true);
  const [supCanManageAssignments, setSupCanManageAssignments] = useState(true);
  const [supCanModerateDiscussions, setSupCanModerateDiscussions] = useState(true);
  const [supCanPublishAnnouncements, setSupCanPublishAnnouncements] = useState(true);

  const handleOpenNewSupervisorModal = () => {
    setEditingSupervisor(null);
    setSupName("");
    setSupEmail("");
    setSupTitle("أخصائي أكاديمي للقسم");
    setSupDeptId("dept-cmp");
    setSupLevel("all");
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
    setSupTitle(sup.supervisorTitle || "مشرف أخصائي");
    setSupDeptId(sup.supervisorScope?.departmentId || sup.departmentId || "dept-cmp");
    setSupLevel(sup.supervisorScope?.level || "all");
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
      canPublishAnnouncements: supCanPublishAnnouncements,
    };

    try {
      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          targetUserId: editingSupervisor?.id,
          targetEmail: supEmail.trim(),
          newRole: "supervisor",
          supervisorTitle: supTitle.trim(),
          supervisorScope: newScope,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error?.message || "فشل تحديث صلاحيات المشرف.");
      }

      const data = await res.json();
      const savedUser = data.user || {
        id: editingSupervisor?.id || `usr-sup-${Date.now()}`,
        name: supName.trim(),
        email: supEmail.trim(),
        role: "supervisor",
        supervisorTitle: supTitle.trim(),
        supervisorScope: newScope,
      };

      setSupervisorsList((prev) => {
        if (editingSupervisor) {
          return prev.map((s) =>
            s.id === editingSupervisor.id
              ? {
                  ...s,
                  name: savedUser.name || supName.trim(),
                  email: savedUser.email || supEmail.trim(),
                  supervisorTitle: savedUser.supervisorTitle || supTitle.trim(),
                  supervisorScope: newScope,
                }
              : s,
          );
        }
        return [
          {
            ...savedUser,
            studentId: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
            universityId: "univ-tnu",
            facultyId: "fac-eng-01",
            departmentId: supDeptId === "all" ? "dept-cmp" : supDeptId,
            level: supLevel === "all" ? "Year 1 (Freshman)" : (supLevel as string),
            semester: "Fall 2026",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            bio: `أخصائي مسند لقسم ${supDeptId}`,
            points: 1000,
            badges: [],
            savedBookmarks: [],
            enrolledCourseIds: [],
            createdAt: new Date().toISOString().split("T")[0],
          } as UserProfile,
          ...prev,
        ];
      });

      setRoleMessage({
        text: editingSupervisor
          ? `تم تحديث صلاحيات ونطاق إشراف (${supName}) بنجاح!`
          : `تم تعيين المشرف الأخصائي الجديد (${supName}) بنجاح!`,
        type: "success",
      });
    } catch (err: any) {
      setRoleMessage({
        text: err.message || "حدث خطأ أثناء تحديث الصلاحيات في قاعدة البيانات.",
        type: "error",
      });
    }

    setShowSupervisorModal(false);
    setTimeout(() => setRoleMessage(null), 4000);
  };

  const handleRemoveSupervisor = (supId: string, supName: string) => {
    setSupervisorToDelete({ id: supId, name: supName });
  };

  const handleConfirmRemoveSupervisor = async () => {
    if (!supervisorToDelete) return;
    const { id: supId, name: supName } = supervisorToDelete;

    try {
      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          targetUserId: supId,
          newRole: "student",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error?.message || "فشل إزالة صلاحيات المشرف.");
      }
      setSupervisorsList((prev) => prev.filter((s) => s.id !== supId));
      setRoleMessage({
        text: `تم إلغاء صفة المشرف عن (${supName}) وعودته كطالب عادي.`,
        type: "success",
      });
    } catch (err: any) {
      setRoleMessage({
        text: err.message || "حدث خطأ أثناء إزالة صلاحيات المشرف.",
        type: "error",
      });
    }
    setSupervisorToDelete(null);
    setTimeout(() => setRoleMessage(null), 4000);
  };

  const fetchUsers = async () => {
    if (userRole === "student") return;

    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const serverUsers = (data.users || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber || "",
          studentId: u.studentId || "",
          role: u.role,
          supervisorTitle: u.supervisorTitle,
          supervisorScope: u.supervisorScope,
          universityId: u.universityId || "",
          facultyId: u.facultyId || "",
          departmentId: u.departmentId || "",
          level: u.level || "",
          semester: u.semester || "",
          avatar: u.avatar || "",
          bio: u.bio || "",
          points: u.points || 0,
          createdAt: u.createdAt || new Date().toISOString(),
        }));
        setUserList(serverUsers);
      } else {
        setUserList([]);
      }
    } catch {
      setUserList([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (userRole !== "student") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  useEffect(() => {
    if (activeTab === "users" && userRole !== "student") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userRole]);

  if (userRole === "student") {
    return (
      <Card padding="lg" className="max-w-xl mx-auto my-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-ehb-text-primary">{t.admin.accessDeniedTitle}</h2>
        <p className="text-xs text-ehb-text-muted leading-relaxed">{t.admin.accessDeniedMessage}</p>
      </Card>
    );
  }

  const handleReject = (fileId: string) => {
    onRejectFile(fileId, rejectReason || "Content does not meet quality standards.");
    setSelectedFileId(null);
    setRejectReason("");
  };

  const _handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCode || !cTitle) return;
    onAddCourse({
      code: cCode,
      title: cTitle,
      departmentId: cDeptId,
      instructor: cInstructor || "Dr. Assigned Professor",
      instructorEmail: "prof@eng.gnu.edu",
      credits: cCredits,
      level: "Year 2 (Sophomore)",
      semester: "Fall 2026",
      scheduleDayTime: "Mon/Wed 10:00 - 11:30 AM",
      location: "Hall B",
      description: "Newly registered faculty course.",
      prerequisites: [],
      syllabus: ["Module 1: Foundations"],
      gradingScheme: [{ category: "Final Exam", weight: 100 }],
      bannerImage: getCourseCoverSvg(cCode),
      fileCount: 0,
      discussionCount: 0,
    });
    setCCode("");
    setCTitle("");
    setCourseFormModalOpen(false);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUserForRole) return;
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          targetUserId: selectedUserForRole.id,
          targetEmail: selectedUserForRole.email,
          newRole: pendingNewRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRoleMessage({ text: data.message || t.admin.roleUpdatedSuccess, type: "success" });
        setUserList((prev) =>
          prev.map((u) =>
            u.id === selectedUserForRole.id || u.email === selectedUserForRole.email
              ? { ...u, role: pendingNewRole }
              : u,
          ),
        );
      } else {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || data.message || "Failed to update user role";
        setRoleMessage({ text: String(errorMsg), type: "error" });
      }
    } catch {
      setRoleMessage({ text: "Network or server error updating role.", type: "error" });
    } finally {
      setShowRoleConfirmModal(false);
      setSelectedUserForRole(null);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;

    try {
      if (onAddAnnouncement) {
        await onAddAnnouncement({
          title: ancTitle.trim(),
          content: ancContent.trim(),
          priority: ancPriority,
          scope: ancScope,
          targetId: ancScope === "department" ? ancTargetDept : undefined,
          isPinned: ancIsPinned,
          date: new Date().toISOString().split("T")[0],
          authorName:
            userRole === "super_admin"
              ? language === "ar"
                ? "إدارة الكلية"
                : "Faculty Administration"
              : language === "ar"
                ? "عمادة ومجلس الإشراف"
                : "Supervisory Board",
          authorRole: userRole,
        });
      }

      setAncTitle("");
      setAncContent("");
      setAncPriority("urgent");
      setAncIsPinned(true);
      setRoleMessage({ text: t.admin.announcementPublished, type: "success" });
      setTimeout(() => setRoleMessage(null), 5000);
    } catch (err: any) {
      setRoleMessage({
        text: err.message || "فشل نشر الإعلان.",
        type: "error",
      });
      setTimeout(() => setRoleMessage(null), 5000);
    }
  };

  const handleOpenNewEventModal = () => {
    setEditingEventId(null);
    setEvtTitle("");
    setEvtCategory("workshop");
    setEvtOrganizer("عمادة الكلية ونادي التكنولوجيا");
    setEvtDate(new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0]);
    setEvtTime("10:00 - 13:00");
    setEvtLocation("المدرج المركزي - كلية الهندسة");
    setEvtDescription("");
    setEvtSpeaker("");
    setEvtSpeakerTitle("");
    setEvtMaxCapacity(50);
    setEvtTargetAudience("جميع طلاب الهندسة");
    setEvtRequirements("");
    setEvtContactEmail("events@eng.gnu.edu");
    setEvtContactPhone("+20 100 000 1122");
    setEvtTags("Engineering, Activity");
    setEvtImage(
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    );
    setEvtStatus("published");
    setShowEventModal(true);
  };

  const handleEditEventClick = (event: CampusEvent) => {
    setEditingEventId(event.id);
    setEvtTitle(event.title);
    setEvtCategory(event.category || "workshop");
    setEvtOrganizer(event.organizer);
    setEvtDate(event.date);
    setEvtTime(event.time);
    setEvtLocation(event.location);
    setEvtDescription(event.description);
    setEvtSpeaker(event.speaker || "");
    setEvtSpeakerTitle(event.speakerTitle || "");
    setEvtMaxCapacity(event.maxCapacity || 50);
    setEvtTargetAudience(event.targetAudience || "جميع طلاب الهندسة");
    setEvtRequirements(event.requirements || "");
    setEvtContactEmail(event.contactEmail || "events@eng.gnu.edu");
    setEvtContactPhone(event.contactPhone || "");
    setEvtTags(event.tags ? event.tags.join(", ") : "");
    setEvtImage(
      event.image ||
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    );
    setEvtStatus(event.status === "draft" ? "draft" : "published");
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtLocation.trim()) return;

    const parsedTags = evtTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingEventId) {
        if (onUpdateEvent) {
          await onUpdateEvent(editingEventId, {
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
          });
        }
        setRoleMessage({ text: "تم تحديث بيانات الفعالية بنجاح!", type: "success" });
      } else {
        if (onAddEvent) {
          await onAddEvent({
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
            registeredStudents: [],
          });
        }
        setRoleMessage({ text: "تم نشر الفعالية/النشاط الطلابي بنجاح!", type: "success" });
      }

      setShowEventModal(false);
      setTimeout(() => setRoleMessage(null), 4000);
    } catch (err: any) {
      setRoleMessage({
        text: err.message || "فشل حفظ الفعالية.",
        type: "error",
      });
      setTimeout(() => setRoleMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Card padding="lg" className="border-ehb-default">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-amber-500 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                {userRole === "super_admin" ? t.admin.promoteSuperAdmin : userRole.replace("_", " ")}{" "}
                - {t.admin.panelTitle}
              </h2>
              <p className="text-xs text-ehb-text-muted">{t.admin.panelSubtitle}</p>
            </div>
          </div>

          <span className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1 rounded-ehb-sm border border-ehb-default text-ehb-text-muted">
            Role: {userRole}
          </span>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border-b border-ehb-default pb-3">
        <Button
          variant={activeTab === "queue" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("queue")}
          leftIcon={<FileText className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>
            {t.admin.queueTab} ({pendingFiles.length})
          </span>
        </Button>

        <Button
          variant={activeTab === "courses" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("courses")}
          leftIcon={<Plus className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>
            {t.admin.coursesTab} ({courses.length})
          </span>
        </Button>

        <Button
          variant={activeTab === "supervisors" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("supervisors")}
          leftIcon={<ShieldCheck className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>إدارة المشرفين والتخصصات ({supervisorsList.length})</span>
        </Button>

        <Button
          variant={activeTab === "assignments" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("assignments")}
          leftIcon={<CheckSquare className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>التكليفات والواجبات ({assignments.length})</span>
        </Button>

        <Button
          variant={activeTab === "schedule" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("schedule")}
          leftIcon={<Clock className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>جدول الحضور والمحاضرات ({schedule.length})</span>
        </Button>

        <Button
          variant={activeTab === "users" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("users")}
          leftIcon={<Users className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>{t.admin.usersTab}</span>
        </Button>

        <Button
          variant={activeTab === "announcements" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("announcements")}
          leftIcon={<Megaphone className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>
            {t.admin.announcementsTab} ({announcements.length})
          </span>
        </Button>

        <Button
          variant={activeTab === "events" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("events")}
          leftIcon={<Calendar className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>إدارة الأنشطة والفعاليات ({events.length})</span>
        </Button>

        <Button
          variant={activeTab === "honor_board" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("honor_board")}
          leftIcon={<Award className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>لوحة الشرف والطلاب المتميزين</span>
        </Button>

        <Button
          variant={activeTab === "audit" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("audit")}
          leftIcon={<Activity className="w-4 h-4" />}
          className="min-h-[44px]"
        >
          <span>{t.admin.auditTab}</span>
        </Button>
      </div>

      {roleMessage && (
        <Card
          padding="md"
          className={`flex items-center justify-between ${
            roleMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          <span className="text-xs font-semibold">
            {typeof roleMessage.text === "object"
              ? (roleMessage.text as any)?.message || JSON.stringify(roleMessage.text)
              : String(roleMessage.text)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRoleMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </Button>
        </Card>
      )}

      {activeTab === "queue" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
            {t.admin.pendingQueue}
          </h3>

          {pendingFiles.length === 0 ? (
            <Card padding="lg" className="text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-ehb-text-primary">Moderation Queue Clear</h4>
              <p className="text-xs text-ehb-text-muted">
                All submitted study files have been reviewed.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingFiles.map((file) => (
                <Card key={file.id} padding="lg" className="space-y-3 border-amber-500/30 bg-amber-500/5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="warning" size="sm" dot>
                          Pending Approval
                        </Badge>
                        <span className="text-xs font-bold text-ehb-text-primary">
                          Uploader: {file.uploaderName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-ehb-text-primary">{file.title}</h4>
                      <p className="text-xs text-ehb-text-muted">{file.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onApproveFile(file.id)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        className="min-h-[44px]"
                      >
                        {t.common.approve}
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setSelectedFileId(file.id)}
                        leftIcon={<XCircle className="w-4 h-4" />}
                        className="min-h-[44px]"
                      >
                        {t.common.reject}
                      </Button>
                    </div>
                  </div>

                  {selectedFileId === file.id && (
                    <Card padding="md" className="space-y-2 border-rose-500/30 bg-rose-500/5">
                      <p className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                        Rejection Reason Feedback:
                      </p>
                      <Input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="State reason (e.g., Incomplete solutions, blurry scan...)"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFileId(null)}
                        >
                          {t.common.cancel}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(file.id)}
                        >
                          Confirm Rejection
                        </Button>
                      </div>
                    </Card>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "courses" && (
        <div className="space-y-4">
          <Card padding="lg" className="border-indigo-500/20 bg-indigo-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                  إدارة وسجل المقررات الدراسية ({courses.length})
                </h3>
                <p className="text-xs text-ehb-text-muted mt-0.5">
                  صلاحيات كاملة للسوبر أدمن لإضافة المواد الهندسية، تعديل الساعات والأساتذة أو حذف
                  المقرر نهائياً.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingCourse(null);
                  setCourseFormModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shrink-0"
              >
                + إضافة مقرر دراسي جديد
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => {
              const deptName =
                departments.find((d) => d.id === c.departmentId)?.name || "كلية الهندسة";
              return (
                <Card key={c.id} variant="interactive" padding="lg" className="flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="primary" size="sm" className="course-code">
                        {c.code}
                      </Badge>
                      <span className="text-[11px] font-bold text-ehb-text-muted">
                        {c.credits} ساعات معتمدة • {c.level}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-ehb-text-primary">{c.title}</h4>
                      <p className="text-xs text-ehb-text-muted line-clamp-2 mt-1">
                        {c.description || "لا يوجد وصف للمادة"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ehb-text-muted pt-2 border-t border-ehb-subtle">
                      <span>
                        القسم: <strong className="text-ehb-text-primary">{deptName}</strong>
                      </span>
                      <span>
                        الأستاذ: <strong className="text-ehb-text-primary">{c.instructor}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-ehb-subtle">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingCourse(c);
                        setCourseFormModalOpen(true);
                      }}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      className="flex-1"
                    >
                      تعديل المادة
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingCourse(c)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      حذف
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "supervisors" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card padding="md" className="border-purple-500/20 bg-purple-500/5">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">
                  إجمالي المشرفين الأخصائيين
                </span>
                <Users className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">{supervisorsList.length}</span>
            </Card>

            <Card padding="md" className="border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">مشرفو قسم الحاسبات</span>
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">
                {
                  supervisorsList.filter(
                    (s) =>
                      s.supervisorScope?.departmentId === "dept-cmp" ||
                      s.departmentId === "dept-cmp",
                  ).length
                }
              </span>
            </Card>

            <Card padding="md" className="border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">مشرفو قسم الميكاترونكس</span>
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">
                {
                  supervisorsList.filter(
                    (s) =>
                      s.supervisorScope?.departmentId === "dept-mtr" ||
                      s.departmentId === "dept-mtr",
                  ).length
                }
              </span>
            </Card>

            <Card padding="md" className="border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">مشرفو السنة الأولى فقط</span>
                <Award className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">
                {
                  supervisorsList.filter(
                    (s) => s.supervisorScope?.level && s.supervisorScope.level.includes("Year 1"),
                  ).length
                }
              </span>
            </Card>
          </div>

          <Card padding="lg" className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ehb-text-primary w-full sm:w-auto">
              <Filter className="w-4 h-4 text-purple-500 shrink-0" />
              <span>تصفية حسب التخصص:</span>
              <Select
                size="sm"
                value={supervisorFilterDept}
                onChange={(e) => setSupervisorFilterDept(e.target.value)}
                options={[
                  { value: "all", label: `كافة الأقسام التخصصية (${supervisorsList.length})` },
                  { value: "dept-cmp", label: "قسم هندسة الحاسبات والذكاء الاصطناعي" },
                  { value: "dept-mtr", label: "قسم هندسة الميكاترونكس والروبوتات" },
                ]}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewSupervisorModal}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="shrink-0"
            >
              + تعيين مشرف أخصائي جديد
            </Button>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supervisorsList
              .filter((s) => {
                if (supervisorFilterDept === "all") return true;
                const d = s.supervisorScope?.departmentId || s.departmentId;
                return (
                  d === supervisorFilterDept || d === `${supervisorFilterDept}-01` || d === "all"
                );
              })
              .map((sup) => {
                const isSuper = sup.role === "super_admin";
                const scope = sup.supervisorScope;

                const sameDeptSupervisors = supervisorsList.filter(
                  (other) =>
                    other.id !== sup.id &&
                    (other.supervisorScope?.departmentId === scope?.departmentId ||
                      other.departmentId === sup.departmentId),
                );
                const hasMultipleSupervisors = sameDeptSupervisors.length > 0 && !isSuper;

                return (
                  <Card key={sup.id} padding="lg" className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="lg"
                          src={sup.avatar}
                          alt={sup.name}
                          fallback={sup.name}
                          className="border-2 border-purple-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-ehb-text-primary">{sup.name}</h4>
                            {isSuper && (
                              <Badge variant="error" size="sm">
                                {language === "ar" ? "مسؤول رئيسي" : "Super Admin"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                            {sup.supervisorTitle || getSupervisorScopeLabel(sup, departments)}
                          </p>
                          <span className="text-[11px] text-ehb-text-muted font-mono block">
                            {sup.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSupervisorClick(sup)}
                          leftIcon={<Settings className="w-3.5 h-3.5" />}
                          className="text-purple-600 dark:text-purple-400"
                        >
                          تعديل
                        </Button>
                        {!isSuper && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSupervisor(sup.id, sup.name)}
                            className="text-rose-600 dark:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Card padding="md" className="space-y-2 text-xs border-ehb-subtle">
                      <div className="flex items-center justify-between text-[11px] font-bold text-ehb-text-muted">
                        <span>النطاق والتخصص المسند:</span>
                        {hasMultipleSupervisors && (
                          <Badge variant="warning" size="sm">
                            👥 يوجد {sameDeptSupervisors.length + 1} مشرفين لهذا التخصص
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="info" size="sm" className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {scope?.departmentId === "dept-cmp" || sup.departmentId === "dept-cmp"
                            ? "قسم هندسة الحاسبات"
                            : scope?.departmentId === "dept-mtr" || sup.departmentId === "dept-mtr"
                              ? "قسم هندسة الميكاترونكس"
                              : "كافة الأقسام بالكلية"}
                        </Badge>

                        <Badge variant="primary" size="sm" className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {scope?.level && scope.level !== "all" ? scope.level : "جميع السنوات والفرائق"}
                        </Badge>
                      </div>
                    </Card>

                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <span className="font-bold text-ehb-text-muted block">
                        الصلاحيات الممنوحة داخل التخصص:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div
                          className={`flex items-center gap-1.5 font-semibold ${scope?.canManageCourses !== false ? "text-emerald-600 dark:text-emerald-400" : "text-ehb-text-muted line-through"}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>تعديل المقررات والمنهج</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 font-semibold ${scope?.canUploadResources !== false ? "text-emerald-600 dark:text-emerald-400" : "text-ehb-text-muted line-through"}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>رفع المراجع والمعامل</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 font-semibold ${scope?.canUploadCertificates !== false ? "text-emerald-600 dark:text-emerald-400" : "text-ehb-text-muted line-through"}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>إسناد الشهادات الأكاديمية</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 font-semibold ${scope?.canPublishAnnouncements !== false ? "text-emerald-600 dark:text-emerald-400" : "text-ehb-text-muted line-through"}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>نشر إعلانات القسم</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <Card padding="lg" className="border-purple-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <h3 className="text-base font-extrabold text-ehb-text-primary">
                    {t.admin.usersTab}
                  </h3>
                </div>
                <p className="text-xs text-ehb-text-muted mt-1">
                  {t.admin.usersTabDesc}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={fetchUsers}
                disabled={loadingUsers}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />}
                className="shrink-0"
              >
                Refresh Directory
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <Card padding="md" className="border-purple-500/20 bg-purple-500/5 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    {language === "ar"
                      ? "صلاحيات المشرف التعليمي:"
                      : "Academic Moderator Privileges:"}
                  </strong>
                  <span className="text-[11px] text-ehb-text-muted">{t.admin.simpleAdminPrivileges}</span>
                </div>
              </Card>

              <Card padding="md" className="border-amber-500/20 bg-amber-500/5 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    {language === "ar"
                      ? "ضوابط رفع المصادر والمواد:"
                      : "Resource Upload Regulations:"}
                  </strong>
                  <span className="text-[11px] text-ehb-text-muted">{t.admin.uploadRestrictedNotice}</span>
                </div>
              </Card>
            </div>
          </Card>

          <Card padding="lg" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder={t.admin.searchUsersPlaceholder}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                size="sm"
                value={userDeptFilter}
                onChange={(e) => setUserDeptFilter(e.target.value)}
                options={[
                  { value: "all", label: "جميع الأقسام" },
                  { value: "dept-cmp", label: "💻 هندسة الحاسبات" },
                  { value: "dept-mtr", label: "🤖 هندسة الميكاترونكس" },
                ]}
              />

              <Select
                size="sm"
                value={userLevelFilter}
                onChange={(e) => setUserLevelFilter(e.target.value)}
                options={[
                  { value: "all", label: "جميع الفرق" },
                  { value: "Year 1 (Freshman)", label: "السنة الأولى" },
                  { value: "Year 2 (Sophomore)", label: "السنة الثانية" },
                ]}
              />

              <div className="flex items-center gap-1 border-l border-ehb-default pl-2">
                <Button
                  variant={userRoleFilter === "all" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setUserRoleFilter("all")}
                  className="whitespace-nowrap"
                >
                  {t.admin.filterAllRoles} ({userList.length})
                </Button>
                <Button
                  variant={userRoleFilter === "student" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setUserRoleFilter("student")}
                  className="whitespace-nowrap"
                >
                  {t.admin.filterStudents} ({userList.filter((u) => u.role === "student").length})
                </Button>
                <Button
                  variant={userRoleFilter === "admins" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setUserRoleFilter("admins")}
                  className="whitespace-nowrap"
                >
                  {t.admin.filterAdmins} ({userList.filter((u) => u.role !== "student").length})
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {userList
              .filter((u) => {
                const matchesRole =
                  userRoleFilter === "all"
                    ? true
                    : userRoleFilter === "student"
                      ? u.role === "student"
                      : u.role !== "student";
                const matchesDept =
                  userDeptFilter === "all" || !u.departmentId || u.departmentId === userDeptFilter;
                const matchesLevel =
                  userLevelFilter === "all" || !u.level || u.level === userLevelFilter;
                const matchesQuery =
                  (u.name || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  (u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  (u.studentId &&
                    u.studentId.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                  (u.departmentId &&
                    u.departmentId.toLowerCase().includes(userSearchQuery.toLowerCase()));
                return matchesRole && matchesDept && matchesLevel && matchesQuery;
              })
              .map((u) => (
                <Card key={u.id} padding="lg" className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="md"
                          src={
                            u.avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                          }
                          alt={u.name}
                          fallback={u.name}
                          className="border border-ehb-subtle"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-ehb-text-primary">{u.name}</h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {u.email}
                          </p>
                          <p className="text-[11px] text-ehb-text-muted font-mono mt-0.5">
                            ID: <bdi dir="ltr">{u.studentId || u.id}</bdi> • {u.phoneNumber || "No Phone"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          u.role === "super_admin"
                            ? "error"
                            : u.role === "department_admin"
                              ? "primary"
                              : u.role === "moderator"
                                ? "warning"
                                : "neutral"
                        }
                        size="sm"
                        className="shrink-0"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {u.role === "super_admin"
                          ? language === "ar"
                            ? "مسؤول رئيسي"
                            : "Super Admin"
                          : u.role === "department_admin"
                            ? language === "ar"
                              ? "مسؤول قسم"
                              : "Dept Admin"
                            : u.role === "supervisor"
                              ? language === "ar"
                                ? "مشرف أكاديمي"
                                : "Supervisor"
                              : u.role === "moderator"
                                ? language === "ar"
                                  ? "مشرف محتوى"
                                  : "Moderator"
                                : language === "ar"
                                  ? "طالب"
                                  : "Student"}
                      </Badge>
                    </div>

                    <Card padding="md" className="text-xs space-y-1.5 border-ehb-subtle">
                      <div className="flex justify-between text-ehb-text-primary font-semibold">
                        <span>
                          {language === "ar" ? "القسم:" : "Department:"}{" "}
                          <strong>
                            {departments.find((d) => d.id === u.departmentId)?.name ||
                              u.departmentId ||
                              (language === "ar" ? "كلية الهندسة" : "Engineering")}
                          </strong>
                        </span>
                        <span>
                          {language === "ar" ? "المستوى:" : "Level:"}{" "}
                          <strong>
                            {u.level || (language === "ar" ? "مقيد" : "Enrolled")}
                          </strong>
                        </span>
                      </div>
                      {u.bio && (
                        <p className="text-[11px] text-ehb-text-muted italic line-clamp-2">
                          &quot;{u.bio}&quot;
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-ehb-text-muted pt-1 border-t border-ehb-subtle">
                        <span>
                          {language === "ar" ? "النقاط:" : "Points:"}{" "}
                          <strong className="text-amber-500 tabular-nums">
                            {u.points || 0} {language === "ar" ? "نقطة" : "pts"}
                          </strong>
                        </span>
                        <span>
                          {language === "ar" ? "تاريخ الانضمام:" : "Joined:"}{" "}
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString(
                                language === "ar" ? "ar-EG" : "en-US",
                              )
                            : language === "ar"
                              ? "نشط"
                              : "Active"}
                        </span>
                      </div>
                    </Card>
                  </div>

                  <div className="pt-2 border-t border-ehb-subtle flex items-center justify-between gap-2">
                    {u.role === "student" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedUserForRole(u);
                          setPendingNewRole("moderator");
                          setShowRoleConfirmModal(true);
                        }}
                        leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                        className="w-full"
                      >
                        {t.admin.upgradeToAdmin}
                      </Button>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === "ar" ? "حساب بصلاحيات إدارية" : "Admin Privileges Active"}
                        </span>
                        <Select
                          size="sm"
                          value={u.role}
                          onChange={(e) => {
                            setSelectedUserForRole(u);
                            setPendingNewRole(e.target.value as UserRole);
                            setShowRoleConfirmModal(true);
                          }}
                          options={[
                            { value: "student", label: t.admin.demoteStudent },
                            { value: "moderator", label: t.admin.promoteModerator },
                            { value: "department_admin", label: t.admin.promoteDeptAdmin },
                            { value: "super_admin", label: t.admin.promoteSuperAdmin },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

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

      {activeTab === "announcements" && (
        <div className="space-y-6">
          <Card padding="lg" className="border-amber-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ehb-text-primary flex items-center gap-2">
                    <span>{t.admin.officialAnnouncementsTitle}</span>
                    <Badge variant="attention" size="sm">
                      Live Broadcast
                    </Badge>
                  </h3>
                  <p className="text-xs text-ehb-text-muted mt-0.5">
                    قم بنشر إعلانات رسمية هامة يتم تعميمها فوراً على جميع الطلاب والمستخدمين وتظهر في
                    الشاشات الرئيسية والحرم الجامعي.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-ehb-subtle pb-3">
              <Send className="w-4 h-4 text-amber-500 shrink-0" />
              <h4 className="text-xs font-black text-ehb-text-primary uppercase tracking-wider">
                {t.admin.publishAnnouncement}
              </h4>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Input
                    label={t.admin.announcementTitle}
                    required
                    value={ancTitle}
                    onChange={(e) => setAncTitle(e.target.value)}
                    placeholder="مثال: تقديم المواعيد النهائية لتسليم مشاريع التخرج / بدء تسجيل المقررات"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Textarea
                    label={t.admin.announcementContent}
                    required
                    rows={4}
                    value={ancContent}
                    onChange={(e) => setAncContent(e.target.value)}
                    placeholder="اكتب المحتوى التفصيلي للإعلان الرسمي الموجه لطلاب الكلية..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ehb-text-primary mb-1.5">
                    {t.admin.priority}
                  </label>
                  <Select
                    value={ancPriority}
                    onChange={(e) => setAncPriority(e.target.value as any)}
                    options={[
                      { value: "urgent", label: `${t.admin.urgent} 🔥` },
                      { value: "normal", label: `${t.admin.normal} 📢` },
                      { value: "low", label: `${t.admin.low} 📌` },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ehb-text-primary mb-1.5">
                    {t.admin.scope}
                  </label>
                  <Select
                    value={ancScope}
                    onChange={(e) => setAncScope(e.target.value as any)}
                    options={[
                      { value: "faculty", label: t.admin.allUsers },
                      { value: "department", label: "قسم أكاديمي معين" },
                      { value: "university", label: "الجامعة عامة" },
                    ]}
                  />
                </div>

                {ancScope === "department" && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-ehb-text-primary mb-1.5">
                      اختر القسم المستهدف
                    </label>
                    <Select
                      value={ancTargetDept}
                      onChange={(e) => setAncTargetDept(e.target.value)}
                      options={departments.map((d) => ({
                        value: d.id,
                        label: `${d.name} (${d.code})`,
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-ehb-subtle">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ehb-text-primary">
                  <input
                    type="checkbox"
                    checked={ancIsPinned}
                    onChange={(e) => setAncIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>{t.admin.pinAnnouncement}</span>
                </label>

                <Button
                  type="submit"
                  variant="attention"
                  leftIcon={<Megaphone className="w-4 h-4" />}
                >
                  {t.admin.publishAnnouncement}
                </Button>
              </div>
            </form>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-ehb-subtle pb-3">
              <h4 className="text-xs font-black text-ehb-text-primary uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                <span>سجل الإعلانات المنشورة ({announcements.length})</span>
              </h4>
            </div>

            {announcements.length === 0 ? (
              <div className="py-12 text-center text-ehb-text-muted text-xs">
                لا يوجد إعلانات منشورة حتى الآن. قم بإضافة إعلان رسمي من النموذج أعلاه.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((anc) => (
                  <Card
                    key={anc.id}
                    padding="lg"
                    className={`transition-all ${
                      anc.isPinned
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-ehb-subtle bg-ehb-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {anc.isPinned && (
                            <Badge variant="warning" size="sm" className="flex items-center gap-1">
                              <Pin className="w-3 h-3" />
                              <span>مثبت في الأعلى</span>
                            </Badge>
                          )}
                          <Badge
                            variant={
                              anc.priority === "urgent"
                                ? "error"
                                : anc.priority === "normal"
                                  ? "primary"
                                  : "neutral"
                            }
                            size="sm"
                          >
                            {anc.priority === "urgent"
                              ? "🔥 عاجل ورسمي"
                              : anc.priority === "normal"
                                ? "📢 إعلان عادي"
                                : "📌 تنويه"}
                          </Badge>
                          <span className="text-[10px] text-ehb-text-muted font-mono">
                            {anc.date}
                          </span>
                        </div>

                        <h5 className="text-sm font-extrabold text-ehb-text-primary pt-1">
                          {anc.title}
                        </h5>

                        <p className="text-xs text-ehb-text-muted whitespace-pre-wrap leading-relaxed">
                          {anc.content}
                        </p>

                        <div className="pt-2 flex items-center gap-2 text-[10px] text-ehb-text-muted">
                          <span>
                            صادر عن: <strong className="text-ehb-text-primary">{anc.authorName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onTogglePinAnnouncement && (
                          <Button
                            variant={anc.isPinned ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => onTogglePinAnnouncement(anc.id)}
                            title={anc.isPinned ? "إلغاء التثبيت" : "تثبيت الإعلان"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {onDeleteAnnouncement && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteAnnouncement(anc.id)}
                            title={t.admin.deleteAnnouncement}
                            className="text-rose-600 dark:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "events" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card padding="md" className="border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">
                  إجمالي الفعاليات والأنشطة
                </span>
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">{events.length}</span>
            </Card>

            <Card padding="md" className="border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">
                  الفعاليات المنشورة للطلاب
                </span>
                <Check className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">
                {events.filter((e) => e.status !== "draft" && e.status !== "cancelled").length}
              </span>
            </Card>

            <Card padding="md" className="border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">المسودات المؤجلة</span>
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">
                {events.filter((e) => e.status === "draft").length}
              </span>
            </Card>

            <Card padding="md" className="border-purple-500/20 bg-purple-500/5">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase">إجمالي المقاعد المسجلة</span>
                <Users className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-ehb-text-primary">
                {events.reduce((acc, curr) => acc + (curr.rsvpCount || 0), 0)}
              </span>
            </Card>
          </div>

          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-ehb-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>نماذج جاهزة لإضافة فعاليات وأنشطة طلابية جديدة</span>
                </h3>
                <p className="text-xs text-ehb-text-muted mt-1">
                  اختر أحد القوالب الجاهزة أدناه للتعبئة التلقائية، أو انقر فوق إضافة نشاط لتخصيص
                  كامل الحقول.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenNewEventModal}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shrink-0"
              >
                إضافة نشاط / فعالية جديدة
              </Button>
            </div>

            <Card padding="md" className="space-y-2 border-ehb-subtle bg-ehb-surface">
              <span className="text-[11px] font-bold text-ehb-text-muted block uppercase">
                اختر نموذجاً جاهزاً للتعبئة السريعة:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    applyEventTemplate("workshop");
                    setShowEventModal(true);
                  }}
                >
                  <span>💻 ورشة برمجية</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    applyEventTemplate("hackathon");
                    setShowEventModal(true);
                  }}
                >
                  <span>⚡ هكاثون هندسي</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    applyEventTemplate("field_trip");
                    setShowEventModal(true);
                  }}
                >
                  <span>🚌 رحلة ميدانية</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    applyEventTemplate("seminar");
                    setShowEventModal(true);
                  }}
                >
                  <span>🎤 ندوة خبير</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    applyEventTemplate("competition");
                    setShowEventModal(true);
                  }}
                >
                  <span>🏆 مسابقة ابتكار</span>
                </Button>
              </div>
            </Card>
          </Card>

          <Card padding="lg" className="space-y-4">
            <h4 className="text-xs font-black text-ehb-text-primary uppercase tracking-wider">
              سجل الفعاليات والأنشطة الطلابية
            </h4>

            {events.length === 0 ? (
              <div className="py-12 text-center text-ehb-text-muted text-xs">
                لا توجد أفعاليات أو أنشطة مضافة حالياً. انقر فوق &quot;إضافة نشاط&quot; لبدء
                الإضافة.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((evt) => {
                  const cap = evt.maxCapacity || 50;
                  const rsvps = evt.rsvpCount || 0;
                  const pct = Math.min(100, Math.round((rsvps / cap) * 100));

                  return (
                    <Card
                      key={evt.id}
                      variant="interactive"
                      padding="lg"
                      className="space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="info" size="sm" className="uppercase">
                              {evt.category}
                            </Badge>
                            <Badge
                              variant={evt.status === "draft" ? "warning" : "success"}
                              size="sm"
                            >
                              {evt.status === "draft" ? "مسودة" : "منشور للطلاب"}
                            </Badge>
                          </div>

                          <h5 className="text-sm font-extrabold text-ehb-text-primary pt-1 leading-snug">
                            {evt.title}
                          </h5>

                          <p className="text-xs text-ehb-text-muted line-clamp-2">
                            {evt.description}
                          </p>
                        </div>

                        {evt.image && (
                          <img
                            src={evt.image}
                            alt={evt.title}
                            className="w-16 h-16 rounded-ehb-md object-cover border border-ehb-subtle shrink-0"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-ehb-text-muted pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            {evt.date} ({evt.time})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-ehb-text-muted">الحضور المكتمل:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {rsvps} / {cap} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-ehb-surface-elevated-2 h-1.5 rounded-full overflow-hidden border border-ehb-subtle">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-ehb-subtle">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewRegistrantsEvent(evt)}
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                          className="text-indigo-600 dark:text-indigo-400"
                        >
                          <span>
                            عرض قائمة المسجلين ({evt.registeredStudents?.length || evt.rsvpCount})
                          </span>
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onToggleEventStatus && onToggleEventStatus(evt.id)}
                            className="text-[11px] font-bold"
                          >
                            {evt.status === "draft" ? "نشر" : "حفظ كمسودة"}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEventClick(evt)}
                            className="text-indigo-600 dark:text-indigo-400"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteEvent && onDeleteEvent(evt.id)}
                            className="text-rose-600 dark:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "assignments" && (
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

      {activeTab === "schedule" && (
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

      {activeTab === "honor_board" && (
        <HonorRollManager departments={departments} currentUser={currentUser} />
      )}

      {activeTab === "audit" && (
        <AdminAuditDashboard currentUser={currentUser} userRole={userRole} />
      )}

      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <Card padding="none" className="max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto border-ehb-default">
            <div className="p-5 border-b border-ehb-subtle flex items-center justify-between bg-ehb-surface">
              <div>
                <h3 className="text-base font-black text-ehb-text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    {editingEventId
                      ? "تعديل بيانات الفعالية والنشاط"
                      : "نموذج إدخال فعالية / نشاط طلابي جديد"}
                  </span>
                </h3>
                <p className="text-xs text-ehb-text-muted">
                  قم بتعبئة بيانات الفعالية ونشرها للطلاب مباشرة في Campus Hub.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    نوع النشاط/الفعالية
                  </label>
                  <Select
                    value={evtCategory}
                    onChange={(e) => setEvtCategory(e.target.value as EventCategory)}
                    options={[
                      { value: "workshop", label: "💻 ورشة عمل (Workshop)" },
                      { value: "hackathon", label: "⚡ هكاثون (Hackathon)" },
                      { value: "guest_lecture", label: "🎤 محاضرة ضيف / ندوة" },
                      { value: "field_trip", label: "🚌 رحلة ميدانية" },
                      { value: "competition", label: "🏆 مسابقة علمية" },
                      { value: "social", label: "🎉 نشاط اجتماعي / ترفيهي" },
                    ]}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    عنوان الفعالية أو النشاط *
                  </label>
                  <Input
                    required
                    value={evtTitle}
                    onChange={(e) => setEvtTitle(e.target.value)}
                    placeholder="مثال: ورشة العمل التطبيقية لبرمجة FPGA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    الجهة المنظمة
                  </label>
                  <Input
                    value={evtOrganizer}
                    onChange={(e) => setEvtOrganizer(e.target.value)}
                    placeholder="مثال: نادي الميكاترونكس / قسم الحاسبات"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    المحاضر / المتحدث الرئيسي
                  </label>
                  <Input
                    value={evtSpeaker}
                    onChange={(e) => setEvtSpeaker(e.target.value)}
                    placeholder="اسم المتحدث أو الضيف"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    صفة أو رتبة المتحدث
                  </label>
                  <Input
                    value={evtSpeakerTitle}
                    onChange={(e) => setEvtSpeakerTitle(e.target.value)}
                    placeholder="مثال: أستاذ الذكاء الاصطناعي / كبير مهندسي Siemens"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    السعة الاستيعابية (عدد المقاعد) *
                  </label>
                  <Input
                    type="number"
                    min={5}
                    max={500}
                    value={
                      Number.isNaN(evtMaxCapacity) || evtMaxCapacity === undefined
                        ? ""
                        : evtMaxCapacity
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEvtMaxCapacity(Number.isNaN(val) ? ("" as any) : val);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    التاريخ *
                  </label>
                  <Input
                    type="date"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    التوقيت *
                  </label>
                  <Input
                    type="text"
                    required
                    value={evtTime}
                    onChange={(e) => setEvtTime(e.target.value)}
                    placeholder="10:00 - 13:00"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    المكان / القاعة *
                  </label>
                  <Input
                    type="text"
                    required
                    value={evtLocation}
                    onChange={(e) => setEvtLocation(e.target.value)}
                    placeholder="مثال: المدرج B / قاعة المؤتمرات"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ehb-text-primary mb-1">
                  تفاصيل ونبذة عن الفعالية *
                </label>
                <Textarea
                  rows={3}
                  required
                  value={evtDescription}
                  onChange={(e) => setEvtDescription(e.target.value)}
                  placeholder="اكتب وصفاً جذاباً يوضح أهداف الفعالية وما سيستفيده الطالب..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    الفئة المستهدفة
                  </label>
                  <Input
                    value={evtTargetAudience}
                    onChange={(e) => setEvtTargetAudience(e.target.value)}
                    placeholder="مثال: جميع طلاب الكلية / طلاب السنة الثالثة"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    المتطلبات المسبقة (إن وجدت)
                  </label>
                  <Input
                    value={evtRequirements}
                    onChange={(e) => setEvtRequirements(e.target.value)}
                    placeholder="مثال: احضار جهاز حاسوب محمول / معرفة بلغة C++"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    البريد أو هاتف الاستفسار
                  </label>
                  <Input
                    value={evtContactEmail}
                    onChange={(e) => setEvtContactEmail(e.target.value)}
                    placeholder="events@eng.gnu.edu"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    صورة غلاف الفعالية (من جهازك مباشرة)
                  </label>
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
                    <Card padding="md" className="flex items-center gap-2 border-ehb-subtle">
                      <img
                        src={evtImage}
                        alt="Event Banner"
                        className="w-12 h-10 rounded-ehb-sm object-cover border border-ehb-subtle shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-ehb-text-primary block truncate">
                          {evtImageFileName || "صورة غلاف الفعالية"}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          تم اختيار الغلاف بنجاح
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => evtImageInputRef.current?.click()}
                        >
                          تغيير
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setEvtImage("");
                            setEvtImageFileName("");
                            if (evtImageInputRef.current) evtImageInputRef.current.value = "";
                          }}
                          className="text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card
                      padding="md"
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
                      className={`border border-dashed cursor-pointer transition-all text-center ${
                        isEvtImageDragging
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-ehb-default bg-ehb-surface hover:bg-ehb-surface-elevated-2 hover:border-emerald-500"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-bold">رفع صورة الغلاف من جهازك</span>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              <Card padding="md" className="flex items-center justify-between border-ehb-subtle">
                <div>
                  <span className="font-bold text-ehb-text-primary block">
                    حالة النشر والظهور
                  </span>
                  <span className="text-[11px] text-ehb-text-muted">
                    اختر إما النشر الفوري للطلاب أو الحفظ كمسودة للتعديل لاحقاً.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-ehb-text-primary">
                    <input
                      type="radio"
                      name="evtStatus"
                      value="published"
                      checked={evtStatus === "published"}
                      onChange={() => setEvtStatus("published")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>نشر فوري</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-ehb-text-primary">
                    <input
                      type="radio"
                      name="evtStatus"
                      value="draft"
                      checked={evtStatus === "draft"}
                      onChange={() => setEvtStatus("draft")}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>حفظ كمسودة</span>
                  </label>
                </div>
              </Card>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ehb-subtle">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowEventModal(false)}
                >
                  إلغاء
                </Button>

                <Button
                  type="submit"
                  variant="success"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  {editingEventId ? "حفظ التعديلات" : "نشر الفعالية للطلاب"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {viewRegistrantsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <Card padding="none" className="max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden my-auto border-ehb-default">
            <div className="p-5 border-b border-ehb-subtle flex items-center justify-between bg-ehb-surface">
              <div>
                <h3 className="text-base font-black text-ehb-text-primary flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>قائمة الطلاب المسجلين في الفعالية</span>
                </h3>
                <p className="text-xs text-ehb-text-muted">
                  {viewRegistrantsEvent.title} (الإجمالي:{" "}
                  {viewRegistrantsEvent.registeredStudents?.length ||
                    viewRegistrantsEvent.rsvpCount}{" "}
                  طالب)
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewRegistrantsEvent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {!viewRegistrantsEvent.registeredStudents ||
              viewRegistrantsEvent.registeredStudents.length === 0 ? (
                <Card padding="lg" className="text-center space-y-2">
                  <Users className="w-8 h-8 text-ehb-text-muted mx-auto" />
                  <p className="text-xs font-bold text-ehb-text-primary">
                    تم حجز المقاعد عن طريق RSVP السريع ({viewRegistrantsEvent.rsvpCount} طالب).
                  </p>
                  <p className="text-[11px] text-ehb-text-muted">
                    عند تسجيل الطلاب باستخدام حواسبهم يظهر اسم الطالب ورقم القيد البرمجي هنا
                    تلقائياً.
                  </p>
                </Card>
              ) : (
                <Card padding="none" className="overflow-hidden border-ehb-default">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-ehb-surface text-ehb-text-muted font-bold border-b border-ehb-subtle">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">اسم الطالب</th>
                          <th className="p-3">البريد الأكاديمي</th>
                          <th className="p-3">الرقم الجامعي</th>
                          <th className="p-3">القسم</th>
                          <th className="p-3">تاريخ التسجيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ehb-subtle font-medium">
                        {viewRegistrantsEvent.registeredStudents.map((st, idx) => (
                          <tr
                            key={st.id || idx}
                            className="hover:bg-ehb-surface-elevated transition-colors"
                          >
                            <td className="p-3 font-mono font-bold text-ehb-text-muted">{idx + 1}</td>
                            <td className="p-3 font-bold text-ehb-text-primary">{st.name}</td>
                            <td className="p-3 text-ehb-text-muted font-mono">{st.email}</td>
                            <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">
                              {st.studentId || "N/A"}
                            </td>
                            <td className="p-3 text-ehb-text-muted">{st.departmentName || "عام"}</td>
                            <td className="p-3 text-ehb-text-muted font-mono text-[11px]">
                              {st.registeredAt}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            <div className="p-4 bg-ehb-surface border-t border-ehb-subtle flex items-center justify-between">
              <span className="text-xs font-bold text-ehb-text-muted">
                السعة القصوى: {viewRegistrantsEvent.maxCapacity || 50} مقعد
              </span>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const headers = "Name,Email,StudentId,Department,RegisteredAt\n";
                  const rows = (viewRegistrantsEvent.registeredStudents || [])
                    .map(
                      (s) =>
                        `"${s.name}","${s.email}","${s.studentId || ""}","${s.departmentName || ""}","${s.registeredAt}"`,
                    )
                    .join("\n");
                  const blob = new Blob([headers + rows], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `registrants-${viewRegistrantsEvent.id}.csv`;
                  a.click();
                }}
                leftIcon={<Download className="w-4 h-4" />}
              >
                تصدير القائمة (CSV)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showSupervisorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <Card padding="none" className="max-w-xl w-full flex flex-col overflow-hidden my-auto border-ehb-default">
            <div className="p-5 border-b border-ehb-subtle flex items-center justify-between bg-purple-500/5">
              <div>
                <h3 className="text-base font-black text-ehb-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    {editingSupervisor
                      ? "تعديل نطاق وصلاحيات المشرف"
                      : "تعيين مشرف وتحديد التخصص والسنة الدراسية"}
                  </span>
                </h3>
                <p className="text-xs text-ehb-text-muted">
                  حدد القسم والفرقة الدراسية والصلاحيات المسموح بها لهذا المشرف.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSupervisorModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSaveSupervisorScope} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    اسم المشرف / الأخصائي *
                  </label>
                  <Input
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="مثال: د. طارق عبد المجيد / م. عمر الشريف"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ehb-text-primary mb-1">
                    البريد الإلكتروني *
                  </label>
                  <Input
                    type="email"
                    required
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="supervisor@tnu.edu.eg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ehb-text-primary mb-1">
                  المسمى الوظيفي / الصفة الأكاديمية
                </label>
                <Input
                  value={supTitle}
                  onChange={(e) => setSupTitle(e.target.value)}
                  placeholder="مثال: أخصائي السنة الأولى - قسم هندسة الحاسبات"
                />
              </div>

              <Card padding="lg" className="border-purple-500/20 bg-purple-500/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ehb-text-primary mb-1">
                      القسم المستهدف (التخصص) *
                    </label>
                    <Select
                      value={supDeptId}
                      onChange={(e) => setSupDeptId(e.target.value)}
                      options={[
                        { value: "dept-cmp", label: "💻 قسم هندسة الحاسبات والذكاء الاصطناعي" },
                        { value: "dept-mtr", label: "🤖 قسم هندسة الميكاترونكس والروبوتات" },
                        { value: "all", label: "🌐 كافة الأقسام (إشراف عام)" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ehb-text-primary mb-1">
                      السنة الدراسية المستهدفة *
                    </label>
                    <Select
                      value={supLevel}
                      onChange={(e) => setSupLevel(e.target.value)}
                      options={[
                        { value: "all", label: "📚 جميع السنوات المتاحة (السنة الأولى والثانية)" },
                        { value: "Year 1 (Freshman)", label: "🎓 السنة الأولى (إعدادي)" },
                        { value: "Year 2 (Sophomore)", label: "📘 السنة الثانية - الترم الأول" },
                      ]}
                    />
                  </div>
                </div>
              </Card>

              <div className="space-y-2 pt-2">
                <label className="block font-black text-ehb-text-primary uppercase tracking-wider">
                  حدد الصلاحيات الممنوحة داخل هذا التخصص:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface cursor-pointer hover:bg-ehb-surface-elevated-2">
                    <input
                      type="checkbox"
                      checked={supCanManageCourses}
                      onChange={(e) => setSupCanManageCourses(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-ehb-text-primary">
                      إضافة وتعديل المقررات الدراسية
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface cursor-pointer hover:bg-ehb-surface-elevated-2">
                    <input
                      type="checkbox"
                      checked={supCanUploadResources}
                      onChange={(e) => setSupCanUploadResources(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-ehb-text-primary">
                      رفع واقتراح المراجع والمعامل
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface cursor-pointer hover:bg-ehb-surface-elevated-2">
                    <input
                      type="checkbox"
                      checked={supCanUploadCertificates}
                      onChange={(e) => setSupCanUploadCertificates(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-ehb-text-primary">
                      إسناد الشهادات الأكاديمية
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface cursor-pointer hover:bg-ehb-surface-elevated-2">
                    <input
                      type="checkbox"
                      checked={supCanPublishAnnouncements}
                      onChange={(e) => setSupCanPublishAnnouncements(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-ehb-text-primary">
                      نشر إعلانات رسمية للقسم
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-ehb-subtle">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowSupervisorModal(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  حفظ وتعريف نطاق المشرف
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

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
