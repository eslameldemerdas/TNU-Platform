import { GraduationCap } from "lucide-react";
import React, { useState, useEffect } from "react";

import { AuthModal, AuthMode } from "./components/AuthModal";
import { CommandPalette } from "./components/CommandPalette";
import { Header } from "./components/Header";
import { OnboardingModal } from "./components/OnboardingModal";
import { ProfileModal } from "./components/ProfileModal";
import { Sidebar, SidebarTab } from "./components/Sidebar";
import { UploadModal } from "./components/UploadModal";
import { AdminModerationView } from "./components/admin/AdminModerationView";
import { CourseFormModal } from "./components/admin/CourseFormModal";
import { AIAssistantModal } from "./components/ai/AIAssistantModal";
import { CampusHubView } from "./components/campus/CampusHubView";
import { ConfirmModal } from "./components/common/ConfirmModal";
import { CourseCoverImage } from "./components/common/CourseCoverImage";

// Layout & UI Components
import { NotFoundView, ServerErrorView, ErrorBoundary } from "./components/common/ErrorPages";
import { ToastContainer, ToastMessage } from "./components/common/Toast";
import { CommunityView } from "./components/community/CommunityView";
import { CourseWorkspace } from "./components/courses/CourseWorkspace";
import { FilePreviewModal } from "./components/courses/FilePreviewModal";
import { DashboardView } from "./components/dashboard/DashboardView";
import { StudyToolsView } from "./components/study/StudyToolsView";
import {
  INITIAL_USER,
  INITIAL_DEPARTMENTS,
  INITIAL_COURSES,
  INITIAL_FILES,
  INITIAL_DISCUSSIONS,
  INITIAL_COMMENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SCHEDULE,
  INITIAL_LEDGER,
  INITIAL_EVENTS,
  INITIAL_LOST_FOUND,
  INITIAL_MARKETPLACE,
  INITIAL_CLUBS,
} from "./data/mockData";
import { EngHubStorage, getAuthHeaders, getSessionToken, setSessionToken } from "./lib/storage";

// Views (High-Performance Instant Loading)
import {
  UserProfile,
  Department,
  Course,
  StudyFile,
  DiscussionThread,
  Comment,
  Assignment,
  ScheduleItem,
  PointsLedgerEntry,
  Announcement,
  CampusEvent,
  EventRegistrant,
  LostFoundItem,
  MarketplaceItem,
  StudentClub,
} from "./types";
import { getCourseCoverSvg } from "./utils/courseCovers";

const GUEST_USER: UserProfile = {
  id: "",
  name: "Visitor / Guest",
  email: "guest@student.edu",
  phoneNumber: "",
  studentId: "Not Signed In",
  role: "student",
  universityId: "uni-gnue-01",
  facultyId: "fac-eng-01",
  departmentId: "dept-cmp-01",
  level: "Year 1 (Freshman)",
  semester: "Fall 2026",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  bio: "Sign in to access personalized courses, study materials, and contribution badges.",
  points: 0,
  badges: [],
  savedBookmarks: [],
  enrolledCourseIds: [],
  createdAt: new Date().toISOString(),
};

export default function App() {
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem("enghub_theme");
        if (saved) return saved === "dark";
      }
    } catch {
      // Storage restricted or unavailable
    }
    return true; // Default dark
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("enghub_theme", "dark");
        }
      } else {
        document.documentElement.classList.remove("dark");
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("enghub_theme", "light");
        }
      }
    } catch {
      // Storage restricted or unavailable
    }
  }, [isDarkMode]);

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    description?: string,
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // User Profile State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      return EngHubStorage.getUser();
    } catch {
      return INITIAL_USER;
    }
  });

  const activeUser = user || GUEST_USER;

  const handleSaveProfile = (updated: UserProfile) => {
    if (updated.level === "Year 1 (Freshman)") {
      updated.enrolledCourseIds = [
        "course-eng011",
        "course-eng021",
        "course-eng041",
        "course-eng031",
        "course-eng051",
        "course-hum011",
      ];
    } else if (updated.level === "Year 2 (Sophomore)") {
      updated.enrolledCourseIds = [
        "course-hum131",
        "course-engx13",
        "course-aie101",
        "course-aie111",
        "course-aie103",
        "course-humx32",
      ];
    }
    setUser(updated);
    EngHubStorage.saveUser(updated);
    addToast("success", "Profile Updated", "Your academic details have been saved.");
  };

  // Data Collections State
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [files, setFiles] = useState<StudyFile[]>(INITIAL_FILES);
  const [discussions, setDiscussions] = useState<DiscussionThread[]>(INITIAL_DISCUSSIONS);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [ledger] = useState<PointsLedgerEntry[]>(INITIAL_LEDGER);
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    EngHubStorage.getAnnouncements(),
  );
  const [events, setEvents] = useState<CampusEvent[]>(INITIAL_EVENTS);
  const [lostFound, setLostFound] = useState<LostFoundItem[]>(INITIAL_LOST_FOUND);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>(INITIAL_MARKETPLACE);
  const [clubs, setClubs] = useState<StudentClub[]>(INITIAL_CLUBS);

  // Active View & Filters
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [activeDeptId, setActiveDeptId] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Modals Visibility State
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Course Admin Management States
  const [appCourseModalOpen, setAppCourseModalOpen] = useState(false);
  const [appEditingCourse, setAppEditingCourse] = useState<Course | null>(null);
  const [appDeletingCourse, setAppDeletingCourse] = useState<Course | null>(null);

  // Mobile Sidebar State
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Verify Active Auth Session on Mount
  useEffect(() => {
    fetch("/api/auth/me", {
      headers: getAuthHeaders(),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          EngHubStorage.saveUser(data.user);
        } else {
          // If token expired or invalid, clear token
          if (getSessionToken()) {
            setSessionToken(null);
          }
          try {
            const saved = EngHubStorage.getUser();
            if (!saved) {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    }
    setSessionToken(null);
    setUser(null);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("enghub_user");
      }
    } catch {
      // ignore
    }
    setAuthMode("login");
    setShowAuthModal(true);
    addToast("info", "Signed Out", "You have been signed out of your account.");
  };

  // Active Department Helper
  const activeDept = departments.find((d) => d.id === activeDeptId);

  // Selected Course Helper
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  // Selected File Helper
  const selectedFile = files.find((f) => f.id === selectedFileId);

  // --- ACTIONS & HANDLERS ---

  // Upload Study Resource Handler
  const handleUploadFileSubmit = async (fileData: Partial<StudyFile> & { fileData?: string }) => {
    if (!activeUser) {
      addToast("error", "تسجيل الدخول مطلوب", "يرجى تسجيل الدخول لرفع الملفات الأكاديمية.");
      return;
    }

    const payload: any = {
      title: fileData.title || "ملخص دراسي جديد",
      description: fileData.description || "",
      courseId: fileData.courseId || courses[0]?.id || "course-eng011",
      courseCode: fileData.courseCode || courses[0]?.code || "ENG",
      departmentId: activeUser.departmentId || "dept-cmp",
      category: fileData.category || "summary",
      fileType: fileData.fileType || "pdf",
      fileName: fileData.fileName || "upload.pdf",
      fileData: fileData.fileData || "",
      previewContent: fileData.previewContent,
      tags: fileData.tags || [],
      academicYear: fileData.academicYear || activeUser.level || "Year 1 (Freshman)",
      semester: fileData.semester || "Fall 2026",
    };

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.resource) {
        await fetchFiles();
        addToast(
          "success",
          data.message || "تم نشر الملف بنجاح!",
          "تم توثيق الملف في مساحة المقرر.",
        );
      } else {
        addToast(
          "error",
          "خطأ في رفع الملف",
          data.message || data.error?.message || "فشل رفع الملف.",
        );
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر رفع الملف. يرجى المحاولة مرة أخرى.");
    }
  };

  // Moderate Files Handlers
  const handleApproveFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/resources/${fileId}/moderate`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchFiles();
        addToast(
          "success",
          "تم اعتماد ونشر الملف بنجاح",
          "الملف معروض الآن للطلاب في قسم الملخصات والقوانين.",
        );
      } else {
        addToast(
          "error",
          "خطأ في اعتماد الملف",
          data.message || data.error?.message || "فشل اعتماد الملف.",
        );
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر اعتماد الملف. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleRejectFile = async (fileId: string, reason: string) => {
    try {
      const res = await fetch(`/api/resources/${fileId}/moderate`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ action: "reject", rejectionReason: reason }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchFiles();
        addToast("info", "تم رفض الملف", `تم إشعار الرافع بسبب الرفض: ${reason}`);
      } else {
        addToast(
          "error",
          "خطأ في رفض الملف",
          data.message || data.error?.message || "فشل رفض الملف.",
        );
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر رفض الملف. يرجى المحاولة مرة أخرى.");
    }
  };

  useEffect(() => {
    fetch("/api/courses?limit=100")
      .then((res) => res.json())
      .then((data) => {
        const loadedCourses = Array.isArray(data) ? data : data.courses;
        if (Array.isArray(loadedCourses) && loadedCourses.length > 0) {
          setCourses(loadedCourses);
        }
      })
      .catch(() => {});
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses?limit=100");
      const data = await res.json();
      const loadedCourses = Array.isArray(data) ? data : data.courses;
      if (Array.isArray(loadedCourses)) setCourses(loadedCourses);
    } catch {
      // ignore fetch errors
    }
  };

  useEffect(() => {
    fetch("/api/resources?limit=100")
      .then((res) => res.json())
      .then((data) => {
        const loaded = Array.isArray(data) ? data : data.resources;
        if (Array.isArray(loaded) && loaded.length > 0) {
          setFiles(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/resources?limit=100");
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : data.resources;
      if (Array.isArray(loaded)) setFiles(loaded);
    } catch {
      // ignore fetch errors
    }
  };

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        const loaded = Array.isArray(data) ? data : data.announcements;
        if (Array.isArray(loaded) && loaded.length > 0) {
          setAnnouncements(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : data.announcements;
      if (Array.isArray(loaded)) setAnnouncements(loaded);
    } catch {
      // ignore fetch errors
    }
  };

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        const loaded = Array.isArray(data) ? data : data.events;
        if (Array.isArray(loaded) && loaded.length > 0) {
          setEvents(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : data.events;
      if (Array.isArray(loaded)) setEvents(loaded);
    } catch {
      // ignore fetch errors
    }
  };

  useEffect(() => {
    fetch("/api/assignments?limit=100")
      .then((res) => res.json())
      .then((data) => {
        const loaded = Array.isArray(data) ? data : data.assignments;
        if (Array.isArray(loaded) && loaded.length > 0) {
          setAssignments(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments?limit=100");
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : data.assignments;
      if (Array.isArray(loaded)) setAssignments(loaded);
    } catch {
      // ignore fetch errors
    }
  };

  useEffect(() => {
    fetch("/api/schedules")
      .then((res) => res.json())
      .then((data) => {
        const loaded = Array.isArray(data) ? data : data.schedules;
        if (Array.isArray(loaded) && loaded.length > 0) {
          setSchedule(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : data.schedules;
      if (Array.isArray(loaded)) setSchedule(loaded);
    } catch {
      // ignore fetch errors
    }
  };

  // Course Admin Management Handlers
  const handleAddCourse = async (newCourseData: Partial<Course>) => {
    const payload = {
      code: newCourseData.code || "ENG 100",
      title: newCourseData.title || "New Engineering Course",
      departmentId: newCourseData.departmentId || departments[0]?.id || "dept-cmp",
      level: newCourseData.level || "Year 1 (Freshman)",
      semester: newCourseData.semester || "Fall 2026",
      credits: Number(newCourseData.credits) || 3,
      creditHours: Number(newCourseData.credits) || 3,
      instructor: newCourseData.instructor || "أستاذ غير محدد",
      instructorEmail: newCourseData.instructorEmail || "faculty@eng.gnu.edu",
      description: newCourseData.description || "مقرر دراسي أكاديمي جديد.",
      syllabus: newCourseData.syllabus || [
        "مقدمة في المادة",
        "المفاهيم الأساسية",
        "التطبيقات والتمارين المعملية",
        "التقييم النهائي",
      ],
      scheduleDayTime: newCourseData.scheduleDayTime || "Mon/Wed 10:00 - 11:30 AM",
      location: newCourseData.location || "كلية الهندسة",
      prerequisites: newCourseData.prerequisites || [],
      gradingScheme: newCourseData.gradingScheme || [
        { category: "Midterm", weight: 30 },
        { category: "Final Exam", weight: 40 },
        { category: "Lab & Assignments", weight: 30 },
      ],
      bannerImage: newCourseData.bannerImage || getCourseCoverSvg(newCourseData.code || "ENG101"),
    };

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.course) {
        await fetchCourses();
        addToast(
          "success",
          "تم إضافة المقرر بنجاح",
          `تم إضافة وحفظ المقرر ${data.course.code} في قاعدة البيانات.`,
        );
      } else if (res.status === 401 || res.status === 403) {
        addToast(
          "error",
          "مطلوب تسجيل الدخول كمسؤول أو مشرف",
          "يرجى تسجيل الدخول بحساب المشرف أو مسؤول النظام لإضافة المقررات الدراسية.",
        );
        setAuthMode("login");
        setShowAuthModal(true);
      } else {
        const errorMsg = data.message || data.error?.message || data.error || "فشل إضافة المقرر";
        addToast("error", "خطأ في إضافة المادة", String(errorMsg));
      }
    } catch (err: any) {
      console.error("[Frontend handleAddCourse] Network error:", err);
      addToast("error", "خطأ في الاتصال", "تعذر حفظ المقرر في الخادم وقاعدة البيانات.");
    }
  };

  const handleUpdateCourse = async (courseId: string, updatedData: Partial<Course>) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (res.ok && data.course) {
        await fetchCourses();
        addToast(
          "success",
          "تم تعديل المادة بنجاح",
          `تم حفظ تعديلات المقرر ${data.course.code || ""} في قاعدة البيانات.`,
        );
      } else if (res.status === 401 || res.status === 403) {
        addToast(
          "error",
          "مطلوب تسجيل الدخول كمسؤول أو مشرف",
          "يرجى تسجيل الدخول بحساب المشرف أو مسؤول النظام لتعديل المقررات الدراسية.",
        );
        setAuthMode("login");
        setShowAuthModal(true);
      } else {
        const errorMsg = data.message || data.error?.message || "فشل تعديل المادة";
        addToast("error", "خطأ في تعديل المادة", String(errorMsg));
      }
    } catch (err) {
      console.error("[Frontend handleUpdateCourse] Network error:", err);
      addToast("error", "خطأ في الاتصال", "تعذر حفظ تعديلات المقرر في الخادم وقاعدة البيانات.");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const courseToDelete = courses.find((c) => c.id === courseId);

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (res.ok) {
        await fetchCourses();
        if (selectedCourseId === courseId) {
          setSelectedCourseId(null);
        }
        addToast(
          "info",
          "تم حذف المادة بنجاح",
          `تم حذف وأرشفة المقرر ${courseToDelete?.code || ""} من قاعدة البيانات.`,
        );
      } else if (res.status === 401 || res.status === 403) {
        addToast(
          "error",
          "مطلوب تسجيل الدخول كمسؤول أو مشرف",
          "يرجى تسجيل الدخول بحساب المشرف أو مسؤول النظام لحذف المقررات الدراسية.",
        );
        setAuthMode("login");
        setShowAuthModal(true);
      } else {
        const data = await res.json().catch(() => ({}));
        addToast("error", "فشل حذف المادة", data.message || "تعذر حذف المقرر.");
      }
    } catch (err) {
      console.error("[Frontend handleDeleteCourse] Network error:", err);
      addToast("error", "خطأ في الاتصال", "تعذر حذف المقرر. لم يتم حذف المادة من قاعدة البيانات.");
    }
  };

  // Official Announcements Handlers
  const handleAddAnnouncement = async (ancData: Omit<Announcement, "id" | "date">) => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(ancData),
      });
      const data = await res.json();
      if (res.ok && data.announcement) {
        await fetchAnnouncements();
        addToast(
          "success",
          "تم نشر الإعلان الرسمي",
          `تم تعميم: "${data.announcement.title}" على جميع المستخدمين.`,
        );
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل نشر الإعلان.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر نشر الإعلان. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        await fetchAnnouncements();
        addToast("info", "تم حذف الإعلان", "تم إزالة الإعلان بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل حذف الإعلان.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر حذف الإعلان. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleTogglePinAnnouncement = async (announcementId: string) => {
    try {
      const announcement = announcements.find((a) => a.id === announcementId);
      if (!announcement) return;
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ isPinned: !announcement.isPinned }),
      });
      const data = await res.json();
      if (res.ok && data.announcement) {
        await fetchAnnouncements();
        addToast("success", "تم تحديث الإعلان", "تم تغيير حالة التثبيت بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل تحديث الإعلان.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر تحديث الإعلان. يرجى المحاولة مرة أخرى.");
    }
  };

  // Discussion & Comments Handlers
  const handleNewDiscussion = (courseId: string, title: string, content: string) => {
    const newDisc: DiscussionThread = {
      id: `disc-${Date.now()}`,
      courseId,
      title,
      content,
      authorId: activeUser.id,
      authorName: activeUser.name,
      authorDepartment: activeDept?.name || "Computer Engineering",
      authorRole: activeUser.role,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      hasUpvoted: true,
      replyCount: 0,
      isSolved: false,
      tags: ["Course Q&A"],
    };
    setDiscussions((prev) => [newDisc, ...prev]);
    addToast("success", "Discussion Thread Posted", "Fellow students and TAs can now reply.");
  };

  const handleUpvoteDiscussion = (discId: string) => {
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discId) {
          const hasUp = d.hasUpvoted;
          return {
            ...d,
            upvotes: hasUp ? d.upvotes - 1 : d.upvotes + 1,
            hasUpvoted: !hasUp,
          };
        }
        return d;
      }),
    );
  };

  const handleAddComment = (targetId: string, content: string) => {
    const newCmt: Comment = {
      id: `cmt-${Date.now()}`,
      targetType: "discussion",
      targetId,
      authorId: activeUser.id,
      authorName: activeUser.name,
      authorDepartment: activeDept?.name || "Engineering",
      authorRole: activeUser.role,
      content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false,
    };
    setComments((prev) => [...prev, newCmt]);
    setDiscussions((prev) =>
      prev.map((d) => (d.id === targetId ? { ...d, replyCount: d.replyCount + 1 } : d)),
    );
    addToast("success", "Comment Posted", "Your reply is added to the discussion.");
  };

  // Resource Helpful / Not Helpful Voting
  const handleVoteResource = async (fileId: string, voteType: "helpful" | "not_helpful") => {
    // Optimistic UI update
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const currentHelpful = f.helpfulCount || 0;
          const currentNotHelpful = f.notHelpfulCount || 0;
          const previousVote = f.userVote;

          let newHelpful = currentHelpful;
          let newNotHelpful = currentNotHelpful;

          if (previousVote === voteType) {
            // Unvote
            if (voteType === "helpful") newHelpful = Math.max(0, currentHelpful - 1);
            if (voteType === "not_helpful") newNotHelpful = Math.max(0, currentNotHelpful - 1);
            return {
              ...f,
              helpfulCount: newHelpful,
              notHelpfulCount: newNotHelpful,
              userVote: undefined,
            };
          }

          if (previousVote === "helpful") newHelpful = Math.max(0, currentHelpful - 1);
          if (previousVote === "not_helpful") newNotHelpful = Math.max(0, currentNotHelpful - 1);

          if (voteType === "helpful") newHelpful += 1;
          if (voteType === "not_helpful") newNotHelpful += 1;

          return {
            ...f,
            helpfulCount: newHelpful,
            notHelpfulCount: newNotHelpful,
            userVote: voteType,
          };
        }
        return f;
      }),
    );

    try {
      await fetch(`/api/resources/${fileId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      addToast(
        "success",
        "تم تسجيل تقييمك",
        voteType === "helpful" ? "شكراً لتقييمك الإيجابي للمرجع!" : "تم تسجيل ملاحظتك.",
      );
    } catch {
      // Offline / fallback fallback
    }
  };

  // File Rating & Bookmark
  const handleRateFile = (fileId: string, rating: number) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const currentCount = f.ratingCount || 0;
          const currentRating = f.rating || 0;
          const newCount = currentCount + 1;
          const calcRating = Number(
            ((currentRating * currentCount + rating) / newCount).toFixed(1),
          );
          const newRating = Number.isNaN(calcRating) ? rating : calcRating;
          return { ...f, rating: newRating, ratingCount: newCount };
        }
        return f;
      }),
    );
    addToast("success", "Rating Saved", `Submitted ${rating}-star rating for this resource.`);
  };

  const handleToggleBookmark = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isBookmarked: !f.isBookmarked } : f)),
    );
    addToast("info", "Bookmark Updated", "Saved files are accessible in your study workspace.");
  };

  // Study Tools Assignments
  const handleAddAssignment = async (asgnData: Partial<Assignment>) => {
    try {
      const payload = {
        courseId: asgnData.courseId || courses[0].id,
        courseCode: asgnData.courseCode || "ENG",
        title: asgnData.title || "New Assignment",
        description: asgnData.description || "",
        dueDate: asgnData.dueDate || new Date().toISOString().split("T")[0],
        totalPoints: asgnData.totalPoints || 20,
        weightPercent: asgnData.weightPercent || 10,
        status: "todo",
        attachmentUrl: asgnData.attachmentUrl,
        attachmentName: asgnData.attachmentName,
        departmentId: asgnData.departmentId,
        level: asgnData.level,
      };
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        await fetchAssignments();
        addToast("success", "تم نشر التكليف بنجاح", `تم تعميم التكليف "${data.assignment.title}" للمقرر.`);
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل إضافة التكليف.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر إضافة التكليف. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleUpdateAssignment = async (id: string, asgnData: Partial<Assignment>) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(asgnData),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        await fetchAssignments();
        addToast("success", "تم تعديل التكليف", "تم تحديث بيانات الشيت/الواجب بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل تعديل التكليف.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر تعديل التكليف. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        await fetchAssignments();
        addToast("info", "تم حذف التكليف", "تم إزالة الواجب الدراسي بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل حذف التكليف.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر حذف التكليف. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleUpdateAssignmentStatus = async (id: string, status: Assignment["status"]) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        await fetchAssignments();
        addToast("info", "تحديث حالة التسليم", `تم تغيير الحالة إلى ${status}.`);
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل تحديث الحالة.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر تحديث الحالة. يرجى المحاولة مرة أخرى.");
    }
  };

  // Schedule Handlers
  const handleAddScheduleItem = async (itemData: Omit<ScheduleItem, "id">) => {
    try {
      const payload = {
        courseId: itemData.courseId,
        courseCode: itemData.courseCode,
        courseTitle: itemData.title,
        instructor: itemData.instructor,
        dayOfWeek: itemData.dayOfWeek,
        startTime: itemData.startTime,
        endTime: itemData.endTime,
        hall: itemData.location,
        type: itemData.type,
        departmentId: itemData.departmentId,
        level: itemData.level,
      };
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.schedule) {
        await fetchSchedule();
        addToast(
          "success",
          "تم إضافة المحاضرة للجدول",
          `تم توثيق حصة "${data.schedule.courseCode}" يوم ${data.schedule.dayOfWeek}`,
        );
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل إضافة الحصة.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر إضافة الحصة. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleUpdateScheduleItem = async (id: string, itemData: Partial<ScheduleItem>) => {
    try {
      const payload: any = {};
      if (itemData.title) payload.courseTitle = itemData.title;
      if (itemData.instructor) payload.instructor = itemData.instructor;
      if (itemData.dayOfWeek) payload.dayOfWeek = itemData.dayOfWeek;
      if (itemData.startTime) payload.startTime = itemData.startTime;
      if (itemData.endTime) payload.endTime = itemData.endTime;
      if (itemData.location) payload.hall = itemData.location;
      if (itemData.type) payload.type = itemData.type;
      if (itemData.departmentId) payload.departmentId = itemData.departmentId;
      if (itemData.level) payload.level = itemData.level;

      const res = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.schedule) {
        await fetchSchedule();
        addToast("success", "تم تعديل الجدول الأسبوعي", "تم تحديث الموعد والقاعة بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل تعديل الحصة.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر تعديل الحصة. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleDeleteScheduleItem = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSchedule();
        addToast("info", "تم حذف المحاضرة من الجدول", "تم إزالة الحصة الدراسية بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل حذف الحصة.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر حذف الحصة. يرجى المحاولة مرة أخرى.");
    }
  };

  // Campus Events CRUD & RSVP Handlers
  const handleAddEvent = async (eventData: Omit<CampusEvent, "id" | "rsvpCount" | "hasRsvped">) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        await fetchEvents();
        addToast(
          "success",
          "تم إضافة الفعالية بنجاح",
          `تم إضافة "${data.event.title}" إلى قائمة الفعاليات.`,
        );
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل إضافة الفعالية.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر إضافة الفعالية. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleUpdateEvent = async (eventId: string, eventUpdate: Partial<CampusEvent>) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(eventUpdate),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        await fetchEvents();
        addToast("success", "تم تعديل الفعالية", "تم تحديث بيانات الفعالية بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل تعديل الفعالية.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر تعديل الفعالية. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        await fetchEvents();
        addToast("info", "تم حذف الفعالية", "تم إزالة الفعالية بنجاح.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل حذف الفعالية.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر حذف الفعالية. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleToggleEventStatus = async (eventId: string) => {
    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;
      const newStatus = event.status === "draft" ? "published" : "draft";
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        await fetchEvents();
        addToast("info", "تم تحديث حالة الفعالية", "تم تغيير حالة الظهور والاعتماد.");
      } else {
        addToast("error", "خطأ", data.message || data.error?.message || "فشل تحديث الحالة.");
      }
    } catch {
      addToast("error", "خطأ في الاتصال", "تعذر تحديث الحالة. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleToggleRSVP = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const hasR = e.hasRsvped;
          const currentRegistrants = e.registeredStudents || [];
          let updatedRegistrants = [...currentRegistrants];

          if (!hasR) {
            const studentEntry: EventRegistrant = {
              id: activeUser.id || `st-${Date.now()}`,
              name: activeUser.name,
              email: activeUser.email,
              studentId: activeUser.studentId,
              departmentName: activeDept?.name || "Computer Engineering",
              registeredAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            };
            if (!updatedRegistrants.some((s) => s.email === activeUser.email)) {
              updatedRegistrants.push(studentEntry);
            }
          } else {
            updatedRegistrants = updatedRegistrants.filter((s) => s.email !== activeUser.email);
          }

          return {
            ...e,
            hasRsvped: !hasR,
            rsvpCount: !hasR ? e.rsvpCount + 1 : Math.max(0, e.rsvpCount - 1),
            registeredStudents: updatedRegistrants,
          };
        }
        return e;
      }),
    );
    addToast("success", "تم تسجيل المقعد", "تم إضافة الفعالية وسيرتك إلى قائمة المسجلين الرسمية.");
  };

  const handleToggleClubJoin = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id === clubId) {
          const isJ = c.isJoined;
          return {
            ...c,
            isJoined: !isJ,
            memberCount: isJ ? c.memberCount - 1 : c.memberCount + 1,
          };
        }
        return c;
      }),
    );
    addToast("success", "Club Membership Updated", "You are now connected with society members.");
  };

  const handleAddMarketplaceItem = (itemData: Partial<MarketplaceItem>) => {
    const uploadedImages = itemData.images || (itemData.image ? [itemData.image] : []);
    const newItem: MarketplaceItem = {
      id: `mkt-${Date.now()}`,
      title: itemData.title || "Item for Sale",
      description: itemData.description || "",
      price: itemData.price || 15,
      currency: "$",
      category: itemData.category || "textbook",
      condition: itemData.condition || "good",
      sellerName: user?.name || activeUser?.name || "Student Seller",
      sellerDepartment: activeDept?.name || "Engineering",
      contactInfo: itemData.contactInfo || "",
      whatsappNumber: itemData.whatsappNumber || "",
      date: new Date().toISOString().split("T")[0],
      status: "available",
      image: uploadedImages.length > 0 ? uploadedImages[0] : itemData.image,
      images: uploadedImages,
    };
    setMarketplace((prev) => [newItem, ...prev]);
    addToast("success", "Marketplace Listing Created", "Listing published on campus hub.");
  };

  const handleAddLostFoundItem = (itemData: Partial<LostFoundItem>) => {
    const newItem: LostFoundItem = {
      id: `laf-${Date.now()}`,
      title: itemData.title || "Item",
      description: itemData.description || "",
      type: itemData.type || "lost",
      location: itemData.location || "Engineering Building",
      date: new Date().toISOString().split("T")[0],
      contactInfo: itemData.contactInfo || user?.email || "guest@student.edu",
      status: "active",
      reporterName: user?.name || "Guest",
      category: itemData.category || "personal",
    };
    setLostFound((prev) => [newItem, ...prev]);
    addToast("success", "Lost & Found Posted", "Campus community notified.");
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-ehb-background text-ehb-text-primary font-sans flex flex-col transition-colors">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Header */}
      <Header
        user={user}
        departments={departments}
        activeDeptId={activeDeptId}
        onSelectDepartment={(deptId) => setActiveDeptId(deptId)}
        onOpenSearch={() => setShowSearch(true)}
        onOpenAI={() => setShowAIModal(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={(mode) => {
          setAuthMode(mode || "login");
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onNavigateHome={() => {
          setActiveTab("dashboard");
          setSelectedCourseId(null);
        }}
        onNavigateTab={(tab, targetId) => {
          setActiveTab(tab as any);
          if (tab === "courses" && targetId) {
            setSelectedCourseId(targetId);
          }
        }}
        onOpenMobileMenu={() => setShowMobileSidebar(true)}
      />

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedCourseId(null);
          }}
          userRole={activeUser.role}
          onUploadFileClick={() => setShowUploadModal(true)}
          isOpen={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8 max-w-7xl mx-auto w-full">
          <ErrorBoundary>
            {/* Guest Signed Out Banner */}
            {!user && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100">
                      أنت تتصفح المنصة كزائر حالياً
                    </h3>
                    <p className="text-xs text-slate-300">
                      سجل الدخول بحسابك الجامعي أو أنشئ حساباً جديداً للوصول للمقررات والمواد
                      الدراسية.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 min-h-[38px]"
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg transition-all min-h-[38px]"
                  >
                    إنشاء حساب جديد
                  </button>
                </div>
              </div>
            )}

            {/* Detailed Course Workspace View */}
            {selectedCourse ? (
              <CourseWorkspace
                course={selectedCourse}
                files={files.filter(
                  (f) => f.courseId === selectedCourse.id && f.status === "approved",
                )}
                discussions={discussions.filter((d) => d.courseId === selectedCourse.id)}
                comments={comments}
                userRole={activeUser.role}
                onBack={() => setSelectedCourseId(null)}
                onOpenFile={(fileId) => setSelectedFileId(fileId)}
                onUploadFile={() => setShowUploadModal(true)}
                onVoteResource={handleVoteResource}
                onNewDiscussion={handleNewDiscussion}
                onUpvoteDiscussion={handleUpvoteDiscussion}
                onAddComment={handleAddComment}
                onAskAIForCourse={(_course) => {
                  setShowAIModal(true);
                }}
                onEditCourse={(course) => {
                  setAppEditingCourse(course);
                  setAppCourseModalOpen(true);
                }}
                onDeleteCourse={(courseId) => {
                  const target = courses.find((c) => c.id === courseId);
                  if (target) {
                    setAppDeletingCourse(target);
                  }
                }}
              />
            ) : (
              <>
                {/* Tab View Routing */}
                {activeTab === "dashboard" && (
                  <DashboardView
                    user={activeUser}
                    activeDept={activeDept}
                    courses={courses}
                    recentFiles={files.filter((f) => f.status === "approved")}
                    assignments={assignments}
                    schedule={schedule}
                    announcements={announcements}
                    onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
                    onOpenFile={(fileId) => setSelectedFileId(fileId)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onUploadClick={() => setShowUploadModal(true)}
                  />
                )}

                {activeTab === "courses" &&
                  (() => {
                    const isMechatronicsUser =
                      activeUser?.departmentId === "dept-mtr" ||
                      (activeUser?.departmentName
                        ? activeUser.departmentName.toLowerCase().includes("mechatronics")
                        : false) ||
                      (activeUser?.departmentName
                        ? activeUser.departmentName.includes("ميكاترونكس")
                        : false);

                    const isMechatronicsLevel1 =
                      isMechatronicsUser &&
                      (activeUser?.level === "Year 2 (Sophomore)" ||
                        activeUser?.level === "Year 1 (Freshman)" ||
                        (activeUser?.level as string | undefined)?.includes("المستوى الأول") ||
                        (activeUser?.level as string | undefined)?.includes("سنة ثانية"));

                    const isFreshmanUser = activeUser?.level === "Year 1 (Freshman)";
                    const isSophomoreUser = activeUser?.level === "Year 2 (Sophomore)";

                    const displayedCourses = courses.filter((c) => {
                      if (isMechatronicsLevel1) {
                        return c.departmentId === "dept-mtr";
                      }
                      if (activeUser?.role === "student") {
                        const userDeptId = activeUser.departmentId || "dept-cmp";
                        if (isFreshmanUser) {
                          return c.level === "Year 1 (Freshman)" && c.departmentId === userDeptId;
                        }
                        if (isSophomoreUser) {
                          return c.level === "Year 2 (Sophomore)" && c.departmentId === userDeptId;
                        }
                      }
                      return activeDeptId === "all" ? true : c.departmentId === activeDeptId;
                    });

                    return (
                      <div className="space-y-6 pb-12">
                        <div className="flex items-center justify-between">
                          <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                              مساحات عمل المقررات الدراسية ({displayedCourses.length})
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              اختر المادة الهندسية للوصول للمحاضرات، بنك الأسئلة والمناقشات
                              الدراسية.
                            </p>
                          </div>
                          {activeUser.role !== "student" && (
                            <button
                              onClick={() => {
                                setAppEditingCourse(null);
                                setAppCourseModalOpen(true);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 min-h-[42px]"
                            >
                              + إنشاء مقرر جديد
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                          {displayedCourses.map((course) => (
                            <div
                              key={course.id}
                              className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden flex flex-col justify-between h-full group hover:border-indigo-500/50 dark:hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1"
                            >
                              <div
                                onClick={() => setSelectedCourseId(course.id)}
                                className="h-36 relative overflow-hidden bg-slate-950 cursor-pointer"
                              >
                                <CourseCoverImage
                                  code={course.code}
                                  title={course.title}
                                  bannerImage={course.bannerImage}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-3.5 flex flex-col justify-end">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white w-fit uppercase tracking-wider font-mono shadow-sm">
                                    {course.code}
                                  </span>
                                  <h3 className="text-sm font-bold text-white truncate mt-1 drop-shadow-sm">
                                    {course.title}
                                  </h3>
                                </div>
                              </div>

                              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2.5">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {course.description}
                                  </p>
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                    <span className="font-medium">
                                      أستاذ المقرر: {course.instructor}
                                    </span>
                                    <span className="font-bold text-indigo-500 dark:text-indigo-400">
                                      {course.credits} ساعات معتمدة
                                    </span>
                                  </div>
                                </div>

                                {/* Super Admin & Faculty Course Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                  <button
                                    onClick={() => setSelectedCourseId(course.id)}
                                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all text-center shadow-sm hover:shadow active:scale-[0.99]"
                                  >
                                    دخول المقرر
                                  </button>

                                  {activeUser.role !== "student" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setAppEditingCourse(course);
                                          setAppCourseModalOpen(true);
                                        }}
                                        className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                                        title="تعديل تفاصيل المقرر"
                                      >
                                        تعديل
                                      </button>
                                      <button
                                        onClick={() => setAppDeletingCourse(course)}
                                        className="py-2 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors"
                                        title="حذف المقرر بالكامل"
                                      >
                                        حذف
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                {activeTab === "study_tools" &&
                  (() => {
                    const isFreshmanUser = activeUser?.level === "Year 1 (Freshman)";
                    const isSophomoreUser = activeUser?.level === "Year 2 (Sophomore)";
                    const userCourses = courses.filter((c) =>
                      isFreshmanUser
                        ? c.level === "Year 1 (Freshman)"
                        : isSophomoreUser
                          ? c.level === "Year 2 (Sophomore)"
                          : true,
                    );
                    const userCourseIds = userCourses.map((c) => c.id);

                    return (
                      <StudyToolsView
                        assignments={
                          isFreshmanUser || isSophomoreUser
                            ? assignments.filter((a) => userCourseIds.includes(a.courseId))
                            : assignments
                        }
                        schedule={
                          isFreshmanUser || isSophomoreUser
                            ? schedule.filter((s) => userCourseIds.includes(s.courseId))
                            : schedule
                        }
                        courses={userCourses}
                        user={activeUser}
                        onAddAssignment={handleAddAssignment}
                        onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
                        onUpdatePoints={(pts) => {
                          setUser((prev) => (prev ? { ...prev, points: prev.points + pts } : null));
                          addToast("success", "نقاط تفاعل أكاديمي", `حصلت على +${pts} نقطة جديدة!`);
                        }}
                      />
                    );
                  })()}

                {activeTab === "community" && (
                  <CommunityView
                    discussions={discussions}
                    comments={comments}
                    ledger={ledger}
                    user={activeUser}
                    departments={departments}
                    courses={courses}
                    onUpvoteDiscussion={handleUpvoteDiscussion}
                    onNewDiscussion={handleNewDiscussion}
                  />
                )}

                {activeTab === "campus" && (
                  <CampusHubView
                    announcements={announcements}
                    events={events}
                    lostFound={lostFound}
                    marketplace={marketplace}
                    clubs={clubs}
                    departments={departments}
                    onToggleRSVP={handleToggleRSVP}
                    onToggleClubJoin={handleToggleClubJoin}
                    onAddMarketplaceItem={handleAddMarketplaceItem}
                    onAddLostFoundItem={handleAddLostFoundItem}
                  />
                )}

                {activeTab === "ai_assistant" && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl">
                      <h2 className="text-xl font-black">
                        المساعد الدراسي الهندسي بالذكاء الاصطناعي
                      </h2>
                      <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                        استخدم مساعد الذكاء الاصطناعي لحل المعادلة التفاضلية خطوة بخطوة، توليد بنك
                        اختيارات متعددة (MCQ) تفاعلي، أو الحصول على ملخصات فورية لأفكار المحاضرات
                        الهندسية.
                      </p>
                      <button
                        onClick={() => setShowAIModal(true)}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all min-h-[42px] flex items-center gap-2"
                      >
                        <span>بدء جلسة دراسية تفاعلية</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "admin" && activeUser.role !== "student" && (
                  <AdminModerationView
                    userRole={activeUser.role}
                    currentUser={activeUser}
                    pendingFiles={files.filter((f) => f.status === "pending")}
                    courses={courses}
                    departments={departments}
                    announcements={announcements}
                    events={events}
                    assignments={assignments}
                    schedule={schedule}
                    onApproveFile={handleApproveFile}
                    onRejectFile={handleRejectFile}
                    onAddCourse={handleAddCourse}
                    onUpdateCourse={handleUpdateCourse}
                    onDeleteCourse={handleDeleteCourse}
                    onAddAnnouncement={handleAddAnnouncement}
                    onDeleteAnnouncement={handleDeleteAnnouncement}
                    onTogglePinAnnouncement={handleTogglePinAnnouncement}
                    onAddEvent={handleAddEvent}
                    onUpdateEvent={handleUpdateEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onToggleEventStatus={handleToggleEventStatus}
                    onAddAssignment={handleAddAssignment}
                    onUpdateAssignment={handleUpdateAssignment}
                    onDeleteAssignment={handleDeleteAssignment}
                    onAddScheduleItem={handleAddScheduleItem}
                    onUpdateScheduleItem={handleUpdateScheduleItem}
                    onDeleteScheduleItem={handleDeleteScheduleItem}
                  />
                )}

                {activeTab === "not_found" && (
                  <NotFoundView onGoHome={() => setActiveTab("dashboard")} />
                )}

                {activeTab === "server_error" && (
                  <ServerErrorView
                    onGoHome={() => setActiveTab("dashboard")}
                    onRetry={() => window.location.reload()}
                  />
                )}
              </>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* OVERLAYS & MODALS */}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={selectedFile || null}
        onClose={() => setSelectedFileId(null)}
        onRateFile={handleRateFile}
        onToggleBookmark={handleToggleBookmark}
        comments={comments}
        onAddComment={(fileId, text) => handleAddComment(fileId, text)}
      />

      {/* AI Assistant Modal */}
      {showAIModal && (
        <AIAssistantModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          courses={
            activeUser?.level === "Year 1 (Freshman)"
              ? courses.filter((c) => c.level === "Year 1 (Freshman)")
              : activeUser?.level === "Year 2 (Sophomore)"
                ? courses.filter((c) => c.level === "Year 2 (Sophomore)")
                : courses
          }
          activeCourse={selectedCourse || undefined}
        />
      )}

      {/* Upload Resource Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        courses={courses}
        preselectedCourseId={selectedCourseId || undefined}
        onUploadSubmit={handleUploadFileSubmit}
        userRole={activeUser.role}
      />

      {/* Profile & Badges Modal */}
      {showProfileModal && user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          departments={departments}
          ledger={ledger}
          onUpdateProfile={(updatedFields) => {
            if (!user) return;
            const updated = {
              ...user,
              name: updatedFields.name,
              avatar: updatedFields.avatar,
              bio: updatedFields.bio,
            };
            setUser(updated);
            EngHubStorage.saveUser(updated);
            addToast(
              "success",
              "Profile Updated",
              "Your name, profile picture, and bio have been saved.",
            );
          }}
          onUpdateBio={(bio) => {
            if (!user) return;
            const updated = { ...user, bio };
            setUser(updated);
            EngHubStorage.saveUser(updated);
            addToast("success", "Bio Updated", "Your profile bio is saved.");
          }}
        />
      )}

      {/* Command Palette (Cmd + K Search) */}
      <CommandPalette
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        courses={
          activeUser?.level === "Year 1 (Freshman)"
            ? courses.filter((c) => c.level === "Year 1 (Freshman)")
            : activeUser?.level === "Year 2 (Sophomore)"
              ? courses.filter((c) => c.level === "Year 2 (Sophomore)")
              : courses
        }
        files={
          activeUser?.level === "Year 1 (Freshman)"
            ? files.filter(
                (f) =>
                  f.status === "approved" &&
                  [
                    "course-eng011",
                    "course-eng021",
                    "course-eng041",
                    "course-eng031",
                    "course-eng051",
                    "course-hum011",
                  ].includes(f.courseId),
              )
            : activeUser?.level === "Year 2 (Sophomore)"
              ? files.filter(
                  (f) =>
                    f.status === "approved" &&
                    [
                      "course-hum131",
                      "course-engx13",
                      "course-aie101",
                      "course-aie111",
                      "course-aie103",
                      "course-humx32",
                    ].includes(f.courseId),
                )
              : files.filter((f) => f.status === "approved")
        }
        discussions={discussions}
        announcements={announcements}
        onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
        onOpenFile={(fileId) => setSelectedFileId(fileId)}
        onSelectDiscussion={(_discId) => {
          setActiveTab("community");
        }}
      />

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          departments={departments}
          currentUser={activeUser}
          onSaveProfile={handleSaveProfile}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        departments={departments}
        initialMode={authMode}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          EngHubStorage.saveUser(authenticatedUser);
          addToast(
            "success",
            `Welcome back, ${authenticatedUser.name}!`,
            "Session active and authenticated.",
          );
        }}
      />

      {/* Global Admin Course Creation & Editing Modal */}
      <CourseFormModal
        isOpen={appCourseModalOpen}
        onClose={() => {
          setAppCourseModalOpen(false);
          setAppEditingCourse(null);
        }}
        initialCourse={appEditingCourse}
        departments={departments}
        onSubmit={(courseData) => {
          if (appEditingCourse) {
            handleUpdateCourse(appEditingCourse.id, courseData);
          } else {
            handleAddCourse(courseData);
          }
          setAppCourseModalOpen(false);
          setAppEditingCourse(null);
        }}
      />

      {/* Global Confirm Course Deletion Modal */}
      <ConfirmModal
        isOpen={Boolean(appDeletingCourse)}
        title="حذف المقرر الدراسي بالكامل"
        message={`هل أنت تأكد بصفتك مسئول من حذف مادة "${appDeletingCourse?.title}" (${appDeletingCourse?.code}) بالكامل؟`}
        confirmText="حذف المادة"
        cancelText="إلغاء"
        variant="danger"
        onCancel={() => setAppDeletingCourse(null)}
        onConfirm={() => {
          if (appDeletingCourse) {
            handleDeleteCourse(appDeletingCourse.id);
          }
          setAppDeletingCourse(null);
        }}
      />
    </div>
  );
}
