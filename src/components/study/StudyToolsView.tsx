import {
  Calendar,
  CheckSquare,
  GraduationCap,
  Download,
  Check,
  Clock,
  FileQuestion,
  Flame,
} from "lucide-react";
import React, { useState } from "react";
import { Assignment, ScheduleItem, Course, UserProfile } from "../../types";
import { ScrollableTabs, ScrollableTabItem } from "../common/ScrollableTabs";
import { Card, Button, Badge } from "../ui";
import { ExamsQuizzesEngine } from "./ExamsQuizzesEngine";
import { PomodoroFocusTimer } from "./PomodoroFocusTimer";

interface StudyToolsViewProps {
  assignments: Assignment[];
  schedule: ScheduleItem[];
  courses: Course[];
  user?: UserProfile | null;
  onAddAssignment: (asgn: Partial<Assignment>) => void;
  onUpdateAssignmentStatus: (id: string, status: Assignment["status"]) => void;
  onUpdatePoints?: (points: number) => void;
}

export const StudyToolsView: React.FC<StudyToolsViewProps> = ({
  assignments,
  schedule,
  courses,
  user,
  _onAddAssignment,
  onUpdateAssignmentStatus,
  onUpdatePoints,
}) => {
  const [activeSubTool, setActiveSubTool] = useState<
    "exams" | "pomodoro" | "assignments" | "calendar" | "graduation"
  >("exams");

  // Study Loop Bridge State (when jumping from Exam review / mistakes to Pomodoro)
  const [pomodoroPreload, setPomodoroPreload] = useState<{
    courseCode: string;
    taskName: string;
  } | null>(null);

  // Fallback user object if not passed
  const currentUser: UserProfile = user || {
    id: "usr-current",
    email: "student@enghub.edu",
    name: "Alex Vance",
    role: "student",
    level: "Year 2 (Sophomore)",
    departmentId: "dept-cmp",
    departmentName: "هندسة الحاسب والذكاء الاصطناعي",
    points: 120,
    studentId: "20230145",
    universityId: "uni-helwan",
    facultyId: "fac-eng-h",
    semester: "Fall 2026",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "طالب هندسة حاسبات مهتم بالذكاء الاصطناعي والأنظمة المدمجة",
    badges: [],
    savedBookmarks: [],
    enrolledCourseIds: [],
    createdAt: new Date().toISOString(),
  };

  // Study Loop Bridge State (when jumping from Exam review / mistakes to Pomodoro)
  const exportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EngHub Student Platform//AR\n";
    schedule.forEach((item) => {
      icsContent += `BEGIN:VEVENT\nSUMMARY:${item.courseCode} - ${item.title}\nLOCATION:${item.location}\nDESCRIPTION:أستاذ المقرر: ${item.instructor || "قسم الهندسة"}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "جدول_المحاضرات_الهندسي.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Study Tools Navigation Tabs Definitions
  const studyToolTabs: ScrollableTabItem[] = [
    {
      id: "exams",
      label: "بنك الامتحانات والاختبارات (Exams/Quizzes)",
      icon: <FileQuestion className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: "pomodoro",
      label: "مؤقت التركيز الهندسي (Pomodoro)",
      icon: <Flame className="w-4 h-4 text-amber-400" />,
    },
    {
      id: "assignments",
      label: "جدول التكليفات والمواعيد",
      icon: <CheckSquare className="w-4 h-4" />,
      badge: assignments.filter((a) => a.status !== "submitted" && a.status !== "graded").length,
    },
    {
      id: "calendar",
      label: "الجدول الدراسي والتقويم (.ics)",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "graduation",
      label: "متطلبات التخرج والدرجة العلمية",
      icon: <GraduationCap className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6 pb-12" id="study-tools-suite">
      {/* Sub-tool Selection Bar using ScrollableTabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <ScrollableTabs
          tabs={studyToolTabs}
          activeTab={activeSubTool}
          onTabChange={(id) => setActiveSubTool(id as any)}
          ariaLabel="شريط أدوات الدراسة الهندسية"
        />
      </div>

      {/* ------------------------------------------------ */}
      {/* 1. EXAMS & QUIZZES ENGINE                       */}
      {/* ------------------------------------------------ */}
      {activeSubTool === "exams" && (
        <ExamsQuizzesEngine
          courses={courses}
          currentUser={currentUser}
          onUpdatePoints={onUpdatePoints}
          onStartPomodoroStudy={(courseCode, taskName) => {
            setPomodoroPreload({ courseCode, taskName });
            setActiveSubTool("pomodoro");
          }}
        />
      )}

      {/* ------------------------------------------------ */}
      {/* 2. POMODORO FOCUS TIMER                         */}
      {/* ------------------------------------------------ */}
      {activeSubTool === "pomodoro" && (
        <PomodoroFocusTimer
          courses={courses}
          currentUser={currentUser}
          onUpdatePoints={onUpdatePoints}
          initialCourseCode={pomodoroPreload?.courseCode}
          initialTask={pomodoroPreload?.taskName}
          onBackToExams={() => setActiveSubTool("exams")}
        />
      )}

      {/* ------------------------------------------------ */}
      {/* 4. ASSIGNMENTS & DEADLINES                      */}
      {/* ------------------------------------------------ */}
      {activeSubTool === "assignments" && (
        <div className="space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                  جدول التكليفات والشيتات الهندسية ({assignments.length})
                </h3>
                <p className="text-xs text-ehb-text-muted">
                  تابع مواعيد تسليم الشيتات والمشاريع المعملية بدقة.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {assignments.map((asgn) => (
                <Card
                  key={asgn.id}
                  padding="md"
                  className="flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ehb-text-primary">
                        {asgn.title}
                      </span>
                      <Badge variant="neutral" size="sm" className="course-code">
                        {asgn.courseCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-ehb-text-muted">{asgn.description}</p>
                    <div className="text-[11px] text-ehb-text-muted flex items-center gap-3">
                      <span>
                        موعد التسليم:{" "}
                        <bdi className="course-code" dir="ltr">
                          {new Date(asgn.dueDate).toLocaleDateString("ar-EG")}
                        </bdi>
                      </span>
                      <span>الدرجة: {asgn.totalPoints} درجة</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={asgn.status === "submitted" ? "success" : "secondary"}
                      size="sm"
                      onClick={() =>
                        onUpdateAssignmentStatus(
                          asgn.id,
                          asgn.status === "submitted" ? "todo" : "submitted",
                        )
                      }
                    >
                      {asgn.status === "submitted" ? "✓ تم التسليم" : "معلق"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* 5. SCHEDULE & .ICS EXPORT                        */}
      {/* ------------------------------------------------ */}
      {activeSubTool === "calendar" && (
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                الجدول الدراسي الأسبوعي وتصدير التقويم
              </h3>
              <p className="text-xs text-ehb-text-muted">
                يمكنك تحميل ملف (.ics) لمزامنة جدولك مع Google Calendar أو Apple Calendar.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={exportICS}
              leftIcon={<Download className="w-4 h-4" />}
              className="shrink-0"
            >
              تصدير الجدول إلى Google/Apple Calendar (.ics)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((item) => (
              <Card key={item.id} padding="md" className="space-y-2">
                <div className="flex items-center justify-between font-bold text-ehb-text-primary">
                  <span>{item.dayOfWeek}</span>
                  <Badge variant="neutral" size="sm" className="course-code">
                    {item.startTime} - {item.endTime}
                  </Badge>
                </div>
                <div className="font-semibold text-ehb-text-primary">{item.title}</div>
                <div className="text-xs text-ehb-text-muted">
                  القاعة: {item.location} • المحاضر: {item.instructor || "قسم الهندسة"}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ */}
      {/* 6. GRADUATION TRACKER                            */}
      {/* ------------------------------------------------ */}
      {activeSubTool === "graduation" && (
        <Card padding="lg" className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
              متابع خريجي وتراكمي بكالوريوس الهندسة
            </h3>
            <p className="text-xs text-ehb-text-muted">
              الساعات المطلوبة: 140 ساعة معتمدة إجمالية (المواد الأساسية + الرياضيات + مواد التخصص +
              مشروع التخرج)
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>إجمالي الساعات المكتملة: 82 / 140 ساعة</span>
              <span className="text-emerald-400">58.5% إنجاز الخطة</span>
            </div>
            <div className="w-full h-3 rounded-full bg-ehb-surface-elevated-2 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 w-[58.5%]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <Card padding="md" className="space-y-2">
              <h4 className="font-bold text-ehb-text-primary">
                متطلبات الخطة الدراسية والأقسام
              </h4>
              <ul className="space-y-1.5 text-ehb-text-muted">
                <li className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5" /> العلوم الأساسية والرياضيات (32/32 ساعة)
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5" /> أساسيات التخصص الأكاديمي (36/36 ساعة)
                </li>
                <li className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> المقررات التخصصية المتقدمة (14/30 ساعة)
                </li>
                <li className="flex items-center gap-1.5 text-ehb-text-muted">
                  <Clock className="w-3.5 h-3.5" /> مشروع التخرج النهائي (0/10 ساعات)
                </li>
              </ul>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
};
