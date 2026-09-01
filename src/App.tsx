import React, { useState, useEffect } from 'react';
import { getCourseCoverSvg } from './utils/courseCovers';
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
  UserRole
} from './types';
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
  INITIAL_ANNOUNCEMENTS,
  INITIAL_EVENTS,
  INITIAL_LOST_FOUND,
  INITIAL_MARKETPLACE,
  INITIAL_CLUBS
} from './data/mockData';

import { CourseFormModal } from './components/admin/CourseFormModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { CourseCoverImage } from './components/common/CourseCoverImage';

// Layout & UI Components
import { Header } from './components/Header';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingModal } from './components/OnboardingModal';
import { UploadModal } from './components/UploadModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal, AuthMode } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { NotFoundView, ServerErrorView, ErrorBoundary } from './components/common/ErrorPages';
import { EngHubStorage, getAuthHeaders, getSessionToken, setSessionToken } from './lib/storage';

// Views (High-Performance Instant Loading)
import { DashboardView } from './components/dashboard/DashboardView';
import { CourseWorkspace } from './components/courses/CourseWorkspace';
import { FilePreviewModal } from './components/courses/FilePreviewModal';
import { StudyToolsView } from './components/study/StudyToolsView';
import { CommunityView } from './components/community/CommunityView';
import { CampusHubView } from './components/campus/CampusHubView';
import { AdminModerationView } from './components/admin/AdminModerationView';
import { AIAssistantModal } from './components/ai/AIAssistantModal';

import { GraduationCap } from 'lucide-react';

const GUEST_USER: UserProfile = {
  id: '',
  name: 'Visitor / Guest',
  email: 'guest@student.edu',
  phoneNumber: '',
  studentId: 'Not Signed In',
  role: 'student',
  universityId: 'uni-gnue-01',
  facultyId: 'fac-eng-01',
  departmentId: 'dept-cmp-01',
  level: 'Year 1 (Freshman)',
  semester: 'Fall 2026',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bio: 'Sign in to access personalized courses, study materials, and contribution badges.',
  points: 0,
  badges: [],
  savedBookmarks: [],
  enrolledCourseIds: [],
  createdAt: new Date().toISOString()
};

export default function App() {
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('enghub_theme');
        if (saved) return saved === 'dark';
      }
    } catch {
      // Storage restricted or unavailable
    }
    return true; // Default dark
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('enghub_theme', 'dark');
        }
      } else {
        document.documentElement.classList.remove('dark');
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('enghub_theme', 'light');
        }
      }
    } catch {
      // Storage restricted or unavailable
    }
  }, [isDarkMode]);

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
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
    if (updated.level === 'Year 1 (Freshman)') {
      updated.enrolledCourseIds = ['course-eng011', 'course-eng021', 'course-eng041', 'course-eng031', 'course-eng051', 'course-hum011'];
    } else if (updated.level === 'Year 2 (Sophomore)') {
      updated.enrolledCourseIds = ['course-hum131', 'course-engx13', 'course-aie101', 'course-aie111', 'course-aie103', 'course-humx32'];
    }
    setUser(updated);
    EngHubStorage.saveUser(updated);
    addToast('success', 'Profile Updated', 'Your academic details have been saved.');
  };

  // Data Collections State
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [files, setFiles] = useState<StudyFile[]>(INITIAL_FILES);
  const [discussions, setDiscussions] = useState<DiscussionThread[]>(INITIAL_DISCUSSIONS);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>(INITIAL_LEDGER);
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => EngHubStorage.getAnnouncements());
  const [events, setEvents] = useState<CampusEvent[]>(INITIAL_EVENTS);
  const [lostFound, setLostFound] = useState<LostFoundItem[]>(INITIAL_LOST_FOUND);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>(INITIAL_MARKETPLACE);
  const [clubs, setClubs] = useState<StudentClub[]>(INITIAL_CLUBS);

  // Active View & Filters
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [activeDeptId, setActiveDeptId] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Modals Visibility State
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Course Admin Management States
  const [appCourseModalOpen, setAppCourseModalOpen] = useState(false);
  const [appEditingCourse, setAppEditingCourse] = useState<Course | null>(null);
  const [appDeletingCourse, setAppDeletingCourse] = useState<Course | null>(null);

  // Verify Active Auth Session on Mount
  useEffect(() => {
    fetch('/api/auth/me', {
      headers: getAuthHeaders(),
      credentials: 'include'
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
      .catch((err) => console.log('Session check in demo mode:', err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch (e) {
      // Ignore network errors on logout
    }
    setSessionToken(null);
    setUser(null);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('enghub_user');
      }
    } catch {
      // ignore
    }
    setAuthMode('login');
    setShowAuthModal(true);
    addToast('info', 'Signed Out', 'You have been signed out of your account.');
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
      addToast('error', 'تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول لرفع الملفات الأكاديمية.');
      return;
    }

    const payload: any = {
      title: fileData.title || 'ملخص دراسي جديد',
      description: fileData.description || '',
      courseId: fileData.courseId || courses[0]?.id || 'course-eng011',
      courseCode: fileData.courseCode || courses[0]?.code || 'ENG',
      departmentId: activeUser.departmentId || 'dept-cmp',
      category: fileData.category || 'summary',
      fileType: fileData.fileType || 'pdf',
      fileName: fileData.fileName || 'upload.pdf',
      fileData: fileData.fileData || '',
      previewContent: fileData.previewContent,
      tags: fileData.tags || [],
      academicYear: fileData.academicYear || activeUser.level || 'Year 1 (Freshman)',
      semester: fileData.semester || 'Fall 2026'
    };

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.resource) {
        const newFile: StudyFile = {
          id: data.resource.id,
          title: data.resource.title,
          description: data.resource.description,
          courseId: data.resource.courseId,
          courseCode: data.resource.courseCode,
          courseTitle: data.resource.courseTitle,
          category: data.resource.category,
          fileType: data.resource.fileType,
          fileSize: data.resource.fileSize,
          fileSizeBytes: data.resource.fileSizeBytes,
          fileName: data.resource.fileName,
          uploaderId: activeUser.id,
          uploaderName: activeUser.name,
          uploaderRole: activeUser.role,
          uploaderDepartment: data.resource.uploaderDepartment || activeDept?.name || 'Computer Engineering',
          uploadDate: data.resource.uploadDate || new Date().toISOString().split('T')[0],
          downloadCount: data.resource.downloadCount || 0,
          viewCount: data.resource.viewCount || 1,
          rating: data.resource.rating || 5.0,
          ratingCount: data.resource.ratingCount || 0,
          previewContent: data.resource.previewContent,
          downloadUrl: `/api/files/download/${data.resource.id}`,
          status: data.resource.status,
          moderationStatus: data.resource.moderationStatus,
          verificationStatus: data.resource.verificationStatus,
          moderatedByName: data.resource.moderatedByName,
          moderatedAt: data.resource.moderatedAt,
          rejectionReason: data.resource.rejectionReason,
          version: data.resource.version || 1,
          tags: data.resource.tags || [],
          isBookmarked: false
        };
        setFiles((prev) => [newFile, ...prev]);
        addToast('success', data.message || 'تم نشر الملف بنجاح!', 'تم توثيق الملف في مساحة المقرر.');
      } else {
        addToast('error', 'خطأ في رفع الملف', data.message || data.error?.message || 'فشل رفع الملف.');
      }
    } catch (err) {
      addToast('error', 'خطأ في الاتصال', 'تعذر رفع الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  // Moderate Files Handlers
  const handleApproveFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/resources/${fileId}/moderate`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (res.ok) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: 'approved' as const, moderationStatus: 'approved' as const } : f))
        );
        addToast('success', 'تم اعتماد ونشر الملف بنجاح', 'الملف معروض الآن للطلاب في قسم الملخصات والقوانين.');
      } else {
        addToast('error', 'خطأ في اعتماد الملف', data.message || data.error?.message || 'فشل اعتماد الملف.');
      }
    } catch (err) {
      addToast('error', 'خطأ في الاتصال', 'تعذر اعتماد الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleRejectFile = async (fileId: string, reason: string) => {
    try {
      const res = await fetch(`/api/resources/${fileId}/moderate`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action: 'reject', rejectionReason: reason })
      });
      const data = await res.json();
      if (res.ok) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'rejected' as const, moderationStatus: 'rejected' as const, rejectionReason: reason }
              : f
          )
        );
        addToast('info', 'تم رفض الملف', `تم إشعار الرافع بسبب الرفض: ${reason}`);
      } else {
        addToast('error', 'خطأ في رفض الملف', data.message || data.error?.message || 'فشل رفض الملف.');
      }
    } catch (err) {
      addToast('error', 'خطأ في الاتصال', 'تعذر رفض الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  // Fetch courses from server on mount
  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses?limit=100');
      if (res.ok) {
        const data = await res.json();
        const loadedCourses = Array.isArray(data) ? data : data.courses;
        if (Array.isArray(loadedCourses) && loadedCourses.length > 0) {
          setCourses(loadedCourses);
        }
      }
    } catch (err) {
      console.warn('Failed to load courses from API:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Course Admin Management Handlers
  const handleAddCourse = async (newCourseData: Partial<Course>) => {
    const payload = {
      code: newCourseData.code || 'ENG 100',
      title: newCourseData.title || 'New Engineering Course',
      departmentId: newCourseData.departmentId || departments[0]?.id || 'dept-cmp',
      level: newCourseData.level || 'Year 1 (Freshman)',
      semester: newCourseData.semester || 'Fall 2026',
      credits: Number(newCourseData.credits) || 3,
      creditHours: Number(newCourseData.credits) || 3,
      instructor: newCourseData.instructor || 'أستاذ غير محدد',
      instructorEmail: newCourseData.instructorEmail || 'faculty@eng.gnu.edu',
      description: newCourseData.description || 'مقرر دراسي أكاديمي جديد.',
      syllabus: newCourseData.syllabus || ['مقدمة في المادة', 'المفاهيم الأساسية', 'التطبيقات والتمارين المعملية', 'التقييم النهائي'],
      scheduleDayTime: newCourseData.scheduleDayTime || 'Mon/Wed 10:00 - 11:30 AM',
      location: newCourseData.location || 'كلية الهندسة',
      prerequisites: newCourseData.prerequisites || [],
      gradingScheme: newCourseData.gradingScheme || [
        { category: 'Midterm', weight: 30 },
        { category: 'Final Exam', weight: 40 },
        { category: 'Lab & Assignments', weight: 30 }
      ],
      bannerImage: newCourseData.bannerImage || getCourseCoverSvg(newCourseData.code || 'ENG101')
    };

    console.log('[Frontend handleAddCourse] Submitting POST /api/courses with payload:', payload);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('[Frontend handleAddCourse] POST /api/courses response status:', res.status, data);

      if (res.ok && data.course) {
        setCourses((prev) => [data.course, ...prev.filter((c) => c.id !== data.course.id)]);
        addToast('success', 'تم إضافة المقرر بنجاح', `تم إضافة وحفظ المقرر ${data.course.code} في قاعدة البيانات.`);
      } else if (res.status === 401 || res.status === 403) {
        addToast('error', 'مطلوب تسجيل الدخول كمسؤول أو مشرف', 'يرجى تسجيل الدخول بحساب المشرف أو مسؤول النظام لإضافة المقررات الدراسية.');
        setAuthMode('login');
        setShowAuthModal(true);
      } else {
        const errorMsg = data.message || data.error?.message || data.error || 'فشل إضافة المقرر';
        addToast('error', 'خطأ في إضافة المادة', String(errorMsg));
      }
    } catch (err: any) {
      console.error('[Frontend handleAddCourse] Network error:', err);
      addToast('error', 'خطأ في الاتصال', 'تعذر حفظ المقرر في الخادم وقاعدة البيانات.');
    }
  };

  const handleUpdateCourse = async (courseId: string, updatedData: Partial<Course>) => {
    console.log('[Frontend handleUpdateCourse] Submitting PATCH /api/courses/' + courseId, updatedData);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updatedData)
      });

      const data = await res.json();
      if (res.ok && data.course) {
        setCourses((prev) => prev.map((c) => (c.id === courseId ? data.course : c)));
        addToast('success', 'تم تعديل المادة بنجاح', `تم حفظ تعديلات المقرر ${data.course.code || ''} في قاعدة البيانات.`);
      } else if (res.status === 401 || res.status === 403) {
        addToast('error', 'مطلوب تسجيل الدخول كمسؤول أو مشرف', 'يرجى تسجيل الدخول بحساب المشرف أو مسؤول النظام لتعديل المقررات الدراسية.');
        setAuthMode('login');
        setShowAuthModal(true);
      } else {
        const errorMsg = data.message || data.error?.message || 'فشل تعديل المادة';
        addToast('error', 'خطأ في تعديل المادة', String(errorMsg));
      }
    } catch (err) {
      console.error('[Frontend handleUpdateCourse] Network error:', err);
      addToast('error', 'خطأ في الاتصال', 'تعذر حفظ تعديلات المقرر في الخادم وقاعدة البيانات.');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const courseToDelete = courses.find((c) => c.id === courseId);
    console.log('[Frontend handleDeleteCourse] Submitting DELETE /api/courses/' + courseId);

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        if (selectedCourseId === courseId) {
          setSelectedCourseId(null);
        }
        addToast('info', 'تم حذف المادة بنجاح', `تم حذف وأرشفة المقرر ${courseToDelete?.code || ''} من قاعدة البيانات.`);
      } else if (res.status === 401 || res.status === 403) {
        addToast('error', 'مطلوب تسجيل الدخول كمسؤول أو مشرف', 'يرجى تسجيل الدخول بحساب المشرف أو مسؤول النظام لحذف المقررات الدراسية.');
        setAuthMode('login');
        setShowAuthModal(true);
      } else {
        const data = await res.json().catch(() => ({}));
        addToast('error', 'فشل حذف المادة', data.message || 'تعذر حذف المقرر.');
      }
    } catch (err) {
      console.error('[Frontend handleDeleteCourse] Network error:', err);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null);
      }
      addToast('info', 'تم حذف المادة', `تم حذف المقرر ${courseToDelete?.code || ''}.`);
    }
  };

  // Official Announcements Handlers
  const handleAddAnnouncement = (ancData: Omit<Announcement, 'id' | 'date'>) => {
    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      ...ancData,
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements((prev) => {
      const updated = [newAnc, ...prev];
      EngHubStorage.saveAnnouncements(updated);
      return updated;
    });
    addToast('success', 'تم نشر الإعلان الرسمي', `تم تعميم: "${newAnc.title}" على جميع المستخدمين.`);
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.filter((a) => a.id !== announcementId);
      EngHubStorage.saveAnnouncements(updated);
      return updated;
    });
    addToast('info', 'تم حذف الإعلان', 'تم إزالة الإعلان بنجاح.');
  };

  const handleTogglePinAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((a) => (a.id === announcementId ? { ...a, isPinned: !a.isPinned } : a));
      EngHubStorage.saveAnnouncements(updated);
      return updated;
    });
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
      authorDepartment: activeDept?.name || 'Computer Engineering',
      authorRole: activeUser.role,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      hasUpvoted: true,
      replyCount: 0,
      isSolved: false,
      tags: ['Course Q&A']
    };
    setDiscussions((prev) => [newDisc, ...prev]);
    addToast('success', 'Discussion Thread Posted', 'Fellow students and TAs can now reply.');
  };

  const handleUpvoteDiscussion = (discId: string) => {
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discId) {
          const hasUp = d.hasUpvoted;
          return {
            ...d,
            upvotes: hasUp ? d.upvotes - 1 : d.upvotes + 1,
            hasUpvoted: !hasUp
          };
        }
        return d;
      })
    );
  };

  const handleAddComment = (targetId: string, content: string) => {
    const newCmt: Comment = {
      id: `cmt-${Date.now()}`,
      targetType: 'discussion',
      targetId,
      authorId: activeUser.id,
      authorName: activeUser.name,
      authorDepartment: activeDept?.name || 'Engineering',
      authorRole: activeUser.role,
      content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false
    };
    setComments((prev) => [...prev, newCmt]);
    setDiscussions((prev) =>
      prev.map((d) => (d.id === targetId ? { ...d, replyCount: d.replyCount + 1 } : d))
    );
    addToast('success', 'Comment Posted', 'Your reply is added to the discussion.');
  };

  // Resource Helpful / Not Helpful Voting
  const handleVoteResource = async (fileId: string, voteType: 'helpful' | 'not_helpful') => {
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
            if (voteType === 'helpful') newHelpful = Math.max(0, currentHelpful - 1);
            if (voteType === 'not_helpful') newNotHelpful = Math.max(0, currentNotHelpful - 1);
            return {
              ...f,
              helpfulCount: newHelpful,
              notHelpfulCount: newNotHelpful,
              userVote: undefined
            };
          }

          if (previousVote === 'helpful') newHelpful = Math.max(0, currentHelpful - 1);
          if (previousVote === 'not_helpful') newNotHelpful = Math.max(0, currentNotHelpful - 1);

          if (voteType === 'helpful') newHelpful += 1;
          if (voteType === 'not_helpful') newNotHelpful += 1;

          return {
            ...f,
            helpfulCount: newHelpful,
            notHelpfulCount: newNotHelpful,
            userVote: voteType
          };
        }
        return f;
      })
    );

    try {
      await fetch(`/api/resources/${fileId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      });
      addToast('success', 'تم تسجيل تقييمك', voteType === 'helpful' ? 'شكراً لتقييمك الإيجابي للمرجع!' : 'تم تسجيل ملاحظتك.');
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
          const calcRating = Number(((currentRating * currentCount + rating) / newCount).toFixed(1));
          const newRating = Number.isNaN(calcRating) ? rating : calcRating;
          return { ...f, rating: newRating, ratingCount: newCount };
        }
        return f;
      })
    );
    addToast('success', 'Rating Saved', `Submitted ${rating}-star rating for this resource.`);
  };

  const handleToggleBookmark = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isBookmarked: !f.isBookmarked } : f))
    );
    addToast('info', 'Bookmark Updated', 'Saved files are accessible in your study workspace.');
  };

  // Study Tools Assignments
  const handleAddAssignment = (asgnData: Partial<Assignment>) => {
    const newAsgn: Assignment = {
      id: `asgn-${Date.now()}`,
      courseId: asgnData.courseId || courses[0].id,
      courseCode: asgnData.courseCode || 'ENG',
      title: asgnData.title || 'New Assignment',
      description: asgnData.description || '',
      dueDate: asgnData.dueDate || new Date().toISOString().split('T')[0],
      totalPoints: asgnData.totalPoints || 20,
      weightPercent: asgnData.weightPercent || 10,
      status: 'todo',
      attachmentUrl: asgnData.attachmentUrl,
      attachmentName: asgnData.attachmentName,
      departmentId: asgnData.departmentId,
      level: asgnData.level,
      createdByName: asgnData.createdByName,
      createdByRole: asgnData.createdByRole
    };
    setAssignments((prev) => {
      const updated = [newAsgn, ...prev];
      EngHubStorage.saveAssignments(updated);
      return updated;
    });
    addToast('success', 'تم نشر التكليف بنجاح', `تم تعميم التكليف "${newAsgn.title}" للمقرر.`);
  };

  const handleUpdateAssignment = (id: string, asgnData: Partial<Assignment>) => {
    setAssignments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...asgnData } : a));
      EngHubStorage.saveAssignments(updated);
      return updated;
    });
    addToast('success', 'تم تعديل التكليف', 'تم تحديث بيانات الشيت/الواجب بنجاح.');
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      EngHubStorage.saveAssignments(updated);
      return updated;
    });
    addToast('info', 'تم حذف التكليف', 'تم إزالة الواجب الدراسي بنجاح.');
  };

  const handleUpdateAssignmentStatus = (id: string, status: Assignment['status']) => {
    setAssignments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, status } : a));
      EngHubStorage.saveAssignments(updated);
      return updated;
    });
    addToast('info', 'تحديث حالة التسليم', `تم تغيير الحالة إلى ${status}.`);
  };

  // Schedule Handlers
  const handleAddScheduleItem = (itemData: Omit<ScheduleItem, 'id'>) => {
    const newItem: ScheduleItem = {
      id: `sch-${Date.now()}`,
      ...itemData
    };
    setSchedule((prev) => {
      const updated = [...prev, newItem];
      EngHubStorage.saveSchedule(updated);
      return updated;
    });
    addToast('success', 'تم إضافة المحاضرة للجدول', `تم توثيق حصة "${newItem.courseCode}" يوم ${newItem.dayOfWeek}`);
  };

  const handleUpdateScheduleItem = (id: string, itemData: Partial<ScheduleItem>) => {
    setSchedule((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...itemData } : s));
      EngHubStorage.saveSchedule(updated);
      return updated;
    });
    addToast('success', 'تم تعديل الجدول الأسبوعي', 'تم تحديث الموعد والقاعة بنجاح.');
  };

  const handleDeleteScheduleItem = (id: string) => {
    setSchedule((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      EngHubStorage.saveSchedule(updated);
      return updated;
    });
    addToast('info', 'تم حذف المحاضرة من الجدول', 'تم إزالة الحصة الدراسية بنجاح.');
  };

  // Campus Events CRUD & RSVP Handlers
  const handleAddEvent = (eventData: Omit<CampusEvent, 'id' | 'rsvpCount' | 'hasRsvped'>) => {
    const newEvt: CampusEvent = {
      id: `evt-${Date.now()}`,
      ...eventData,
      rsvpCount: 0,
      hasRsvped: false,
      registeredStudents: []
    };
    setEvents((prev) => [newEvt, ...prev]);
    addToast('success', 'تم إضافة الفعالية بنجاح', `تم إضافة "${newEvt.title}" إلى قائمة الفعاليات.`);
  };

  const handleUpdateEvent = (eventId: string, eventUpdate: Partial<CampusEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...eventUpdate } : e))
    );
    addToast('success', 'تم تعديل الفعالية', 'تم تحديث بيانات الفعالية بنجاح.');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    addToast('info', 'تم حذف الفعالية', 'تم إزالة الفعالية بنجاح.');
  };

  const handleToggleEventStatus = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const newStatus = e.status === 'draft' ? 'published' : 'draft';
          return { ...e, status: newStatus as any };
        }
        return e;
      })
    );
    addToast('info', 'تم تحديث حالة الفعالية', 'تم تغيير حالة الظهور والاعتماد.');
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
              departmentName: activeDept?.name || 'Computer Engineering',
              registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
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
            registeredStudents: updatedRegistrants
          };
        }
        return e;
      })
    );
    addToast('success', 'تم تسجيل المقعد', 'تم إضافة الفعالية وسيرتك إلى قائمة المسجلين الرسمية.');
  };

  const handleToggleClubJoin = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id === clubId) {
          const isJ = c.isJoined;
          return {
            ...c,
            isJoined: !isJ,
            memberCount: isJ ? c.memberCount - 1 : c.memberCount + 1
          };
        }
        return c;
      })
    );
    addToast('success', 'Club Membership Updated', 'You are now connected with society members.');
  };

  const handleAddMarketplaceItem = (itemData: Partial<MarketplaceItem>) => {
    const uploadedImages = itemData.images || (itemData.image ? [itemData.image] : []);
    const newItem: MarketplaceItem = {
      id: `mkt-${Date.now()}`,
      title: itemData.title || 'Item for Sale',
      description: itemData.description || '',
      price: itemData.price || 15,
      currency: '$',
      category: itemData.category || 'textbook',
      condition: itemData.condition || 'good',
      sellerName: user?.name || activeUser?.name || 'Student Seller',
      sellerDepartment: activeDept?.name || 'Engineering',
      contactInfo: itemData.contactInfo || '',
      whatsappNumber: itemData.whatsappNumber || '',
      date: new Date().toISOString().split('T')[0],
      status: 'available',
      image: uploadedImages.length > 0 ? uploadedImages[0] : itemData.image,
      images: uploadedImages
    };
    setMarketplace((prev) => [newItem, ...prev]);
    addToast('success', 'Marketplace Listing Created', 'Listing published on campus hub.');
  };

  const handleAddLostFoundItem = (itemData: Partial<LostFoundItem>) => {
    const newItem: LostFoundItem = {
      id: `laf-${Date.now()}`,
      title: itemData.title || 'Item',
      description: itemData.description || '',
      type: itemData.type || 'lost',
      location: itemData.location || 'Engineering Building',
      date: new Date().toISOString().split('T')[0],
      contactInfo: itemData.contactInfo || (user?.email || 'guest@student.edu'),
      status: 'active',
      reporterName: user?.name || 'Guest',
      category: itemData.category || 'personal'
    };
    setLostFound((prev) => [newItem, ...prev]);
    addToast('success', 'Lost & Found Posted', 'Campus community notified.');
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors selection:bg-indigo-500 selection:text-white">
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
          setAuthMode(mode || 'login');
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onNavigateHome={() => {
          setActiveTab('dashboard');
          setSelectedCourseId(null);
        }}
        onNavigateTab={(tab, targetId) => {
          setActiveTab(tab as any);
          if (tab === 'courses' && targetId) {
            setSelectedCourseId(targetId);
          }
        }}
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
                    <h3 className="font-extrabold text-sm text-slate-100">أنت تتصفح المنصة كزائر حالياً</h3>
                    <p className="text-xs text-slate-300">سجل الدخول بحسابك الجامعي أو أنشئ حساباً جديداً للوصول للمقررات والمواد الدراسية.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 min-h-[38px]"
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
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
              files={files.filter((f) => f.courseId === selectedCourse.id && f.status === 'approved')}
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
              onAskAIForCourse={(course) => {
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
              {activeTab === 'dashboard' && (
                <DashboardView
                  user={activeUser}
                  activeDept={activeDept}
                  courses={courses}
                  recentFiles={files.filter((f) => f.status === 'approved')}
                  assignments={assignments}
                  schedule={schedule}
                  announcements={announcements}
                  onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
                  onOpenFile={(fileId) => setSelectedFileId(fileId)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onUploadClick={() => setShowUploadModal(true)}
                />
              )}

              {activeTab === 'courses' && (() => {
                const isMechatronicsUser =
                  activeUser?.departmentId === 'dept-mtr' ||
                  activeUser?.departmentName?.toLowerCase().includes('mechatronics') ||
                  activeUser?.departmentName?.includes('ميكاترونكس');

                const isMechatronicsLevel1 =
                  isMechatronicsUser &&
                  (activeUser?.level === 'Year 2 (Sophomore)' ||
                   activeUser?.level === 'Year 1 (Freshman)' ||
                   (activeUser?.level as string | undefined)?.includes('المستوى الأول') ||
                   (activeUser?.level as string | undefined)?.includes('سنة ثانية'));

                const isFreshmanUser = activeUser?.level === 'Year 1 (Freshman)';
                const isSophomoreUser = activeUser?.level === 'Year 2 (Sophomore)';

                const displayedCourses = courses.filter((c) => {
                  if (isMechatronicsLevel1) {
                    return c.departmentId === 'dept-mtr';
                  }
                  if (activeUser?.role === 'student') {
                    const userDeptId = activeUser.departmentId || 'dept-cmp';
                    if (isFreshmanUser) {
                      return c.level === 'Year 1 (Freshman)' && c.departmentId === userDeptId;
                    }
                    if (isSophomoreUser) {
                      return c.level === 'Year 2 (Sophomore)' && c.departmentId === userDeptId;
                    }
                  }
                  return activeDeptId === 'all' ? true : c.departmentId === activeDeptId;
                });

                return (
                  <div className="space-y-6 pb-12">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                          مساحات عمل المقررات الدراسية ({displayedCourses.length})
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          اختر المادة الهندسية للوصول للمحاضرات، بنك الأسئلة والمناقشات الدراسية.
                        </p>
                      </div>
                      {activeUser.role !== 'student' && (
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
                              <h3 className="text-sm font-bold text-white truncate mt-1 drop-shadow-sm">{course.title}</h3>
                            </div>
                          </div>

                          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-2.5">
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {course.description}
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                <span className="font-medium">أستاذ المقرر: {course.instructor}</span>
                                <span className="font-bold text-indigo-500 dark:text-indigo-400">{course.credits} ساعات معتمدة</span>
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

                              {activeUser.role !== 'student' && (
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

              {activeTab === 'study_tools' && (() => {
                const isFreshmanUser = activeUser?.level === 'Year 1 (Freshman)';
                const isSophomoreUser = activeUser?.level === 'Year 2 (Sophomore)';
                const userCourses = courses.filter((c) =>
                  isFreshmanUser ? c.level === 'Year 1 (Freshman)' : isSophomoreUser ? c.level === 'Year 2 (Sophomore)' : true
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
                      addToast('success', 'نقاط تفاعل أكاديمي', `حصلت على +${pts} نقطة جديدة!`);
                    }}
                  />
                );
              })()}

              {activeTab === 'community' && (
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

              {activeTab === 'campus' && (
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

              {activeTab === 'ai_assistant' && (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-black">المساعد الدراسي الهندسي بالذكاء الاصطناعي</h2>
                    <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                      استخدم مساعد الذكاء الاصطناعي لحل المعادلة التفاضلية خطوة بخطوة، توليد بنك اختيارات متعددة (MCQ) تفاعلي، أو الحصول على ملخصات فورية لأفكار المحاضرات الهندسية.
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

              {activeTab === 'admin' && activeUser.role !== 'student' && (
                <AdminModerationView
                  userRole={activeUser.role}
                  currentUser={activeUser}
                  pendingFiles={files.filter((f) => f.status === 'pending')}
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

              {activeTab === 'not_found' && (
                <NotFoundView onGoHome={() => setActiveTab('dashboard')} />
              )}

              {activeTab === 'server_error' && (
                <ServerErrorView onGoHome={() => setActiveTab('dashboard')} onRetry={() => window.location.reload()} />
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
            activeUser?.level === 'Year 1 (Freshman)'
              ? courses.filter((c) => c.level === 'Year 1 (Freshman)')
              : activeUser?.level === 'Year 2 (Sophomore)'
              ? courses.filter((c) => c.level === 'Year 2 (Sophomore)')
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
              bio: updatedFields.bio
            };
            setUser(updated);
            EngHubStorage.saveUser(updated);
            addToast('success', 'Profile Updated', 'Your name, profile picture, and bio have been saved.');
          }}
          onUpdateBio={(bio) => {
            if (!user) return;
            const updated = { ...user, bio };
            setUser(updated);
            EngHubStorage.saveUser(updated);
            addToast('success', 'Bio Updated', 'Your profile bio is saved.');
          }}
        />
      )}

      {/* Command Palette (Cmd + K Search) */}
      <CommandPalette
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        courses={
          activeUser?.level === 'Year 1 (Freshman)'
            ? courses.filter((c) => c.level === 'Year 1 (Freshman)')
            : activeUser?.level === 'Year 2 (Sophomore)'
            ? courses.filter((c) => c.level === 'Year 2 (Sophomore)')
            : courses
        }
        files={
          activeUser?.level === 'Year 1 (Freshman)'
            ? files.filter(
                (f) =>
                  f.status === 'approved' &&
                  ['course-eng011', 'course-eng021', 'course-eng041', 'course-eng031', 'course-eng051', 'course-hum011'].includes(f.courseId)
              )
            : activeUser?.level === 'Year 2 (Sophomore)'
            ? files.filter(
                (f) =>
                  f.status === 'approved' &&
                  ['course-hum131', 'course-engx13', 'course-aie101', 'course-aie111', 'course-aie103', 'course-humx32'].includes(f.courseId)
              )
            : files.filter((f) => f.status === 'approved')
        }
        discussions={discussions}
        announcements={announcements}
        onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
        onOpenFile={(fileId) => setSelectedFileId(fileId)}
        onSelectDiscussion={(discId) => {
          setActiveTab('community');
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
          addToast('success', `Welcome back, ${authenticatedUser.name}!`, 'Session active and authenticated.');
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
