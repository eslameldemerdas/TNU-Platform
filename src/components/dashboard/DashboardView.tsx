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
  Megaphone,
} from "lucide-react";
import React from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  UserProfile,
  Department,
  Course,
  StudyFile,
  Assignment,
  ScheduleItem,
  Announcement,
} from "../../types";
import { CourseCoverImage } from "../common/CourseCoverImage";
import { Card, IconContainer, Button, Badge, Skeleton, EmptyState, CardSkeleton } from "../ui";

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
  isLoading?: boolean;
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
  onUploadClick,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const isFreshman = user?.level === "Year 1 (Freshman)";
  const isSophomore = user?.level === "Year 2 (Sophomore)";

  const isMechatronicsUser =
    user?.departmentId === "dept-mtr" ||
    (user?.departmentName
      ? user.departmentName.toLowerCase().includes("mechatronics")
      : false) ||
    (user?.departmentName ? user.departmentName.includes("ميكاترونكس") : false);

  const isMechatronicsLevel1 =
    isMechatronicsUser &&
    (isSophomore ||
      isFreshman ||
      user?.level?.includes("المستوى الأول") ||
      user?.level?.includes("سنة ثانية"));

  const enrolledIds = user?.enrolledCourseIds || [];

  const userCourses = courses.filter((c) => {
    if (isMechatronicsLevel1) {
      return c.departmentId === "dept-mtr";
    }
    return isFreshman
      ? c.level === "Year 1 (Freshman)"
      : isSophomore
        ? c.level === "Year 2 (Sophomore)"
        : enrolledIds.length > 0
          ? enrolledIds.includes(c.id)
          : activeDept
            ? c.departmentId === activeDept.id
            : true;
  });

  const userCourseIds = userCourses.map((c) => c.id);

  const pendingAssignments = assignments
    .filter((a) => a.status !== "graded")
    .filter((a) => (isFreshman || isSophomore ? userCourseIds.includes(a.courseId) : true));

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);

  const userFiles = recentFiles.filter((f) =>
    isFreshman || isSophomore ? userCourseIds.includes(f.courseId) : true,
  );

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <Card padding="lg" className="space-y-4">
          <Skeleton width="40%" height={20} />
          <Skeleton width="70%" height={28} />
          <Skeleton width="50%" height={16} />
          <div className="flex gap-3 pt-2">
            <Skeleton width={120} height={40} />
            <Skeleton width={140} height={40} />
          </div>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton width="30%" height={20} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} showImage />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Context Strip — compact, token-styled */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {activeDept && (
                <Badge variant="primary" size="sm" dot>
                  {activeDept.name}
                </Badge>
              )}
              <Badge variant="neutral" size="sm">
                {user?.level || t.common.appName}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ehb-text-primary">
              {t.dashboard.welcome}{" "}
              <span className="bdi-isolate" dir="ltr">
                {user?.name || "Student"}
              </span>
              !
            </h1>
            <p className="text-xs sm:text-sm text-ehb-text-muted max-w-xl">
              {t.dashboard.subWelcome}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {user?.role !== "student" && (
              <Button
                variant="secondary"
                size="md"
                onClick={onUploadClick}
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="flex-1 sm:flex-initial"
              >
                {t.nav.uploadResource}
              </Button>
            )}
            <Button
              variant="attention"
              size="md"
              onClick={() => onNavigateTab("ai_assistant")}
              leftIcon={<Bot className="w-4 h-4 text-slate-950" />}
              className="flex-1 sm:flex-initial"
            >
              {t.common.aiBuddy}
            </Button>
          </div>
        </div>
      </Card>

      {/* Official & Pinned Faculty Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          {pinnedAnnouncements.map((anc) => (
            <Card
              key={anc.id}
              padding="md"
              className={`flex items-start gap-3.5 ${
                anc.priority === "urgent"
                  ? "border-rose-500/30 bg-rose-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-ehb-md flex items-center justify-center shrink-0 mt-0.5 ${
                  anc.priority === "urgent"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }`}
              >
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-ehb-text-primary">
                    {anc.title}
                  </span>
                  <Badge
                    variant={anc.priority === "urgent" ? "error" : "warning"}
                    size="sm"
                    dot
                  >
                    {anc.priority === "urgent" ? "عاجل" : "هام"}
                  </Badge>
                  <span className="text-[10px] text-ehb-text-muted font-mono">
                    {anc.date}
                  </span>
                </div>
                <p className="text-xs text-ehb-text-muted leading-relaxed whitespace-pre-wrap">
                  {anc.content}
                </p>
                <p className="text-[10px] text-ehb-text-muted">
                  صادر عن:{" "}
                  <strong className="text-ehb-text-primary">
                    {anc.authorName
                      ? anc.authorName.replace(/\(Super Admin\)/gi, "").trim()
                      : "إدارة الكلية"}
                  </strong>
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ehb-text-muted">
              {t.dashboard.enrolledCourses}
            </span>
            <IconContainer size="sm" variant="warning">
              <BookOpen className="w-4 h-4" />
            </IconContainer>
          </div>
          <div className="text-2xl font-black text-ehb-text-primary tabular-nums">
            {userCourses.length}
          </div>
          <p className="text-[11px] text-ehb-text-muted font-medium">
            {user?.semester || "Fall 2026"}
          </p>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ehb-text-muted">
              {t.dashboard.pendingAssignments}
            </span>
            <IconContainer size="sm" variant="warning">
              <CalendarCheck className="w-4 h-4" />
            </IconContainer>
          </div>
          <div className="text-2xl font-black text-ehb-text-primary tabular-nums">
            {pendingAssignments.length}
          </div>
          <p className="text-[11px] text-amber-400 font-semibold">
            {pendingAssignments.length > 0
              ? `${Math.min(pendingAssignments.length, 2)} ${t.dashboard.upcomingDeadlines}`
              : "لا توجد تسليمات معلقة"}
          </p>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ehb-text-muted">
              {t.dashboard.rewardPoints}
            </span>
            <IconContainer size="sm" variant="warning">
              <Award className="w-4 h-4" />
            </IconContainer>
          </div>
          <div className="text-2xl font-black text-ehb-text-primary tabular-nums">
            {user?.points ?? 0} {t.common.points}
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold">
            {user?.points && user.points > 100 ? t.dashboard.top10Percent : "استمر في التقدم"}
          </p>
        </Card>

        {userCourses.length > 0 && (
          <Card padding="md" className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ehb-text-muted">
                ملفات الدراسة المتاحة
              </span>
              <IconContainer size="sm" variant="info">
                <FileText className="w-4 h-4" />
              </IconContainer>
            </div>
            <div className="text-2xl font-black text-ehb-text-primary tabular-nums">
              {userFiles.length}
            </div>
            <p className="text-[11px] text-ehb-text-muted font-medium">
              {t.dashboard.verifiedFiles}
            </p>
          </Card>
        )}
      </div>

      {/* Main Grid: Courses + Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Workspaces */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ehb-text-primary tracking-tight">
              {t.dashboard.activeWorkspaces}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab("courses")}
              rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}
            >
              {t.dashboard.viewAllCourses}
            </Button>
          </div>

          {userCourses.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={BookOpen}
                title="لا توجد مقررات نشطة حالياً"
                description="لم يتم تسجيلك في أي مقرر دراسي بعد. توجه لقسم المقررات لاستعراض المواد المتاحة."
                actionLabel="استعراض المقررات"
                onAction={() => onNavigateTab("courses")}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCourses.slice(0, 4).map((course) => (
                <Card
                  key={course.id}
                  variant="interactive"
                  padding="none"
                  onClick={() => onSelectCourse(course.id)}
                  className="overflow-hidden"
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
                      <span className="course-code text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 w-fit uppercase tracking-wider font-mono">
                        {course.code}
                      </span>
                      <h3 className="text-xs font-bold text-white truncate mt-1">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-ehb-text-muted">
                      <span>{course.instructor}</span>
                      <span className="font-semibold tabular-nums">
                        {course.credits} {t.dashboard.credits}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-ehb-subtle text-xs">
                      <span className="text-ehb-text-muted tabular-nums">
                        {course.fileCount} {t.dashboard.resourcesCount}
                      </span>
                      <span className="text-indigo-400 font-bold inline-flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                        {t.dashboard.openWorkspace}{" "}
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Timetable & Assignments */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconContainer size="sm" variant="warning">
                  <Clock className="w-4 h-4" />
                </IconContainer>
                <h3 className="text-xs font-bold text-ehb-text-primary uppercase tracking-wider">
                  {t.dashboard.todaysSchedule}
                </h3>
              </div>
              <Badge variant="neutral" size="sm">
                {schedule.length}
              </Badge>
            </div>

            {schedule.length === 0 ? (
              <p className="text-xs text-ehb-text-muted">لا توجد محاضرات اليوم</p>
            ) : (
              <div className="space-y-2.5">
                {schedule.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-ehb-md bg-ehb-surface border border-ehb-subtle text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ehb-text-primary font-mono course-code">
                        {item.courseCode}
                      </span>
                      <span className="text-[10px] font-mono text-ehb-text-muted bg-ehb-surface-elevated-2 px-1.5 py-0.5 rounded-ehb-sm">
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>
                    <p className="font-semibold text-ehb-text-primary">{item.title}</p>
                    <p className="text-[11px] text-ehb-text-muted">
                      {item.location} • {item.instructor || "قسم الهندسة"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Deadlines */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ehb-text-primary uppercase tracking-wider">
                {t.dashboard.upcomingDeadlines}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab("study_tools")}
              >
                {t.dashboard.tracker}
              </Button>
            </div>

            {pendingAssignments.length === 0 ? (
              <p className="text-xs text-ehb-text-muted">لا توجد تسليمات معلقة</p>
            ) : (
              <div className="space-y-2">
                {pendingAssignments.slice(0, 3).map((asgn) => (
                  <div
                    key={asgn.id}
                    className="p-3 rounded-ehb-md bg-ehb-surface border border-ehb-subtle text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ehb-text-primary font-mono course-code">
                        {asgn.courseCode}
                      </span>
                      <Badge variant="warning" size="sm">
                        تسليم {asgn.dueDate}
                      </Badge>
                    </div>
                    <p className="text-ehb-text-primary font-medium line-clamp-1">
                      {asgn.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Files Feed */}
      {userFiles.length > 0 && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ehb-text-primary tracking-tight">
              {t.dashboard.peerResources}
            </h2>
            <Badge variant="neutral" size="sm">
              {t.dashboard.verifiedFiles}
            </Badge>
          </div>

          <div className="space-y-2">
            {userFiles.slice(0, 4).map((file) => (
              <div
                key={file.id}
                onClick={() => onOpenFile(file.id)}
                className="p-3.5 rounded-ehb-md border border-ehb-default bg-ehb-surface hover:bg-ehb-surface-elevated-2 cursor-pointer flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-ehb-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-ehb-text-primary group-hover:text-amber-400 transition-colors truncate">
                      {file.title}
                    </h4>
                    <p className="text-[11px] text-ehb-text-muted truncate mt-0.5">
                      {t.dashboard.uploadedBy} {file.uploaderName} • {file.fileSize} • ★{" "}
                      {file.rating} ({file.ratingCount})
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFile(file.id);
                  }}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  <span className="hidden sm:inline">{t.dashboard.preview}</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
