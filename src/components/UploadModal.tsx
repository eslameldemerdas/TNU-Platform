import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Course, ResourceCategory, StudyFile } from '../types';
import { X, Upload, Award, FileText, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  preselectedCourseId?: string;
  userRole?: string;
  onUploadSubmit: (fileData: Partial<StudyFile>) => Promise<void> | void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  courses,
  preselectedCourseId,
  userRole = 'student',
  onUploadSubmit
}) => {
  const isStudent = userRole === 'student';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(preselectedCourseId || courses[0]?.id || '');
  const [category, setCategory] = useState<ResourceCategory>('summary');
  const [academicYear, setAcademicYear] = useState('Year 2 (Sophomore)');
  const [semester, setSemester] = useState('Fall 2026');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'pptx' | 'zip' | 'code' | 'image'>('pdf');
  const [tagsInput, setTagsInput] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileDataBase64, setFileDataBase64] = useState<string | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    try {
      const base64 = await readFileAsBase64(file);
      setFileDataBase64(base64);
      setFileSizeBytes(file.size);
    } catch (err) {
      setSubmitError('Failed to read file. Please try again.');
    }
  };

  if (!isOpen) return null;

  const allCategories: { id: ResourceCategory; label: string; description: string }[] = [
    { id: 'summary', label: 'ملخص وقوانين مركزة (Summary & Formulas)', description: 'تلخيص شامل ومكثف للمقرر والقوانين والمعادلات' },
    { id: 'cheat_sheet', label: 'ورقة مراجعة وقوانين (Cheat Sheet)', description: 'ورقة سريعة تضم القوانين والمعادلات والرسوم البيانية' },
    { id: 'study_guide', label: 'دليل دراسي وقواعد فهم (Study Guide)', description: 'إرشادات مراجعة ومفاتيح فهم وشرح أفكار المقرر' },
    { id: 'previous_exam', label: 'امتحانات سابقة ونماذج حل (Past Exam)', description: 'ميدتيرم، فاينال، أو كويزات سابقة مع الحلول' },
    { id: 'notes', label: 'ملاحظات وتفريغ محاضرات (Lecture Notes)', description: 'تفريغ وتلخيص لشرح المحاضرات الأسبوعية' },
    { id: 'lab_material', label: 'دليل المعمل والتجارب (Lab Material)', description: 'أكواد المعمل، تقارير التجارب، وملفات المحاكاة' },
    { id: 'practice_material', label: 'بنك أسئلة وتدريبات (Practice Material)', description: 'مسائل إضافية وتمارين وتطبيقات' },
    { id: 'reference', label: 'مراجع وكتب تخصصية (Reference)', description: 'كتب ومراجع أكاديمية موثوقة' },
    { id: 'other', label: 'أخرى (Other)', description: 'أي مصادر دراسية هندسية أخرى' }
  ];

  // For students, ONLY summaries and rules are permitted across all courses
  const studentCategories: { id: ResourceCategory; label: string; description: string }[] = [
    { id: 'summary', label: 'ملخص وقوانين مركزة (Summary & Formulas)', description: 'تلخيص شامل ومكثف للمقرر والقوانين والمعادلات' },
    { id: 'cheat_sheet', label: 'ورقة مراجعة وقوانين (Cheat Sheet)', description: 'ورقة سريعة تضم القوانين والمعادلات والرسوم البيانية' },
    { id: 'study_guide', label: 'دليل دراسي وقواعد فهم (Study Guide)', description: 'إرشادات مراجعة ومفاتيح فهم وشرح أفكار المقرر' }
  ];

  const categories = isStudent ? studentCategories : allCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim() || title.trim().length < 5) {
      setSubmitError('يجب أن يكون عنوان الملف 5 أحرف على الأقل.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setSubmitError('يرجى كتابة وصف توضيحي للملف لا يقل عن 10 أحرف لتسهيل اعتماده.');
      return;
    }
    if (!courseId) {
      setSubmitError('يرجى اختيار المقرر الدراسي المناسب للملف.');
      return;
    }

    const selectedCourse = courses.find((c) => c.id === courseId);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      await onUploadSubmit({
        title: title.trim(),
        description: description.trim(),
        courseId,
        courseCode: selectedCourse?.code || 'ENG',
        category,
        fileType,
        fileName: fileName || `${title.replace(/\s+/g, '_')}.${fileType}`,
        fileSize: fileSizeBytes ? `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '3.4 MB',
        fileSizeBytes: fileSizeBytes || 3565158,
        fileData: fileDataBase64 || undefined,
        tags: tags.length ? tags : [selectedCourse?.code || 'Engineering', category],
        previewContent: previewText || `# ${title}\n\n${description}\n\n*محتوى أكاديمي مرفوع للدراسة.*`
      });

      // Reset and close
      setTitle('');
      setDescription('');
      setTagsInput('');
      setPreviewText('');
      setFileName(null);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'حدث خطأ أثناء رفع الملف، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto text-right"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isStudent ? 'مساهمة طلابية: رفع ملخص أو ورقة قوانين' : 'رفع وتوثيق ملف أكاديمي للمقرر'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isStudent
                  ? 'متاح لجميع المواد: تقتصر مشاركات الطلاب على الملخصات والقوانين وتُرسل للإشراف للاعتماد (+15 نقطة فور القبول).'
                  : 'رفع المحاضرات، السلايدات، بنوك الأسئلة، والتكليفات الرسمية المعتمدة للطلاب.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isStudent && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">ضوابط المساهمات الطلابية:</span>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                يُسمح للطلاب والمستخدمين برفع <strong>الملخصات وأوراق القوانين المركزة</strong> فقط لجميع المقررات المتاحة. يتم إرسال الملف فوراً كإشعار للمشرفين وإدارة الكلية للمراجعة والاعتماد، وتتم إضافة <strong>+15 نقطة</strong> لحسابك فور الموافقة!
              </p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-xl border-2 border-dashed text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.zip,.png,.jpg,.jpeg,.gif,.cpp,.m,.v"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {fileName ? (
                <span className="text-orange-600 dark:text-orange-400 font-bold">الملف المختار: {fileName}</span>
              ) : (
                'اسحب الملف وأسقطه هنا، أو اضغط للتصفح والاختيار من الجهاز'
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">يدعم ملفات PDF, DOCX, PPTX, ZIP, C/C++, MATLAB (حجم أقصى 25 ميجابايت)</p>
          </div>

          {/* Title & Course Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                عنوان الملف الأكاديمي *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ملخص شامل لقوانين K-Maps وتطبيقات المنطق"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اختيار المقرر الدراسي *
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & File Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نوع وتصنيف المرجع *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                صيغة وامتداد الملف *
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="pdf">مستند PDF (.pdf)</option>
                <option value="docx">مستند وورد (.docx)</option>
                <option value="pptx">عرض تقديمي (.pptx)</option>
                <option value="zip">أرشيف مضغوط (.zip)</option>
                <option value="code">ملفات برمجية ومشاريع (.cpp, .m, .v)</option>
                <option value="image">صورة / رسم تخطيطي عالي الدقة</option>
              </select>
            </div>
          </div>

          {/* Academic Year & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                السنة الأكاديمية
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Year 1 (Freshman)">الفرقة الأولى (Freshman)</option>
                <option value="Year 2 (Sophomore)">الفرقة الثانية (Sophomore)</option>
                <option value="Year 3 (Junior)">الفرقة الثالثة (Junior)</option>
                <option value="Year 4 (Senior)">الفرقة الرابعة (Senior)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الفصل الدراسي
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Fall 2026">الفصل الدراسي الأول (Fall 2026)</option>
                <option value="Spring 2027">الفصل الدراسي الثاني (Spring 2027)</option>
                <option value="Summer 2026">الفصل الصيفي (Summer 2026)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              وصف المحتوى والمواضيع المغطاة *
            </label>
            <textarea
              rows={2}
              required
              placeholder="اكتب نبذة واضحة عن الفصول أو المسائل المغطاة لتسهيل تدقيق المرجع واعتماده للطلاب..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Tags & Preview Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                وسوم ومفاتيح البحث (مفصولة بفواصل)
              </label>
              <input
                type="text"
                placeholder="ميدتيرم, محلول, قوانين, C++"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                محتوى معاينة النصوص (اختياري)
              </label>
              <input
                type="text"
                placeholder="# ملخص القوانين..."
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              نظام ضمان الجودة الأكاديمية: يتم تدقيق الملفات بواسطة مشرفي المواد قبل نشرها للعموم لضمان صحة المحتوى الهندسي.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    {isStudent
                      ? 'إرسال الملخص للإدارة والمشرفين للتدقيق (+15 نقطة)'
                      : 'نشر وتوثيق الملف الأكاديمي'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

