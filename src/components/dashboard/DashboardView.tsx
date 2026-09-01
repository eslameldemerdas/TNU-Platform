import React from 'react';
import { motion } from 'motion/react';
import { CourseCoverImage } from '../common/CourseCoverImage';
import {
  UserProfile,
  Department,
  Course,
  StudyFile,
  Assignment,
  ScheduleItem,
  Announcement
} from '../../types';
import {
  BookOpen,
  CalendarCheck,
  Award,
  Clock,
  ArrowRight,
  FileText,
  Download,
  Bot,
  PlusCircle,
  Megaphone
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

interface DashboardViewProps {
  user: UserProfile | null;
  activeDept?: Department;
  courses: Course[];
  recentFiles: StudyFile[];
  assignments: Assignment[];
  schedule: ScheduleItem[];
  announcements: Announcement[];
  onSelectCourse: (courseId: string) => void;
  onOpenFile: (fileId: string) => void;
  onNavigateTab: (tab: any) => void;
  onUploadClick: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  activeDept,
  courses,
  recentFiles,
  assignments,
  schedule,
  announcements,
  onSelectCourse,
  onOpenFile,
  onNavigateTab,
  onUploadClick
}) => {
  const { t } = useTranslation();
  const isFreshman = user?.level === 'Year 1 (Freshman)';
  const isSophomore = user?.level === 'Year 2 (Sophomore)';

  const isMechatronicsUser =
    user?.departmentId === 'dept-mtr' ||
    user?.departmentName?.toLowerCase().includes('mechatronics') ||
    user?.departmentName?.includes('ميكاترونكس');

  const isMechatronicsLevel1 =
    isMechatronicsUser &&
    (isSophomore || isFreshman || user?.level?.includes('المستوى الأول') || user?.level?.includes('سنة ثانية'));

  const enrolledIds = user?.enrolledCourseIds || [];

  // Filter courses for user or active department
  const userCourses = courses.filter((c) => {
    if (isMechatronicsLevel1) {
      return c.departmentId === 'dept-mtr';
    }
    return isFreshman
      ? c.level === 'Year 1 (Freshman)'
      : isSophomore
      ? c.level === 'Year 2 (Sophomore)'
      : enrolledIds.length > 0
      ? enrolledIds.includes(c.id)
      : activeDept
      ? c.departmentId === activeDept.id
      : true;
  });

  const userCourseIds = userCourses.map((c) => c.id);

  const pendingAssignments = assignments
    .filter((a) => a.status !== 'graded')
    .filter((a) => (isFreshman || isSophomore ? userCourseIds.includes(a.courseId) : true));

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);

  const userFiles = recentFiles.filter((f) =>
    isFreshman || isSophomore ? userCourseIds.includes(f.courseId) : true
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {activeDept ? activeDept.name : t.common.appName}
              </span>
              <span className="text-xs text-slate-300">• {user?.level || 'Student'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              {t.dashboard.welcome} <bdi>{user?.name || 'Student'}</bdi>!
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 max-w-xl">
              {t.dashboard.subWelcome}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {user?.role !== 'student' && (
              <button
                onClick={onUploadClick}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-lg transition-all active:scale-95 min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>{t.nav.uploadResource}</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('ai_assistant')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-95 min-h-[44px]"
            >
              <Bot className="w-4 h-4 text-slate-950" />
              <span>{t.common.aiBuddy}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official & Pinned Faculty Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          {pinnedAnnouncements.map((anc) => (
            <div
              key={anc.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 shadow-sm ${
                anc.priority === 'urgent'
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/20'
                  : 'border-amber-300 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/20'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  anc.priority === 'urgent'
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                <Megaphone className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {anc.title}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                      anc.priority === 'urgent'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {anc.priority === 'urgent' ? '🔥 إعلان رسمي عاجل' : '📢 إعلان هام'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-300 font-mono">
                    {anc.date}
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                  {anc.content}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-300">
                  <span>صادر عن: <strong className="text-slate-800 dark:text-slate-100">{anc.authorName ? anc.authorName.replace(/\(Super Admin\)/gi, '').trim() : 'إدارة الكلية'}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stat Cards Grid - Unified Icon Palette & Tabular Figures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Enrolled Courses */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t.dashboard.enrolledCourses}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{userCourses.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">{user?.semester || 'Fall 2026'}</p>
        </div>

        {/* Card 2: Pending Assignments */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t.dashboard.pendingAssignments}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{pendingAssignments.length}</div>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">2 {t.dashboard.upcomingDeadlines}</p>
        </div>

        {/* Card 3: Reward Points */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t.dashboard.rewardPoints}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{user?.points ?? 0} {t.common.points}</div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">{t.dashboard.top10Percent}</p>
        </div>

      </div>

      {/* Main Grid: Enrolled Courses & Schedule/Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Courses Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {t.dashboard.activeWorkspaces}
            </h2>
            <button
              onClick={() => onNavigateTab('courses')}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>{t.dashboard.viewAllCourses}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCourses.slice(0, 4).map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ y: -2 }}
                onClick={() => onSelectCourse(course.id)}
                className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-amber-500/50 transition-all"
              >
                {/* Course Banner */}
                <div className="h-28 relative overflow-hidden bg-slate-900">
                  <CourseCoverImage
                    code={course.code}
                    title={course.title}
                    bannerImage={course.bannerImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 w-fit uppercase tracking-wider font-mono">
                      {course.code}
                    </span>
                    <h3 className="text-xs font-bold text-white truncate mt-1">{course.title}</h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>{course.instructor}</span>
                    <span className="font-semibold tabular-nums">{course.credits} {t.dashboard.credits}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 tabular-nums">{course.fileCount} {t.dashboard.resourcesCount}</span>
                    <span className="text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-bold group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform inline-flex items-center gap-1">
                      {t.dashboard.openWorkspace} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Files Feed */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {t.dashboard.peerResources}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-300">{t.dashboard.verifiedFiles}</span>
            </div>

            <div className="space-y-2">
              {userFiles.slice(0, 4).map((file) => (
                <div
                  key={file.id}
                  onClick={() => onOpenFile(file.id)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        {file.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                        {t.dashboard.uploadedBy} {file.uploaderName} • {file.fileSize} • ★ {file.rating} ({file.ratingCount})
                      </p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors shrink-0">
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.dashboard.preview}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Timetable & Assignments */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {t.dashboard.todaysSchedule}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">اليوم</span>
            </div>

            <div className="space-y-2.5">
              {schedule.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{item.courseCode}</span>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.startTime} - {item.endTime}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{item.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {t.dashboard.upcomingDeadlines}
              </h3>
              <button
                onClick={() => onNavigateTab('study_tools')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:underline"
              >
                {t.dashboard.tracker}
              </button>
            </div>

            <div className="space-y-2">
              {pendingAssignments.slice(0, 3).map((asgn) => (
                <div
                  key={asgn.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{asgn.courseCode}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 tabular-nums">
                      تسليم {asgn.dueDate}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 font-medium line-clamp-1">{asgn.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
