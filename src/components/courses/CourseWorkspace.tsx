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
  Plus,
  ArrowLeft,
  Filter,
  Bot,
  FileCode,
  FolderOpen,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import React, { useState } from "react";
import { Course, StudyFile, DiscussionThread, Comment } from "../../types";
import { CourseCoverImage } from "../common/CourseCoverImage";
import { EmptyState } from "../common/EmptyState";
import { ScrollableTabs, ScrollableTabItem } from "../common/ScrollableTabs";
import {
  Card,
  Button,
  Badge,
  SearchField,
  Select,
  Avatar,
  Skeleton,
  CardSkeleton,
} from "../ui";

export type CourseSubTab =
  | "overview"
  | "lectures"
  | "sections_labs"
  | "assignments"
  | "files"
  | "summaries_questions"
  | "exams"
  | "discussions";

interface CourseWorkspaceProps {
  course: Course;
  files: StudyFile[];
  discussions: DiscussionThread[];
  comments: Comment[];
  userRole?: string;
  onBack: () => void;
  onOpenFile: (fileId: string) => void;
  onUploadFile: (courseId: string) => void;
  onVoteResource?: (fileId: string, voteType: "helpful" | "not_helpful") => void;
  onNewDiscussion: (courseId: string, title: string, content: string) => void;
  onUpvoteDiscussion: (discId: string) => void;
  onAddComment: (discId: string, content: string) => void;
  onAskAIForCourse: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  isLoading?: boolean;
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
  onDeleteCourse,
  isLoading = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CourseSubTab>("overview");
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [selectedFileCategory, setSelectedFileCategory] = useState<string>("all");
  const [selectedVerificationFilter, setSelectedVerificationFilter] = useState<string>("all");

  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [discTitle, setDiscTitle] = useState("");
  const [discContent, setDiscContent] = useState("");
  const [activeDiscId, setActiveDiscId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");

  const courseFiles = files.filter((f) => f.courseId === course.id);
  const courseDiscussions = discussions.filter((d) => d.courseId === course.id);

  const subTabItems: ScrollableTabItem[] = [
    { id: "overview", label: "نظرة عامة", icon: <BookOpen className="w-4 h-4" /> },
    {
      id: "lectures",
      label: "المحاضرات والسلايدات",
      icon: <FileText className="w-4 h-4" />,
      badge:
        courseFiles.filter((f) => f.category === "lecture_notes" || f.category === "notes")
          .length || undefined,
    },
    {
      id: "sections_labs",
      label: "السكاشن والتطبيقات",
      icon: <FileCode className="w-4 h-4" />,
      badge:
        courseFiles.filter((f) => f.category === "lab_manual" || f.category === "lab_material")
          .length || undefined,
    },
    {
      id: "assignments",
      label: "التكليفات والواجبات",
      icon: <Calendar className="w-4 h-4" />,
      badge: courseFiles.filter((f) => f.category === "assignment").length || undefined,
    },
    {
      id: "files",
      label: "بنك الملفات والمصادر",
      icon: <FolderOpen className="w-4 h-4" />,
      badge: courseFiles.length || undefined,
    },
    {
      id: "summaries_questions",
      label: "الملخصات والقوانين",
      icon: <Star className="w-4 h-4" />,
      badge:
        courseFiles.filter(
          (f) =>
            f.category === "summary" ||
            f.category === "cheat_sheet" ||
            f.category === "study_guide",
        ).length || undefined,
    },
    {
      id: "exams",
      label: "الامتحانات السابقة",
      icon: <CheckCircle2 className="w-4 h-4" />,
      badge: courseFiles.filter((f) => f.category === "previous_exam").length || undefined,
    },
    {
      id: "discussions",
      label: "الأسئلة والنقاشات",
      icon: <MessageSquare className="w-4 h-4" />,
      badge: courseDiscussions.length || undefined,
    },
  ];

  const filteredFiles = courseFiles.filter((f) => {
    let matchesCategory = true;
    if (activeSubTab === "lectures")
      matchesCategory = f.category === "lecture_notes" || f.category === "notes";
    else if (activeSubTab === "sections_labs")
      matchesCategory = f.category === "lab_manual" || f.category === "lab_material";
    else if (activeSubTab === "assignments") matchesCategory = f.category === "assignment";
    else if (activeSubTab === "summaries_questions")
      matchesCategory =
        f.category === "summary" || f.category === "cheat_sheet" || f.category === "study_guide";
    else if (activeSubTab === "exams") matchesCategory = f.category === "previous_exam";
    else if (selectedFileCategory !== "all") matchesCategory = f.category === selectedFileCategory;

    let matchesVerification = true;
    if (selectedVerificationFilter !== "all") {
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
      summary: "ملخص وقوانين",
      previous_exam: "امتحان سابق",
      cheat_sheet: "ورقة مراجعة",
      study_guide: "دليل دراسي",
      lab_material: "دليل معمل",
      lab_manual: "تطبيق معملي",
      practice_material: "بنك أسئلة",
      notes: "تفريغ محاضرات",
      lecture_notes: "سلايدات محاضرة",
      reference_book: "مرجع كتاب PDF",
      reference: "مرجع أكاديمي",
      assignment: "واجب وتكليف",
    };
    return map[cat] || cat;
  };

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discTitle.trim() || !discContent.trim()) return;
    onNewDiscussion(course.id, discTitle, discContent);
    setDiscTitle("");
    setDiscContent("");
    setShowNewDiscussionModal(false);
  };

  const handleSendReply = (discId: string) => {
    if (!replyInput.trim()) return;
    onAddComment(discId, replyInput);
    setReplyInput("");
  };

  const getFileVerificationBadge = (file: StudyFile) => {
    const isOfficial = file.verificationStatus === "official";
    const isVerified = file.verificationStatus === "verified";
    const isPending = file.moderationStatus === "pending" || file.status === "pending";
    const isRejected = file.moderationStatus === "rejected" || file.status === "rejected";

    if (isOfficial)
      return (
        <Badge variant="info" size="sm" dot>
          رسمي معتمد
        </Badge>
      );
    if (isVerified)
      return (
        <Badge variant="warning" size="sm" dot>
          مرجع موثق
        </Badge>
      );
    if (isPending)
      return (
        <Badge variant="neutral" size="sm" dot>
          قيد التدقيق
        </Badge>
      );
    if (isRejected)
      return (
        <Badge variant="error" size="sm" dot>
          مرفوض
        </Badge>
      );
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <Card padding="lg" className="space-y-4">
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
          <div className="flex gap-3 pt-2">
            <Skeleton width={120} height={40} />
            <Skeleton width={140} height={40} />
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} showImage />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation & Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
        >
          العودة لقائمة المقررات
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="attention"
            size="sm"
            onClick={() => onAskAIForCourse(course)}
            leftIcon={<Bot className="w-3.5 h-3.5 text-slate-950" />}
          >
            المساعد الأكاديمي للمقرر
          </Button>
          {userRole !== "student" ? (
            <>
              {onEditCourse && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditCourse(course)}
                >
                  تعديل المادة
                </Button>
              )}
              {onDeleteCourse && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDeleteCourse(course.id)}
                >
                  حذف المادة
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => onUploadFile(course.id)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                رفع ملف للمقرر
              </Button>
            </>
          ) : activeSubTab === "summaries_questions" ||
            activeSubTab === "overview" ||
            activeSubTab === "files" ? (
            <Button
              variant="attention"
              size="sm"
              onClick={() => onUploadFile(course.id)}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              مساهمة بملخص وقوانين (+15 نقطة)
            </Button>
          ) : (
            <Badge variant="neutral" size="sm">
              رفع المحاضرات والتكليفات مخصص للهيئة التدريسية
            </Badge>
          )}
        </div>
      </div>

      {/* Course Header */}
      <Card padding="none" className="overflow-hidden">
        <div className="relative h-40 sm:h-48 overflow-hidden bg-slate-900">
          <CourseCoverImage
            code={course.code}
            title={course.title}
            bannerImage={course.bannerImage}
            className="w-full h-full object-cover"
            eager
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-4 sm:p-6 flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="course-code text-xs font-black px-3 py-1 rounded-full bg-indigo-500 text-white uppercase tracking-wider font-mono">
                {course.code}
              </span>
              <Badge variant="neutral" size="sm">
                {course.level}
              </Badge>
              <Badge variant="neutral" size="sm">
                {course.credits} ساعات معتمدة
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  أستاذ المقرر: <strong className="text-white">{course.instructor}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {course.scheduleDayTime} ({course.location})
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sticky Context Bar */}
      <div className="sticky top-[var(--z-sticky)] z-[var(--z-sticky)] bg-ehb-surface-elevated/95 backdrop-blur-xl py-3 px-3 sm:px-4 rounded-ehb-md border border-ehb-default shadow-ehb-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="course-code text-xs font-black px-2 py-0.5 rounded-ehb-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {course.code}
            </span>
            <h2 className="text-xs font-bold text-ehb-text-primary hidden sm:inline truncate max-w-xs">
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
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Syllabus */}
            <Card padding="lg" className="space-y-4">
              <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                مفردات ومواضيع الخطة الدراسية
              </h3>
              <div className="space-y-2.5">
                {(course.syllabus || []).map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-ehb-md bg-ehb-surface border border-ehb-subtle text-xs"
                  >
                    <span className="w-6 h-6 rounded-ehb-md bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-ehb-text-primary font-medium leading-relaxed">
                      {topic}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Prerequisites */}
            <Card padding="lg" className="space-y-3">
              <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                المتطلبات السابقة للمقرر
              </h3>
              <div className="flex flex-wrap gap-2">
                {(course.prerequisites || []).map((pre, i) => (
                  <Badge key={i} variant="neutral" size="md">
                    {pre}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Col: Grading Scheme */}
          <div className="space-y-6">
            <Card padding="lg" className="space-y-4">
              <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                توزيع درجات وتقييم المادة
              </h3>
              <div className="space-y-3">
                {(course.gradingScheme || []).map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-ehb-text-primary">{item.category}</span>
                      <span className="text-indigo-400">{item.weight}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-ehb-surface-elevated-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${item.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Instructor Contact */}
            <Card padding="lg" className="space-y-3">
              <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
                معلومات التواصل ودعم المقرر
              </h3>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-ehb-text-primary">{course.instructor}</p>
                <a
                  href={`mailto:${course.instructorEmail}`}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{course.instructorEmail}</span>
                </a>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. FILE REPOSITORIES & LECTURES / EXAMS TABS */}
      {(activeSubTab === "files" ||
        activeSubTab === "lectures" ||
        activeSubTab === "sections_labs" ||
        activeSubTab === "assignments" ||
        activeSubTab === "summaries_questions" ||
        activeSubTab === "exams") && (
        <div className="space-y-4">
          {/* Controls: Search & Category Filter */}
          <Card padding="md" className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1">
                <SearchField
                  value={fileSearchQuery}
                  onChange={(e) => setFileSearchQuery(e.target.value)}
                  placeholder="بحث في المراجع، الامتحانات والملخصات..."
                  size="sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedVerificationFilter}
                  onChange={(e) => setSelectedVerificationFilter(e.target.value)}
                  size="sm"
                  className="w-full md:w-auto"
                >
                  <option value="all">كل حالات التوثيق</option>
                  <option value="official">🏛️ رسمي معتمد من الكلية</option>
                  <option value="verified">⭐ مرجع موثق وموصى به</option>
                  <option value="student_uploaded">👥 مساهمات طلابية</option>
                </Select>

                {activeSubTab === "files" && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-ehb-text-muted shrink-0" />
                    <Select
                      value={selectedFileCategory}
                      onChange={(e) => setSelectedFileCategory(e.target.value)}
                      size="sm"
                      className="w-full md:w-auto"
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
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Files Grid & Unified Empty State */}
          {filteredFiles.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={FolderOpen}
                title={
                  activeSubTab === "summaries_questions"
                    ? "لا توجد ملخصات أو أوراق قوانين بعد"
                    : activeSubTab === "lectures"
                      ? "لا توجد محاضرات أو سلايدات مرفوعة بعد"
                      : activeSubTab === "sections_labs"
                        ? "لا توجد مذكرات أو تجارب معملية بعد"
                        : activeSubTab === "assignments"
                          ? "لا توجد تكليفات أو واجبات مرفوعة بعد"
                          : "لا توجد ملفات أو مراجع مطابقة"
                }
                description={
                  activeSubTab === "summaries_questions"
                    ? "كن أول من يشارك زملاءه بملخص مكثف أو ورقة قوانين واكتسب +15 نقطة فور الاعتماد من المشرفين!"
                    : activeSubTab === "lectures"
                      ? "يتم رفع وتوثيق المحاضرات وسلايدات الشرح حصرياً بواسطة أستاذ المقرر والمعيدين المشرفين."
                      : activeSubTab === "sections_labs"
                        ? "تجارب وسكاشن المعمل يتم توفيرها واعتمادها من قبل الهيئة المعاونة والمشرفين."
                        : activeSubTab === "assignments"
                          ? "التكليفات والواجبات الرسمية تُطرح وتُعتمد بواسطة أساتذة ومساعدي المادة."
                          : "لا توجد ملفات مطابقة لخيارات البحث الحالية."
                }
                actionLabel={
                  userRole === "student"
                    ? activeSubTab === "summaries_questions" || activeSubTab === "files"
                      ? "مساهمة بملخص وقوانين (+15 نقطة)"
                      : undefined
                    : "رفع وتوثيق ملف للمقرر"
                }
                onAction={
                  userRole === "student"
                    ? activeSubTab === "summaries_questions" || activeSubTab === "files"
                      ? () => onUploadFile(course.id)
                      : undefined
                    : () => onUploadFile(course.id)
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFiles.map((file) => {
                const isRejected =
                  file.moderationStatus === "rejected" || file.status === "rejected";

                return (
                  <Card
                    key={file.id}
                    id={`file-card-${file.id}`}
                    variant="interactive"
                    padding="md"
                    className="space-y-3"
                    onClick={() => onOpenFile(file.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-ehb-md bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-black text-xs uppercase shrink-0">
                          {file.fileType}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="neutral" size="sm">
                              {getCategoryLabel(file.category)}
                            </Badge>

                            {getFileVerificationBadge(file)}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-ehb-text-primary group-hover:text-amber-400 transition-colors line-clamp-1">
                            {file.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{file.rating || 5.0}</span>
                      </div>
                    </div>

                    <p className="text-xs text-ehb-text-muted line-clamp-2 leading-relaxed">
                      {file.description}
                    </p>

                    {isRejected && file.rejectionReason && (
                      <div className="p-2.5 rounded-ehb-md bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400">
                        <strong>سبب الرفض:</strong> {file.rejectionReason}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-ehb-subtle text-xs text-ehb-text-muted gap-2">
                      <span className="text-[11px]">
                        بواسطة: <strong className="text-ehb-text-primary">{file.uploaderName}</strong>
                      </span>
                      <div className="flex items-center gap-2.5">
                        {onVoteResource && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onVoteResource(file.id, "helpful");
                              }}
                              title="مفيد جداً"
                              className={`flex items-center gap-1 px-2 py-1 rounded-ehb-md text-xs font-semibold transition-all min-h-[32px] ${
                                file.userVote === "helpful"
                                  ? "bg-emerald-500/20 text-emerald-400 font-bold"
                                  : "hover:bg-ehb-surface-elevated-2 text-ehb-text-muted"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{file.helpfulCount || 0}</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onVoteResource(file.id, "not_helpful");
                              }}
                              title="غير مفيد"
                              className={`flex items-center gap-1 px-1.5 py-1 rounded-ehb-md text-xs transition-all min-h-[32px] ${
                                file.userVote === "not_helpful"
                                  ? "bg-rose-500/20 text-rose-400 font-bold"
                                  : "hover:bg-ehb-surface-elevated-2 text-ehb-text-muted"
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <span className="flex items-center gap-1 text-[11px]">
                          <Download className="w-3.5 h-3.5" />
                          {file.downloadCount || 0}
                        </span>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFile(file.id);
                          }}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          <span className="hidden sm:inline">معاينة وتنزيل</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. DISCUSSIONS & Q&A TAB */}
      {activeSubTab === "discussions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ehb-text-primary uppercase tracking-wider">
              أسئلة واستفسارات المقرر ({courseDiscussions.length})
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewDiscussionModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              طرح سؤال جديد
            </Button>
          </div>

          {showNewDiscussionModal && (
            <Card padding="lg" className="space-y-3.5 border-indigo-500/30 bg-indigo-500/5">
              <h4 className="text-xs font-bold text-indigo-400">
                طرح سؤال أو استفسار في مقرر{" "}
                <span className="course-code" dir="ltr">
                  {course.code}
                </span>
              </h4>
              <form onSubmit={handleCreateDiscussion} className="space-y-3">
                <input
                  type="text"
                  placeholder="عنوان السؤال (مثال: طريقة حل المسألة رقم 3 في الشيت؟)"
                  required
                  value={discTitle}
                  onChange={(e) => setDiscTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <textarea
                  placeholder="اكتب تفاصيل السؤال أو أرفق الجزء البرمجي/المعادلة..."
                  rows={3}
                  required
                  value={discContent}
                  onChange={(e) => setDiscContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewDiscussionModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    نشر السؤال (+10 نقاط)
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {courseDiscussions.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={HelpCircle}
                title="لا توجد استفسارات أو أسئلة مطروحة بعد"
                description="كن أول من يطرح سؤالاً أو يفتح نقاشاً أكاديمياً مع زملائك والأساتذة حول موضوعات المقرر."
                actionLabel="طرح أول سؤال"
                onAction={() => setShowNewDiscussionModal(true)}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {courseDiscussions.map((disc) => {
                const discComments = comments.filter((c) => c.targetId === disc.id);
                const isExpanded = activeDiscId === disc.id;

                return (
                  <Card
                    key={disc.id}
                    padding="lg"
                    className="space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={disc.authorAvatar}
                          alt={disc.authorName}
                          size="md"
                          fallback={disc.authorName?.[0] || "?"}
                        />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-ehb-text-primary">
                              {disc.authorName}
                            </span>
                            {disc.isSolved && (
                              <Badge variant="success" size="sm" dot>
                                تم الحل
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-ehb-text-muted">
                            {disc.authorDepartment}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onUpvoteDiscussion(disc.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-ehb-md border text-xs font-bold transition-all shrink-0 min-h-[44px] min-w-[44px] ${
                          disc.hasUpvoted
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            : "border-ehb-default text-ehb-text-muted hover:border-indigo-500/30"
                        }`}
                        aria-label="تأييد المنشور"
                      >
                        <span>▲</span>
                        <span>{disc.upvotes}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-ehb-text-primary">
                        {disc.title}
                      </h4>
                      <p className="text-xs text-ehb-text-muted whitespace-pre-wrap leading-relaxed">
                        {disc.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-ehb-subtle text-xs">
                      <button
                        onClick={() => setActiveDiscId(isExpanded ? null : disc.id)}
                        className="text-indigo-400 font-bold hover:underline"
                      >
                        {isExpanded
                          ? "إخفاء الردود"
                          : `عرض الردود (${discComments.length})`}
                      </button>
                      <span className="text-[10px] text-ehb-text-muted font-mono">
                        {disc.createdAt}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 space-y-3 border-t border-ehb-subtle">
                        {discComments.map((cmt) => (
                          <div
                            key={cmt.id}
                            className={`p-3 rounded-ehb-md text-xs space-y-1 ${
                              cmt.isSolution
                                ? "bg-emerald-500/10 border border-emerald-500/30"
                                : "bg-ehb-surface border border-ehb-subtle"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-ehb-text-primary">
                                {cmt.authorName}
                              </span>
                              <span className="text-[10px] text-ehb-text-muted font-mono">
                                {cmt.createdAt}
                              </span>
                            </div>
                            <p className="text-ehb-text-muted">{cmt.content}</p>
                          </div>
                        ))}

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="أضف رداً أكاديمياً..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSendReply(disc.id);
                            }}
                            className="flex-1 px-3.5 py-2 rounded-ehb-md border border-ehb-default bg-ehb-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSendReply(disc.id)}
                          >
                            إرسال
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
