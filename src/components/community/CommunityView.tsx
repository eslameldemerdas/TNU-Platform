import {
  MessageSquare,
  Search,
  Plus,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  FileQuestion,
  Wrench,
  ThumbsUp,
  Share2,
  ChevronDown,
  ChevronUp,
  Send,
  Pin,
  ShieldCheck,
  Check,
  Tag,
  CheckCheck,
  GraduationCap,
  BookOpen,
  Trophy,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { ENGHUB_TOKENS as _ENGHUB_TOKENS } from "../../theme/tokens";
import {
  DiscussionThread,
  Comment,
  PointsLedgerEntry,
  UserProfile,
  Department,
  Course,
  PostCategoryType,
} from "../../types";
import { ScrollableTabs, ScrollableTabItem } from "../common/ScrollableTabs";
import { HonorBoardView } from "./HonorBoardView";

interface CommunityViewProps {
  discussions: DiscussionThread[];
  comments: Comment[];
  ledger: PointsLedgerEntry[];
  user: UserProfile | null;
  departments: Department[];
  courses?: Course[];
  onUpvoteDiscussion: (discId: string) => void;
  onNewDiscussion: (courseId: string, title: string, content: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  discussions: initialDiscussions,
  comments: initialComments,
  _ledger,
  user,
  departments,
  courses = [],
  onUpvoteDiscussion,
  onNewDiscussion,
}) => {
  const [activeTab, setActiveTab] = useState<"posts" | "leaderboard">("posts");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "solved" | "unsolved">("all");
  const [sortBy, setSortBy] = useState<"recent" | "upvotes" | "replies">("recent");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Local state for interactive posts and comments
  const [postsList, setPostsList] = useState<DiscussionThread[]>(initialDiscussions);
  const [commentsList, setCommentsList] = useState<Comment[]>(initialComments);
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set(["disc-101"]));
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Create Post Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newCategory, setNewCategory] = useState<PostCategoryType>("question");
  const [newCourseId, setNewCourseId] = useState<string>(courses[0]?.id || "course-general");
  const [newCourseCode, setNewCourseCode] = useState<string>(courses[0]?.code || "ENG");
  const [newTagsInput, setNewTagsInput] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);

  // Sync with initial discussions if prop changes
  useEffect(() => {
    if (initialDiscussions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPostsList(initialDiscussions);
    }
  }, [initialDiscussions]);

  useEffect(() => {
    if (initialComments.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCommentsList(initialComments);
    }
  }, [initialComments]);

  // Filtering & Sorting Logic
  const filteredPosts = postsList
    .filter((post) => {
      if (selectedCategory !== "all" && post.postType !== selectedCategory) return false;
      if (selectedDeptId !== "all" && post.departmentId && post.departmentId !== selectedDeptId)
        return false;
      if (selectedStatus === "solved" && !post.isSolved) return false;
      if (selectedStatus === "unsolved" && post.isSolved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchContent = post.content.toLowerCase().includes(q);
        const matchCode = post.courseCode?.toLowerCase().includes(q);
        const matchTag = post.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchCode && !matchTag) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === "upvotes") {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      if (sortBy === "replies") {
        return (b.replyCount || 0) - (a.replyCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Toggle expand comments
  const toggleExpand = (postId: string) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // Upvote Post (Optimistic with server sync)
  const handleUpvote = async (postId: string) => {
    setPostsList((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasUpvoted = p.hasUpvoted;
          return {
            ...p,
            hasUpvoted: !hasUpvoted,
            upvotes: hasUpvoted ? Math.max(0, p.upvotes - 1) : p.upvotes + 1,
          };
        }
        return p;
      }),
    );

    try {
      await fetch(`/api/posts/${postId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      /* ignore */
    }

    if (onUpvoteDiscussion) {
      onUpvoteDiscussion(postId);
    }
  };

  // Upvote Comment
  const handleUpvoteComment = (commentId: string) => {
    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const hasUp = c.hasUpvoted;
          return {
            ...c,
            hasUpvoted: !hasUp,
            upvotes: hasUp ? Math.max(0, c.upvotes - 1) : c.upvotes + 1,
          };
        }
        return c;
      }),
    );
  };

  // Submit new comment reply
  const handleAddReply = async (postId: string) => {
    const text = replyInputMap[postId]?.trim();
    if (!text || text.length < 3) return;

    setIsSubmittingReply((prev) => ({ ...prev, [postId]: true }));

    const newCmt: Comment = {
      id: `cmt-${Date.now()}`,
      targetType: "discussion",
      targetId: postId,
      authorId: user?.id || "usr-current",
      authorName: user?.name || "طالب مساهم",
      authorDepartment: user?.departmentId === "dept-mtr" ? "هندسة الميكاترونكس" : "هندسة الحاسب",
      authorRole: user?.role || "student",
      authorAvatar: user?.avatar,
      content: text,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false,
      isSolution: false,
    };

    setCommentsList((prev) => [...prev, newCmt]);
    setPostsList((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, replyCount: p.replyCount + 1 } : p)),
    );
    setReplyInputMap((prev) => ({ ...prev, [postId]: "" }));

    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
    } catch {
      /* ignore */
    }

    setIsSubmittingReply((prev) => ({ ...prev, [postId]: false }));
  };

  // Mark comment as solution
  const handleMarkAsSolution = async (postId: string, commentId: string) => {
    setCommentsList((prev) =>
      prev.map((c) => (c.targetId === postId ? { ...c, isSolution: c.id === commentId } : c)),
    );
    setPostsList((prev) => prev.map((p) => (p.id === postId ? { ...p, isSolved: true } : p)));

    try {
      await fetch(`/api/posts/${postId}/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
    } catch {
      /* ignore */
    }
  };

  // Share post link helper
  const handleSharePost = (postId: string) => {
    const url = `${window.location.origin}/#post-${postId}`;
    navigator.clipboard?.writeText(url);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2500);
  };

  // Create new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.trim().length < 5) {
      setCreateError("يجب أن يكون عنوان الموضوع 5 أحرف على الأقل.");
      return;
    }
    if (!newContent.trim() || newContent.trim().length < 10) {
      setCreateError("يجب كتابة تفاصيل الموضوع بما لا يقل عن 10 أحرف.");
      return;
    }

    setIsSubmittingPost(true);
    setCreateError(null);

    const tags = newTagsInput
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newPost: DiscussionThread = {
      id: `disc-${Date.now()}`,
      courseId: newCourseId,
      courseCode: newCourseCode,
      departmentId: user?.departmentId || "dept-cmp",
      title: newTitle.trim(),
      content: newContent.trim(),
      postType: newCategory,
      authorId: user?.id || "usr-current",
      authorName: user?.name || "Alex Vance",
      authorDepartment:
        user?.departmentId === "dept-mtr" ? "هندسة الميكاترونكس" : "هندسة الحاسب والذكاء الاصطناعي",
      authorRole: user?.role || "student",
      authorAvatar: user?.avatar,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false,
      replyCount: 0,
      isSolved: false,
      views: 1,
      tags: tags.length > 0 ? tags : ["General", "Discussion"],
    };

    setPostsList((prev) => [newPost, ...prev]);
    setIsCreateModalOpen(false);
    setNewTitle("");
    setNewContent("");
    setNewTagsInput("");

    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          postType: newPost.postType,
          courseId: newPost.courseId,
          courseCode: newPost.courseCode,
          departmentId: newPost.departmentId,
          tags: newPost.tags,
        }),
      });
    } catch {
      /* ignore */
    }

    if (onNewDiscussion) {
      onNewDiscussion(newCourseId, newPost.title, newPost.content);
    }

    setIsSubmittingPost(false);
  };

  // Helper for category badge styling
  const getCategoryMeta = (type?: PostCategoryType) => {
    switch (type) {
      case "question":
        return {
          label: "سؤال واستفسار",
          icon: HelpCircle,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      case "resource_share":
        return {
          label: "مشاركة مرجع",
          icon: BookOpen,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "study_tip":
        return {
          label: "نصيحة دراسية",
          icon: Lightbulb,
          color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
        };
      case "exam_discussion":
        return {
          label: "نقاش امتحانات",
          icon: FileQuestion,
          color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        };
      case "project_help":
        return {
          label: "مساعدة مشروع",
          icon: Wrench,
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
      default:
        return {
          label: "مناقشة عامة",
          icon: MessageSquare,
          color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
        };
    }
  };

  const communityTabs: ScrollableTabItem[] = [
    {
      id: "posts",
      label: "منشورات ومناقشات الطلاب (Posts & Q&A)",
      icon: <MessageSquare className="w-4 h-4" />,
      badge: postsList.length,
    },
    {
      id: "leaderboard",
      label: "لوحة الشرف والتميز الأكاديمي (Honor Roll & Achievers)",
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
    },
  ];

  return (
    <div className="space-y-6 pb-12" id="academic-posts-community">
      {/* Top Header Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <ScrollableTabs
          tabs={communityTabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
          ariaLabel="شريط تبويبات المجتمع الأكاديمي"
        />
      </div>

      {/* ------------------------------------------------ */}
      {/* 1. ACADEMIC POSTS FEED VIEW                     */}
      {/* ------------------------------------------------ */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>مجتمع ومناقشات الهندسة الأكاديمية</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {filteredPosts.length} منشور
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اطرح استفساراتك، شارك المراجع والحلول النموذجية، وتناقش مع زملائك وأعضاء هيئة
                  التدريس (+10 نقاط للحلول المعتمدة).
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء موضوع / سؤال جديد</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              {/* Search Bar */}
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث بالعنوان، الكود، المحتوى، أو #الوسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">كافة أنواع المنشورات</option>
                <option value="question">❓ أسئلة واستفسارات</option>
                <option value="resource_share">📚 مراجع ومذكرات</option>
                <option value="study_tip">💡 نصائح دراسية</option>
                <option value="exam_discussion">📝 نقاش امتحانات</option>
                <option value="project_help">🛠️ مساعدة مشاريع</option>
              </select>

              {/* Department Filter */}
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">كافة الأقسام</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Status / Sort Filter */}
              <div className="flex gap-1.5">
                <select
                  value={selectedStatus}
                  onChange={(e: any) => setSelectedStatus(e.target.value)}
                  className="flex-1 px-2.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">الحالة: الكل</option>
                  <option value="solved">✓ تم الحل</option>
                  <option value="unsolved">⏳ بانتظار حل</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="px-2.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  title="ترتيب النتائج"
                >
                  <option value="recent">الأحدث</option>
                  <option value="upvotes">الأكثر تأييداً</option>
                  <option value="replies">الأكثر ردوداً</option>
                </select>
              </div>
            </div>
          </div>

          {/* Posts Feed List */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  لا توجد منشورات مطابقة لمعايير البحث
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  جرّب تغيير كلمات البحث أو الفلاتر، أو ابدأ النقاش بطرح موضوع جديد للحصول على نقاط!
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition-colors"
              >
                طرح سؤال أو موضوع الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const categoryMeta = getCategoryMeta(post.postType);
                const isExpanded = expandedPostIds.has(post.id);
                const postComments = commentsList.filter((c) => c.targetId === post.id);
                const hasSolvedComment = postComments.some((c) => c.isSolution);
                const isSolvedState = post.isSolved || hasSolvedComment;

                return (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-md transition-all duration-200 space-y-4"
                  >
                    {/* Post Top Header */}
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            post.authorAvatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                          }
                          alt={post.authorName}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                          loading="lazy"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                              {post.authorName}
                            </span>
                            {post.authorRole === "moderator" && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                مشرف أكاديمي
                              </span>
                            )}
                            {post.authorRole === "supervisor" && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                عضو هيئة تدريس
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{post.authorDepartment}</span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString("ar-EG")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Meta Chips */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {post.isPinned && (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            مثبت
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${categoryMeta.color} flex items-center gap-1`}
                        >
                          <categoryMeta.icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{categoryMeta.label}</span>
                        </span>
                        {post.courseCode && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 course-code">
                            {post.courseCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Post Title & Content */}
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {post.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/40 flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            <bdi>{tag}</bdi>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Solved Status Indicator Banner */}
                    {isSolvedState && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          تم حل هذا الاستفسار واعتماد الإجابة النموذجية من المشرف الأكاديمي / صاحب
                          السؤال
                        </span>
                      </div>
                    )}

                    {/* Bottom Action Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => handleUpvote(post.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 min-h-[36px] ${
                            post.hasUpvoted
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                          aria-label="تأييد المنشور"
                        >
                          <ThumbsUp
                            className={`w-3.5 h-3.5 ${post.hasUpvoted ? "text-white" : "text-slate-500"}`}
                          />
                          <span>{post.upvotes} تأييد</span>
                        </button>

                        <button
                          onClick={() => toggleExpand(post.id)}
                          className="px-3 py-1.5 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 min-h-[36px]"
                          aria-label="عرض الردود"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>{postComments.length} إجابات</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleSharePost(post.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[36px]"
                          title="مشاركة رابط المنشور"
                        >
                          {copiedPostId === post.id ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="text-slate-400 text-[11px] flex items-center gap-1">
                        <span>{post.views || 1} مشاهدة</span>
                      </div>
                    </div>

                    {/* Expanded Replies & Comment Input */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                        {/* Comments Thread List */}
                        <div className="space-y-3">
                          {postComments.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500 dark:text-slate-400">
                              لا توجد ردود بعد. كن أول من يجيب ويساعد زملاءه للحصول على نقاط (+5
                              نقاط للإجابة)!
                            </div>
                          ) : (
                            // Show verified solution comment at the top if present
                            [...postComments]
                              .sort((a, b) => (b.isSolution ? 1 : 0) - (a.isSolution ? 1 : 0))
                              .map((cmt) => (
                                <div
                                  key={cmt.id}
                                  className={`p-4 rounded-xl border transition-all ${
                                    cmt.isSolution
                                      ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/50 ring-1 ring-emerald-500/30"
                                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {cmt.authorName}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        • {cmt.authorDepartment}
                                      </span>
                                      {cmt.isSolution && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          حل نموذجي معتمد (+10 نقاط)
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Mark as Solution button (author or elevated role) */}
                                      {!cmt.isSolution &&
                                        (user?.id === post.authorId ||
                                          user?.role !== "student") && (
                                          <button
                                            onClick={() => handleMarkAsSolution(post.id, cmt.id)}
                                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 transition-colors"
                                          >
                                            اعتماد كحل نموذجي ✓
                                          </button>
                                        )}

                                      <button
                                        onClick={() => handleUpvoteComment(cmt.id)}
                                        className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                          cmt.hasUpvoted
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                        }`}
                                      >
                                        ▲ {cmt.upvotes}
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                                    {cmt.content}
                                  </p>
                                </div>
                              ))
                          )}
                        </div>

                        {/* Reply Input Box */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="اكتب إجابتك أو إيضاحك الأكاديمي هنا..."
                            value={replyInputMap[post.id] || ""}
                            onChange={(e) =>
                              setReplyInputMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddReply(post.id);
                              }
                            }}
                            className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleAddReply(post.id)}
                            disabled={isSubmittingReply[post.id] || !replyInputMap[post.id]?.trim()}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 shrink-0 min-h-[40px]"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>إرسال</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* 2. HONOR BOARD & ACHIEVERS TAB                   */}
      {/* ------------------------------------------------ */}
      {activeTab === "leaderboard" && (
        <HonorBoardView currentUser={user} departments={departments} />
      )}

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                إنشاء منشور أو سؤال أكاديمي جديد
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  نوع المنشور
                </label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="question">❓ سؤال واستفسار أكاديمي</option>
                  <option value="resource_share">📚 مشاركة مرجع أو ملخص</option>
                  <option value="study_tip">💡 نصيحة دراسية وتجربة معملية</option>
                  <option value="exam_discussion">📝 نقاش امتحانات سابقة</option>
                  <option value="project_help">🛠️ استشارة وتطوير مشروع تخرج/عملي</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المقرر المرتبط
                </label>
                <select
                  value={newCourseId}
                  onChange={(e) => {
                    const c = courses.find((crs) => crs.id === e.target.value);
                    setNewCourseId(e.target.value);
                    if (c) setNewCourseCode(c.code);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="course-general">عام (كافة المقررات الهندسية)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  عنوان الموضوع
                </label>
                <input
                  type="text"
                  placeholder="اكتب عنواناً دقيقاً وواضحاً..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  التفاصيل والشرح
                </label>
                <textarea
                  rows={4}
                  placeholder="اشرح المسألة أو المرجع بالتفصيل لتسهيل فهم الزملاء والمشرفين..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الوسوم والكلمات المفتاحية (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  placeholder="مثال: Laplace, Logic, C++, Midterm"
                  value={newTagsInput}
                  onChange={(e) => setNewTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors disabled:opacity-50 min-h-[40px]"
                >
                  {isSubmittingPost ? "جاري النشر..." : "نشر الموضوع (+5 نقاط)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
