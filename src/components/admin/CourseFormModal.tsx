import { X, BookOpen, Check, Upload, Trash2, RefreshCw } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Course, Department, AcademicLevel, Semester } from "../../types";
import { getCourseCoverSvg } from "../../utils/courseCovers";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: Partial<Course>) => void;
  initialCourse?: Course | null;
  departments: Department[];
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCourse,
  departments,
}) => {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "dept-cmp-01");
  const [level, setLevel] = useState<AcademicLevel>("Year 1 (Freshman)");
  const [semester, setSemester] = useState<Semester>("Fall 2026");
  const [credits, setCredits] = useState<number>(3);
  const [instructor, setInstructor] = useState("");
  const [instructorEmail, setInstructorEmail] = useState("");
  const [scheduleDayTime, setScheduleDayTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [bannerImage, setBannerImage] = useState("");

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const [bannerFileName, setBannerFileName] = useState("");

  const handleBannerFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)");
      return;
    }
    setBannerFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBannerImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (initialCourse) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(initialCourse.code || "");
      setTitle(initialCourse.title || "");
      setDepartmentId(initialCourse.departmentId || departments[0]?.id || "dept-cmp-01");
      setLevel(initialCourse.level || "Year 1 (Freshman)");
      setSemester(initialCourse.semester || "Fall 2026");
      setCredits(initialCourse.credits || 3);
      setInstructor(initialCourse.instructor || "");
      setInstructorEmail(initialCourse.instructorEmail || "");
      setScheduleDayTime(initialCourse.scheduleDayTime || "");
      setLocation(initialCourse.location || "");
      setDescription(initialCourse.description || "");
      setSyllabusText(
        Array.isArray(initialCourse.syllabus) ? initialCourse.syllabus.join("\n") : "",
      );
      setBannerImage(initialCourse.bannerImage || "");
    } else {
      setCode("");
      setTitle("");
      setDepartmentId(departments[0]?.id || "dept-cmp-01");
      setLevel("Year 1 (Freshman)");
      setSemester("Fall 2026");
      setCredits(3);
      setInstructor("");
      setInstructorEmail("");
      setScheduleDayTime("Mon/Wed 10:00 - 11:30 AM");
      setLocation("مدرج 1 - كلية الهندسة");
      setDescription("");
      setSyllabusText(
        "مقدمة في المادة\nالمفاهيم الأساسية\nالتطبيقات والتمارين المعملية\nالتقييم النهائي",
      );
      setBannerImage("");
    }
  }, [initialCourse, isOpen, departments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;

    const syllabusArray = syllabusText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const finalBanner = bannerImage.trim() || getCourseCoverSvg(code);

    onSubmit({
      code: code.trim(),
      title: title.trim(),
      departmentId,
      level,
      semester,
      credits: Number(credits) || 3,
      instructor: instructor.trim() || "أستاذ غير محدد",
      instructorEmail: instructorEmail.trim() || "faculty@eng.gnu.edu",
      scheduleDayTime: scheduleDayTime.trim() || "Mon/Wed 10:00 - 11:30 AM",
      location: location.trim() || "كلية الهندسة",
      description: description.trim() || "مقرر دراسي أكاديمي بملتقى الهندسة.",
      syllabus: syllabusArray,
      bannerImage: finalBanner,
    });

    onClose();
  };

  const isEdit = Boolean(initialCourse);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 dir-rtl text-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {isEdit ? `تعديل بيانات المقرر (${initialCourse?.code})` : "إضافة مقرر دراسي جديد"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit
                  ? "تعديل تفاصيل المادة وأستاذ المقرر وتخصيص الساعات"
                  : "إضافة مادة هندسية جديدة لدليل المقررات لمختلف السنوات والأقسام"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto"
        >
          {/* Row 1: Code & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                رمز المادة (Course Code) *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: AIE 101 أو ENG 041"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                اسم المقرر الكامل (Course Title) *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: مقدمة في الذكاء الاصطناعي للهندسة"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Department & Academic Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                القسم الأكاديمي (Department)
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                المستوى الدراسي (Academic Level)
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Year 1 (Freshman)">السنة الأولى (إعدادي)</option>
                <option value="Year 2 (Sophomore)">
                  السنة الثانية - الفصل الدراسي الأول (الترم الأول)
                </option>
              </select>
            </div>
          </div>

          {/* Row 3: Credits & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                الساعات المعتمدة (Credits)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={Number.isNaN(credits) || credits === undefined ? "" : credits}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setCredits(Number.isNaN(val) ? ("" as any) : val);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                الفصل الدراسي (Semester)
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Semester)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Fall 2026">الفصل الدراسي الأول (خريف 2026)</option>
                <option value="Spring 2026">الفصل الدراسي الثاني (ربيع 2026)</option>
                <option value="Summer 2026">الفصل الصيفي (صيف 2026)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Instructor Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                اسم أستاذ / محاضر المقرر
              </label>
              <input
                type="text"
                placeholder="مثال: د. طارق الخولي"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                البريد الإلكتروني للأستاذ
              </label>
              <input
                type="email"
                placeholder="faculty@eng.gnu.edu"
                value={instructorEmail}
                onChange={(e) => setInstructorEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 5: Schedule & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                مواعيد المحاضرات
              </label>
              <input
                type="text"
                placeholder="مثال: Mon/Wed 10:00 - 11:30 AM"
                value={scheduleDayTime}
                onChange={(e) => setScheduleDayTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                القاعة / المدرج / المعمل
              </label>
              <input
                type="text"
                placeholder="مثال: مدرج أ3 - كلية الهندسة"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 6: Description */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              وصف وتفاصيل المقرر الدراسي
            </label>
            <textarea
              rows={3}
              placeholder="اكتب وصفاً معبراً عن محتوى المقرر والمخرجات التعليمية والتقنيات المستخدمة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Row 7: Syllabus topics */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              موضوعات وفصول المادة (موضوع بكل سطر)
            </label>
            <textarea
              rows={3}
              placeholder="ضع كل فصل أو موضوع في سطر مستقل..."
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Row 8: Custom Banner Image from Device */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs">
              صورة غلاف المادة (من جهازك مباشرة - اختياري)
            </label>

            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBannerFile(file);
              }}
              className="hidden"
            />

            {bannerImage ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                <img
                  src={bannerImage}
                  alt="Course Banner"
                  className="w-16 h-12 rounded-xl object-cover border border-indigo-300 dark:border-indigo-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                    {bannerFileName || "صورة غلاف المادة"}
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                    تم اختيار الغلاف من جهازك
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تغيير</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerImage("");
                      setBannerFileName("");
                      if (bannerInputRef.current) bannerInputRef.current.value = "";
                    }}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all"
                    title="إزالة الغلاف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => bannerInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsBannerDragging(true);
                }}
                onDragLeave={() => setIsBannerDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsBannerDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleBannerFile(file);
                }}
                className={`border-2 border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition-all ${
                  isBannerDragging
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 hover:border-indigo-400"
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-bold">رفع غلاف المادة من جهازك (تصفح / سحب)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  انقر لاختيار صورة (أو اتركها فارغة لتوليد غلاف كودي هندسي تلقائي)
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? "حفظ التعديلات" : "إنشاء المقرر الآن"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
