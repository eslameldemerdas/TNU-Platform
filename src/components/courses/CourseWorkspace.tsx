import React, { useState } from 'react';
import { Course, StudyFile, DiscussionThread, Comment } from '../../types';
import { CourseCoverImage } from '../common/CourseCoverImage';
import {
  BookOpen,
  FileText,
  MessageSquare,
  Upload,
  Download,
  Star,
  CheckCircle2,
  Calendar,
  User,
  Mail,
  Search,
  Plus,
  ArrowLeft,
  Filter,
  Eye,
  Bot,
  FileCode,
  FolderOpen,
  HelpCircle,
  ShieldCheck,
  Award,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { ScrollableTabs, ScrollableTabItem } from '../common/ScrollableTabs';
import { EmptyState } from '../common/EmptyState';

export type CourseSubTab =
  | 'overview'
  | 'lectures'
  | 'sections_labs'
  | 'assignments'
  | 'files'
  | 'summaries_questions'
  | 'exams'
  | 'discussions';

interface CourseWorkspaceProps {
  course: Course;
  files: StudyFile[];
  discussions: DiscussionThread[];
  comments: Comment[];
  userRole?: string;
  onBack: () => void;
  onOpenFile: (fileId: string) => void;
  onUploadFile: (courseId: string) => void;
  onVoteResource?: (fileId: string, voteType: 'helpful' | 'not_helpful') => void;
  onNewDiscussion: (courseId: string, title: string, content: string) => void;
  onUpvoteDiscussion: (discId: string) => void;
  onAddComment: (discId: string, content: string) => void;
  onAskAIForCourse: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export const CourseWorkspace: React.FC<CourseWorkspaceProps> = ({
  course,
  files,
  discussions,
  comments,
  userRole,
  onBack,
  onOpenFile,
  onUploadFile,
  onVoteResource,
  onNewDiscussion,
  onUpvoteDiscussion,
  onAddComment,
  onAskAIForCourse,
  onEditCourse,
  onDeleteCourse
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CourseSubTab>('overview');
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [selectedFileCategory, setSelectedFileCategory] = useState<string>('all');
  const [selectedVerificationFilter, setSelectedVerificationFilter] = useState<string>('all');

  // Discussion state
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [discTitle, setDiscTitle] = useState('');
  const [discContent, setDiscContent] = useState('');
  const [activeDiscId, setActiveDiscId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const courseFiles = files.filter((f) => f.courseId === course.id);
  const courseDiscussions = discussions.filter((d) => d.courseId === course.id);

  const subTabItems: ScrollableTabItem[] = [
    { id: 'overview', label: 'نظرة عامة', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'lectures', label: 'المحاضرات والسلايدات', icon: <FileText className="w-4 h-4" />, badge: courseFiles.filter(f => f.category === 'lecture_notes' || f.category === 'notes').length || undefined },
    { id: 'sections_labs', label: 'السكاشن والتطبيقات', icon: <FileCode className="w-4 h-4" />, badge: courseFiles.filter(f => f.category === 'lab_manual' || f.category === 'lab_material').length || undefined },
    { id: 'assignments', label: 'التكليفات والواجبات', icon: <Calendar className="w-4 h-4" />, badge: courseFiles.filter(f => f.category === 'assignment').length || undefined },
    { id: 'files', label: 'بنك الملفات والمصادر', icon: <FolderOpen className="w-4 h-4" />, badge: courseFiles.length || undefined },
    { id: 'summaries_questions', label: 'الملخصات والقوانين', icon: <Star className="w-4 h-4" />, badge: courseFiles.filter(f => f.category === 'summary' || f.category === 'cheat_sheet' || f.category === 'study_guide').length || undefined },
    { id: 'exams', label: 'الامتحانات السابقة', icon: <CheckCircle2 className="w-4 h-4" />, badge: courseFiles.filter(f => f.category === 'previous_exam').length || undefined },
    { id: 'discussions', label: 'الأسئلة والنقاشات', icon: <MessageSquare className="w-4 h-4" />, badge: courseDiscussions.length || undefined }
  ];

  const filteredFiles = courseFiles.filter((f) => {
    let matchesCategory = true;
    if (activeSubTab === 'lectures') matchesCategory = f.category === 'lecture_notes' || f.category === 'notes';
    else if (activeSubTab === 'sections_labs') matchesCategory = f.category === 'lab_manual' || f.category === 'lab_material';
    else if (activeSubTab === 'assignments') matchesCategory = f.category === 'assignment';
    else if (activeSubTab === 'summaries_questions') matchesCategory = f.category === 'summary' || f.category === 'cheat_sheet' || f.category === 'study_guide';
    else if (activeSubTab === 'exams') matchesCategory = f.category === 'previous_exam';
    else if (selectedFileCategory !== 'all') matchesCategory = f.category === selectedFileCategory;

    let matchesVerification = true;
    if (selectedVerificationFilter !== 'all') {
      matchesVerification = f.verificationStatus === selectedVerificationFilter;
    }

    const matchesSearch =
      f.title.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
      (f.tags || []).some((t) => t.toLowerCase().includes(fileSearchQuery.toLowerCase()));
    return matchesCategory && matchesVerification && matchesSearch;
  });

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      summary: 'ملخص وقوانين',
      previous_exam: 'امتحان سابق',
      cheat_sheet: 'ورقة مراجعة',
      study_guide: 'دليل دراسي',
      lab_material: 'دليل معمل',
      lab_manual: 'تطبيق معملي',
      practice_material: 'بنك أسئلة',
      notes: 'تفريغ محاضرات',
      lecture_notes: 'سلايدات محاضرة',
      reference_book: 'مرجع كتاب PDF',
      reference: 'مرجع أكاديمي',
      assignment: 'واجب وتكليف'
    };
    return map[cat] || cat;
  };

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discTitle.trim() || !discContent.trim()) return;
    onNewDiscussion(course.id, discTitle, discContent);
    setDiscTitle('');
    setDiscContent('');
    setShowNewDiscussionModal(false);
  };

  const handleSendReply = (discId: string) => {
    if (!replyInput.trim()) return;
    onAddComment(discId, replyInput);
    setReplyInput('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation & Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none p-1 rounded-lg min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>العودة لقائمة المقررات والمواد</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-course-ai-assistant"
            onClick={() => onAskAIForCourse(course)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none min-h-[44px]"
          >
            <Bot className="w-3.5 h-3.5 text-amber-200" />
            <span>المساعد الأكاديمي للمقرر</span>
          </button>
          {userRole !== 'student' ? (
            <>
              {onEditCourse && (
                <button
                  id="btn-course-edit"
                  onClick={() => onEditCourse(course)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none min-h-[44px]"
                >
                  <span>تعديل المادة</span>
                </button>
              )}
              {onDeleteCourse && (
                <button
                  id="btn-course-delete"
                  onClick={() => onDeleteCourse(course.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none min-h-[44px]"
                >
                  <span>حذف المادة</span>
                </button>
              )}
              <button
                id="btn-course-upload-admin"
                onClick={() => onUploadFile(course.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:outline-none min-h-[44px]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع ملف للمقرر</span>
              </button>
            </>
          ) : (
            // For students: Only allow uploading summaries & rules
            (activeSubTab === 'summaries_questions' || activeSubTab === 'overview' || activeSubTab === 'files') ? (
              <button
                id="btn-course-upload-student-summary"
                onClick={() => onUploadFile(course.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:outline-none min-h-[44px]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>مساهمة بملخص وقوانين (+15 نقطة)</span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span>رفع المحاضرات والتكليفات مخصص للهيئة التدريسية</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Course Banner Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-6 lg:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-30">
          <CourseCoverImage
            code={course.code}
            title={course.title}
            bannerImage={course.bannerImage}
            className="w-full h-full object-cover"
            eager
          />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="dir-ltr text-xs font-black px-3 py-1 rounded-full bg-indigo-500 text-white uppercase tracking-wider">
              {course.code}
            </span>
            <span className="text-xs text-slate-300 font-semibold">• {course.level}</span>
            <span className="text-xs text-slate-300 font-semibold">• {course.credits} ساعات معتمدة</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">{course.title}</h1>
          <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">{course.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>أستاذ المقرر: <strong className="text-white">{course.instructor}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{course.scheduleDayTime} ({course.location})</span>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY CONTEXT BAR (Part 3) */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl py-3 px-3 sm:px-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="dir-ltr text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {course.code}
            </span>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-xs">
              {course.title}
            </h2>
          </div>
        </div>

        <ScrollableTabs
          tabs={subTabItems}
          activeTab={activeSubTab}
          onTabChange={(tabId) => setActiveSubTab(tabId as CourseSubTab)}
          variant="segmented"
          ariaLabel="أقسام المادة الدراسية"
        />
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Syllabus */}
            <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                مفردات ومواضيع الخطة الدراسية
              </h3>
              <div className="space-y-2.5">
                {(course.syllabus || []).map((topic, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs border border-slate-100 dark:border-slate-850">
                    <span className="w-6 h-6 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                المتطلبات السابقة للمقرر
              </h3>
              <div className="flex flex-wrap gap-2">
                {(course.prerequisites || []).map((pre, i) => (
                  <span
                    key={i}
                    className="dir-ltr px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    {pre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Grading Scheme */}
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                توزيع درجات وتقييم المادة
              </h3>
              <div className="space-y-3">
                {(course.gradingScheme || []).map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{item.weight}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                        style={{ width: `${item.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Contact */}
            <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                معلومات التواصل ودعم المقرر
              </h3>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">{course.instructor}</p>
                <a
                  href={`mailto:${course.instructorEmail}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{course.instructorEmail}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FILE REPOSITORIES & LECTURES / EXAMS TABS */}
      {(activeSubTab === 'files' ||
        activeSubTab === 'lectures' ||
        activeSubTab === 'sections_labs' ||
        activeSubTab === 'assignments' ||
        activeSubTab === 'summaries_questions' ||
        activeSubTab === 'exams') && (
        <div className="space-y-4">
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="بحث في المراجع، الامتحانات والملخصات..."
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedVerificationFilter}
                onChange={(e) => setSelectedVerificationFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">كل حالات التوثيق</option>
                <option value="official">🏛️ رسمي معتمد من الكلية</option>
                <option value="verified">⭐ مرجع موثق وموصى به</option>
                <option value="student_uploaded">👥 مساهمات طلابية</option>
              </select>

              {activeSubTab === 'files' && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedFileCategory}
                    onChange={(e) => setSelectedFileCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">جميع الأنواع والأقسام</option>
                    <option value="summary">ملخصات وقوانين</option>
                    <option value="previous_exam">امتحانات سابقة ومحلولة</option>
                    <option value="cheat_sheet">أوراق مراجعة (Cheat Sheet)</option>
                    <option value="study_guide">أدلة دراسية (Study Guide)</option>
                    <option value="notes">ملاحظات وتفريغ المحاضرات</option>
                    <option value="lecture_notes">سلايدات وملاحظات المحاضرات</option>
                    <option value="lab_manual">دليل وسكاشن المعمل والبرمجة</option>
                    <option value="lab_material">دليل المعمل والتجارب</option>
                    <option value="practice_material">بنك أسئلة وتدريبات</option>
                    <option value="reference_book">كتب ومراجع PDF</option>
                    <option value="assignment">حلول التكليفات والواجبات</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Files Grid & Unified Empty State (Part 7) */}
          {filteredFiles.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={
                activeSubTab === 'summaries_questions'
                  ? 'لا توجد ملخصات أو أوراق قوانين بعد'
                  : activeSubTab === 'lectures'
                  ? 'لا توجد محاضرات أو سلايدات مرفوعة بعد'
                  : activeSubTab === 'sections_labs'
                  ? 'لا توجد مذكرات أو تجارب معملية بعد'
                  : activeSubTab === 'assignments'
                  ? 'لا توجد تكليفات أو واجبات مرفوعة بعد'
                  : 'لا توجد ملفات أو مراجع مطابقة'
              }
              description={
                activeSubTab === 'summaries_questions'
                  ? 'كن أول من يشارك زملاءه بملخص مكثف أو ورقة قوانين واكتسب +15 نقطة فور الاعتماد من المشرفين!'
                  : activeSubTab === 'lectures'
                  ? 'يتم رفع وتوثيق المحاضرات وسلايدات الشرح حصرياً بواسطة أستاذ المقرر والمعيدين المشرفين.'
                  : activeSubTab === 'sections_labs'
                  ? 'تجارب وسكاشن المعمل يتم توفيرها واعتمادها من قبل الهيئة المعاونة والمشرفين.'
                  : activeSubTab === 'assignments'
                  ? 'التكليفات والواجبات الرسمية تُطرح وتُعتمد بواسطة أساتذة ومساعدي المادة.'
                  : 'لا توجد ملفات مطابقة لخيارات البحث الحالية.'
              }
              actionLabel={
                userRole === 'student'
                  ? (activeSubTab === 'summaries_questions' || activeSubTab === 'files'
                      ? 'مساهمة بملخص وقوانين (+15 نقطة)'
                      : undefined)
                  : 'رفع وتوثيق ملف للمقرر'
              }
              onAction={
                userRole === 'student'
                  ? (activeSubTab === 'summaries_questions' || activeSubTab === 'files'
                      ? () => onUploadFile(course.id)
                      : undefined)
                  : () => onUploadFile(course.id)
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFiles.map((file) => {
                const isOfficial = file.verificationStatus === 'official';
                const isVerified = file.verificationStatus === 'verified';
                const isPending = file.moderationStatus === 'pending' || file.status === 'pending';
                const isRejected = file.moderationStatus === 'rejected' || file.status === 'rejected';

                return (
                  <div
                    key={file.id}
                    id={`file-card-${file.id}`}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-500/50 hover:shadow-md shadow-sm transition-all space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xs uppercase shrink-0 border border-orange-500/20 shadow-inner">
                            {file.fileType}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {getCategoryLabel(file.category)}
                              </span>

                              {isOfficial && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>رسمي معتمد</span>
                                </span>
                              )}

                              {isVerified && !isOfficial && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-500" />
                                  <span>مرجع موثق</span>
                                </span>
                              )}

                              {isPending && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>قيد التدقيق</span>
                                </span>
                              )}

                              {isRejected && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>مرفوض</span>
                                </span>
                              )}
                            </div>

                            <h4
                              onClick={() => onOpenFile(file.id)}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors cursor-pointer line-clamp-1"
                            >
                              {file.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{file.rating || 5.0}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{file.description}</p>

                      {isRejected && file.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300">
                          <strong>سبب الرفض:</strong> {file.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 gap-2">
                      <span className="text-[11px]">بواسطة: <strong>{file.uploaderName}</strong></span>
                      <div className="flex items-center gap-2.5">
                        {onVoteResource && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onVoteResource(file.id, 'helpful');
                              }}
                              title="مفيد جداً"
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all min-h-[32px] ${
                                file.userVote === 'helpful'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{file.helpfulCount || 0}</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onVoteResource(file.id, 'not_helpful');
                              }}
                              title="غير مفيد"
                              className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs transition-all min-h-[32px] ${
                                file.userVote === 'not_helpful'
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <span className="flex items-center gap-1 text-[11px]">
                          <Download className="w-3.5 h-3.5" />
                          {file.downloadCount || 0}
                        </span>

                        <button
                          id={`btn-open-file-${file.id}`}
                          onClick={() => onOpenFile(file.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 hover:from-orange-500/25 hover:to-amber-500/25 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-xs font-bold transition-all border border-orange-500/20 shadow-xs flex items-center gap-1.5 min-h-[36px] active:scale-95"
                        >
                          <span>معاينة وتنزيل</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. DISCUSSIONS & Q&A TAB */}
      {activeSubTab === 'discussions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              أسئلة واستفسارات المقرر ({courseDiscussions.length})
            </h3>
            <button
              onClick={() => setShowNewDiscussionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>طرح سؤال جديد</span>
            </button>
          </div>

          {showNewDiscussionModal && (
            <form
              onSubmit={handleCreateDiscussion}
              className="p-5 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-3.5"
            >
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">طرح سؤال أو استفسار في مقرر {course.code}</h4>
              <input
                type="text"
                placeholder="عنوان السؤال (مثال: طريقة حل المسألة رقم 3 في الشيت؟)"
                required
                value={discTitle}
                onChange={(e) => setDiscTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="اكتب تفاصيل السؤال أو أرفق الجزء البرمجي/المعادلة..."
                rows={3}
                required
                value={discContent}
                onChange={(e) => setDiscContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewDiscussionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  نشر السؤال (+10 نقاط)
                </button>
              </div>
            </form>
          )}

          {courseDiscussions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="لا توجد استفسارات أو أسئلة مطروحة بعد"
              description="كن أول من يطرح سؤالاً أو يفتح نقاشاً أكاديمياً مع زملائك والأساتذة حول موضوعات المقرر."
              actionLabel="طرح أول سؤال"
              onAction={() => setShowNewDiscussionModal(true)}
            />
          ) : (
            <div className="space-y-3">
              {courseDiscussions.map((disc) => {
                const discComments = comments.filter((c) => c.targetId === disc.id);
                const isExpanded = activeDiscId === disc.id;

                return (
                  <div
                    key={disc.id}
                    className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {disc.isSolved && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> تم الحل
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{disc.authorName}</span>
                          <span className="text-[10px] text-slate-400">• {disc.authorDepartment}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{disc.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{disc.content}</p>
                      </div>

                      <button
                        onClick={() => onUpvoteDiscussion(disc.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all shrink-0 min-h-[44px] min-w-[44px] ${
                          disc.hasUpvoted
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/30'
                        }`}
                      >
                        <span>▲</span>
                        <span>{disc.upvotes}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                      <button
                        onClick={() => setActiveDiscId(isExpanded ? null : disc.id)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        {isExpanded ? 'إخفاء الردود' : `عرض الردود (${discComments.length})`}
                      </button>
                      <span className="text-[10px]">{disc.createdAt}</span>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 space-y-3 border-t border-slate-100 dark:border-slate-800">
                        {discComments.map((cmt) => (
                          <div key={cmt.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{cmt.authorName}</span>
                              <span className="text-[10px] text-slate-400">{cmt.createdAt}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">{cmt.content}</p>
                          </div>
                        ))}

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="أضف رداً أكاديمياً..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendReply(disc.id);
                            }}
                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleSendReply(disc.id)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                          >
                            إرسال
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
