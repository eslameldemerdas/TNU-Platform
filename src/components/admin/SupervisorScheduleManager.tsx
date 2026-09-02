import {
  Calendar,
  Plus,
  MapPin,
  User,
  Trash2,
  Edit3,
  Download,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Search,
  Clock,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { ScheduleItem, Course, Department, UserProfile } from "../../types";
import { isWithinSupervisorScope, getSupervisorScopeLabel } from "../../utils/permissionUtils";

interface SupervisorScheduleManagerProps {
  user: UserProfile | null;
  schedule: ScheduleItem[];
  courses: Course[];
  departments: Department[];
  onAddScheduleItem: (item: Omit<ScheduleItem, "id">) => void;
  onUpdateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  onDeleteScheduleItem: (id: string) => void;
}

const DEFAULT_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export const SupervisorScheduleManager: React.FC<SupervisorScheduleManagerProps> = ({
  user,
  schedule,
  courses,
  departments,
  onAddScheduleItem,
  onUpdateScheduleItem,
  onDeleteScheduleItem,
}) => {
  const [activeDayFilter, setActiveDayFilter] = useState<string>("all");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customDays, setCustomDays] = useState<string[]>(DEFAULT_DAYS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Form Fields
  const [fCourseId, setFCourseId] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fType, setFType] = useState<ScheduleItem["type"]>("lecture");
  const [fDayOfWeek, setFDayOfWeek] = useState("الإثنين");
  const [fStartTime, setFStartTime] = useState("09:00");
  const [fEndTime, setFEndTime] = useState("11:00");
  const [fLocation, setFLocation] = useState("");
  const [fInstructor, setFInstructor] = useState("");
  const [fAttendanceNotes, setFAttendanceNotes] = useState("");
  const [newCustomDayInput, setNewCustomDayInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const scopeLabel = getSupervisorScopeLabel(user, departments);

  // Allowed courses for user
  const allowedCourses = courses.filter((c) =>
    isWithinSupervisorScope(user, {
      departmentId: c.departmentId,
      level: c.level,
      courseId: c.id,
    }),
  );

  const handleAddCustomDay = () => {
    if (!newCustomDayInput.trim()) return;
    const cleanDay = newCustomDayInput.trim();
    if (!customDays.includes(cleanDay)) {
      setCustomDays([...customDays, cleanDay]);
      setActiveDayFilter(cleanDay);
    }
    setNewCustomDayInput("");
  };

  const openCreateModal = (presetDay?: string) => {
    setEditingItem(null);
    const defaultCourse = allowedCourses[0] || courses[0];
    setFCourseId(defaultCourse?.id || "");
    setFTitle(defaultCourse ? `محاضرة ${defaultCourse.title}` : "");
    setFType("lecture");
    setFDayOfWeek(presetDay || (activeDayFilter !== "all" ? activeDayFilter : "الإثنين"));
    setFStartTime("09:00");
    setFEndTime("11:00");
    setFLocation(defaultCourse?.location || "مدرج 1 - مبنى الحاسب");
    setFInstructor(defaultCourse?.instructor || "د. أستاذ المقرر");
    setFAttendanceNotes("نسبة الحضور إجبارية 85% - تسجيل الغياب الكتروني");
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    const course = courses.find((c) => c.id === item.courseId);
    const canEdit = isWithinSupervisorScope(user, {
      departmentId: item.departmentId || course?.departmentId,
      level: item.level || course?.level,
      courseId: item.courseId,
    });

    if (!canEdit) {
      alert("عذراً، هذا السكشن/المحاضرة يقع خارج نطاق صلاحية إشرافك.");
      return;
    }

    setEditingItem(item);
    setFCourseId(item.courseId);
    setFTitle(item.title);
    setFType(item.type || "lecture");
    setFDayOfWeek(item.dayOfWeek);
    setFStartTime(item.startTime);
    setFEndTime(item.endTime);
    setFLocation(item.location);
    setFInstructor(item.instructor);
    setFAttendanceNotes(item.attendanceNotes || "");
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) {
      setErrorMessage("يرجى كتابة عنوان المادة/المحاضرة.");
      return;
    }

    const selectedCourse = courses.find((c) => c.id === fCourseId);
    if (!selectedCourse) {
      setErrorMessage("يرجى تحديد المقرر الأكاديمي المرتبط.");
      return;
    }

    const canManage = isWithinSupervisorScope(user, {
      departmentId: selectedCourse.departmentId,
      level: selectedCourse.level,
      courseId: selectedCourse.id,
    });

    if (!canManage) {
      setErrorMessage("ليس لديك صلاحية لإشراف وتعديل جداول هذا القسم/المقرر.");
      return;
    }

    const payload: Omit<ScheduleItem, "id"> = {
      courseId: selectedCourse.id,
      courseCode: selectedCourse.code,
      title: fTitle.trim(),
      type: fType,
      dayOfWeek: fDayOfWeek,
      startTime: fStartTime,
      endTime: fEndTime,
      location: fLocation.trim() || "كلية الهندسة",
      instructor: fInstructor.trim() || selectedCourse.instructor,
      departmentId: selectedCourse.departmentId,
      level: selectedCourse.level,
      attendanceNotes: fAttendanceNotes.trim() || undefined,
    };

    if (editingItem) {
      onUpdateScheduleItem(editingItem.id, payload);
    } else {
      onAddScheduleItem(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (item: ScheduleItem) => {
    const course = courses.find((c) => c.id === item.courseId);
    const canDelete = isWithinSupervisorScope(user, {
      departmentId: item.departmentId || course?.departmentId,
      level: item.level || course?.level,
      courseId: item.courseId,
    });

    if (!canDelete) {
      alert("ليس لديك صلاحية لحذف محاضرة خارج اختصاصك.");
      return;
    }

    if (window.confirm(`هل أنت متأكد من إزالة "${item.title}" من جدول الحضور؟`)) {
      onDeleteScheduleItem(item.id);
    }
  };

  // Conflict Detector Logic: Check if two slots overlap in time and location
  const conflicts: { item1: ScheduleItem; item2: ScheduleItem }[] = [];
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const a = schedule[i];
      const b = schedule[j];
      if (a.dayOfWeek === b.dayOfWeek && a.location.toLowerCase() === b.location.toLowerCase()) {
        if (a.startTime < b.endTime && a.endTime > b.startTime) {
          conflicts.push({ item1: a, item2: b });
        }
      }
    }
  }

  // Filtered Schedule
  const filteredSchedule = schedule.filter((item) => {
    const course = courses.find((c) => c.id === item.courseId);
    const matchesDay = activeDayFilter === "all" || item.dayOfWeek === activeDayFilter;
    const matchesDept =
      selectedDeptId === "all" ||
      course?.departmentId === selectedDeptId ||
      item.departmentId === selectedDeptId;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.instructor.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDay && matchesDept && matchesSearch;
  });

  // Calendar .ics Exporter
  const exportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EngHub Supervisor Timetable//AR\n";
    filteredSchedule.forEach((item) => {
      icsContent += `BEGIN:VEVENT\nSUMMARY:${item.courseCode} - ${item.title}\nLOCATION:${item.location}\nDESCRIPTION:أستاذ المقرر: ${item.instructor}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "الجدول_الدراسي_الرسمي.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type: ScheduleItem["type"]) => {
    switch (type) {
      case "lecture":
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
            محاضرة نظرية
          </span>
        );
      case "section":
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            سكشن تمارين
          </span>
        );
      case "lab":
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px]">
            معمل تطبيقي
          </span>
        );
      case "office_hour":
        return (
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
            ساعات مكتبية
          </span>
        );
      case "exam":
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
            امتحان / اختبار
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 font-bold text-[10px]">
            حصّة
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Scope Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 text-white space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
              <Calendar className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                إدارة وتعديل الجدول الأسبوعي ومحاضرات الحضور
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">{scopeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportICS}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تصدير (.ics)</span>
            </button>

            <button
              onClick={() => openCreateModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حصة / محاضرة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Alert Notice if overlapping rooms detected */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>تنبيه التعارضات المكانية والزمانية المكتشفة ({conflicts.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
            {conflicts.slice(0, 3).map((c, idx) => (
              <li key={idx}>
                تضارب في القاعة <strong>&quot;{c.item1.location}&quot;</strong> يوم{" "}
                <strong>{c.item1.dayOfWeek}</strong> بين &quot;{c.item1.courseCode}&quot; (
                {c.item1.startTime}-{c.item1.endTime}) و &quot;{c.item2.courseCode}&quot; (
                {c.item2.startTime}-{c.item2.endTime}).
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Days & Filter Control Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        {/* Days Pills Selector & Add Custom Day */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>تصفية حسب اليوم أو تعديل وتنظيم الأيام الدراسية:</span>
            <span className="text-slate-400 text-[11px]">انقر على اليوم لتخصيص جدول الحضور</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveDayFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDayFilter === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              عرض كافة أيام الأسبوع
            </button>

            {customDays.map((day) => {
              const dayCount = schedule.filter((s) => s.dayOfWeek === day).length;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDayFilter(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeDayFilter === day
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <span>{day}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {dayCount}
                  </span>
                </button>
              );
            })}

            {/* Quick Add Custom Day Input */}
            <div className="flex items-center gap-1 mr-auto">
              <input
                type="text"
                value={newCustomDayInput}
                onChange={(e) => setNewCustomDayInput(e.target.value)}
                placeholder="إضافة يوم فرعي..."
                className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomDay}
                className="p-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
                title="إضافة هذا اليوم للقائمة"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Department Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم المحاضرة، أستاذ القاعة، أو المدرج..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">كل أقسام الكلية</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Systematic Grid Schedule Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {(activeDayFilter === "all" ? customDays : [activeDayFilter]).map((day) => {
          const dayItems = filteredSchedule
            .filter((s) => s.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={day}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {day}
                </span>
                <button
                  onClick={() => openCreateModal(day)}
                  className="p-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1"
                  title={`إضافة محاضرة ليوم ${day}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>

              <div className="space-y-2.5 flex-1">
                {dayItems.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-6 text-center">
                    لا توجد محاضرات مجدولة لهذا اليوم.
                  </p>
                ) : (
                  dayItems.map((item) => {
                    const course = courses.find((c) => c.id === item.courseId);
                    const canManage = isWithinSupervisorScope(user, {
                      departmentId: item.departmentId || course?.departmentId,
                      level: item.level || course?.level,
                      courseId: item.courseId,
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-2 transition-all hover:border-blue-500/50"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            {item.courseCode}
                          </span>
                          {getTypeBadge(item.type)}
                        </div>

                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2">
                          {item.title}
                        </p>

                        <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>
                              {item.startTime} - {item.endTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.location}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{item.instructor}</span>
                          </div>

                          {item.attendanceNotes && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 p-1 rounded-lg mt-1">
                              {item.attendanceNotes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                          {canManage ? (
                            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> اختصاصك
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                              <Lock className="w-3 h-3" /> محمي
                            </span>
                          )}

                          {canManage && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                title="تعديل الحصة"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600"
                                title="حذف الحصة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form for Add/Edit Schedule Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {editingItem
                    ? "تعديل موعد الحصة بالجدول"
                    : "إضافة حِصّة / محاضرة جديدة للجدول الأسبوعي"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Course Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المقرر الأكاديمي:
                </label>
                <select
                  value={fCourseId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setFCourseId(cid);
                    const found = courses.find((c) => c.id === cid);
                    if (found) {
                      setFTitle(`محاضرة ${found.title}`);
                      setFLocation(found.location || fLocation);
                      setFInstructor(found.instructor || fInstructor);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {courses.map((c) => {
                    const isAllowed = isWithinSupervisorScope(user, {
                      departmentId: c.departmentId,
                      level: c.level,
                      courseId: c.id,
                    });
                    return (
                      <option key={c.id} value={c.id} disabled={!isAllowed}>
                        {c.code} - {c.title} {!isAllowed ? "(خارج نطاق إشرافك)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المادة / الفئة:
                  </label>
                  <input
                    type="text"
                    value={fTitle}
                    onChange={(e) => setFTitle(e.target.value)}
                    placeholder="مثال: محاضرة الدوائر الكهربية"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع اللقاء:
                  </label>
                  <select
                    value={fType}
                    onChange={(e) => setFType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lecture">محاضرة نظرية</option>
                    <option value="section">سكشن تمارين</option>
                    <option value="lab">معمل تطبيقي</option>
                    <option value="office_hour">ساعات مكتبية</option>
                    <option value="exam">امتحان / اختبار</option>
                  </select>
                </div>
              </div>

              {/* Day & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    يوم الأسبوع:
                  </label>
                  <select
                    value={fDayOfWeek}
                    onChange={(e) => setFDayOfWeek(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    {customDays.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وقت البداية:
                  </label>
                  <input
                    type="text"
                    value={fStartTime}
                    onChange={(e) => setFStartTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وقت النهاية:
                  </label>
                  <input
                    type="text"
                    value={fEndTime}
                    onChange={(e) => setFEndTime(e.target.value)}
                    placeholder="11:00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Location & Instructor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المدرج / المعمل / المكان:
                  </label>
                  <input
                    type="text"
                    value={fLocation}
                    onChange={(e) => setFLocation(e.target.value)}
                    placeholder="مدرج 2 - مبنى الحاسبات"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    أستاذ / المحاضر / المعيد:
                  </label>
                  <input
                    type="text"
                    value={fInstructor}
                    onChange={(e) => setFInstructor(e.target.value)}
                    placeholder="د. طارق محمود"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Attendance Notes Policy */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وسياسة الحضور (اختياري):
                </label>
                <input
                  type="text"
                  value={fAttendanceNotes}
                  onChange={(e) => setFAttendanceNotes(e.target.value)}
                  placeholder="مثال: الحضور إجباري - يُفتح الـ QR في أول 10 دقائق فقط"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-all"
                >
                  {editingItem ? "تحديث الحصة" : "حفظ بالجدول الرسمى"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
