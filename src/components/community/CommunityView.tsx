import {
  MessageSquare,
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
  Check,
  Tag,
  CheckCheck,
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
import {
  Card,
  Button,
  Badge,
  SearchField,
  Select,
  Avatar,
  EmptyState,
  Skeleton,
  CardSkeleton,
} from "../ui";
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

  const [postsList, setPostsList] = useState<DiscussionThread[]>(initialDiscussions);
  const [commentsList, setCommentsList] = useState<Comment[]>(initialComments);
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set(["disc-101"]));
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newCategory, setNewCategory] = useState<PostCategoryType>("question");
  const [newCourseId, setNewCourseId] = useState<string>(courses[0]?.id || "course-general");
  const [newCourseCode, setNewCourseCode] = useState<string>(courses[0]?.code || "ENG");
  const [newTagsInput, setNewTagsInput] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialDiscussions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPostsList(initialDiscussions);
    }
    setIsLoading(false);
  }, [initialDiscussions]);

  useEffect(() => {
    if (initialComments.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCommentsList(initialComments);
    }
  }, [initialComments]);

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

  const handleSharePost = (postId: string) => {
    const url = `${window.location.origin}/#post-${postId}`;
    navigator.clipboard?.writeText(url);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2500);
  };

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

  const getCategoryMeta = (type?: PostCategoryType) => {
    switch (type) {
      case "question":
        return {
          label: "سؤال واستفسار",
          icon: HelpCircle,
          color: "warning",
        };
      case "resource_share":
        return {
          label: "مشاركة مرجع",
          icon: BookOpen,
          color: "success",
        };
      case "study_tip":
        return {
          label: "نصيحة دراسية",
          icon: Lightbulb,
          color: "neutral",
        };
      case "exam_discussion":
        return {
          label: "نقاش امتحانات",
          icon: FileQuestion,
          color: "primary",
        };
      case "project_help":
        return {
          label: "مساعدة مشروع",
          icon: Wrench,
          color: "info",
        };
      default:
        return {
          label: "مناقشة عامة",
          icon: MessageSquare,
          color: "neutral",
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

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <Card padding="lg" className="space-y-4">
          <Skeleton width="40%" height={20} />
          <Skeleton width="60%" height={16} />
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} lines={4} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12" id="academic-posts-community">
      {/* Top Header Tabs */}
      <div className="border-b border-ehb-default pb-3">
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
          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-ehb-text-primary flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-ehb-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>مجتمع ومناقشات الهندسة الأكاديمية</span>
                </h2>
                <p className="text-xs text-ehb-text-muted mt-1">
                  اطرح استفساراتك، شارك المراجع والحلول النموذجية، وتناقش مع زملائك وأعضاء هيئة
                  التدريس (+10 نقاط للحلول المعتمدة).
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shrink-0"
              >
                إنشاء موضوع / سؤال جديد
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3 border-t border-ehb-subtle">
              {/* Search Bar */}
              <div className="sm:col-span-2">
                <SearchField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالعنوان، الكود، المحتوى، أو #الوسم..."
                  size="sm"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="sm"
                className="w-full"
              >
                <option value="all">كافة أنواع المنشورات</option>
                <option value="question">❓ أسئلة واستفسارات</option>
                <option value="resource_share">📚 مراجع ومذكرات</option>
                <option value="study_tip">💡 نصائح دراسية</option>
                <option value="exam_discussion">📝 نقاش امتحانات</option>
                <option value="project_help">🛠️ مساعدة مشاريع</option>
              </Select>

              {/* Department Filter */}
              <Select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                size="sm"
                className="w-full"
              >
                <option value="all">كافة الأقسام</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>

              {/* Status / Sort Filter */}
              <div className="flex gap-2">
                <Select
                  value={selectedStatus}
                  onChange={(e: any) => setSelectedStatus(e.target.value)}
                  size="sm"
                  className="flex-1"
                >
                  <option value="all">الحالة: الكل</option>
                  <option value="solved">✓ تم الحل</option>
                  <option value="unsolved">⏳ بانتظار حل</option>
                </Select>

                <Select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  size="sm"
                  className="flex-1"
                  title="ترتيب النتائج"
                >
                  <option value="recent">الأحدث</option>
                  <option value="upvotes">الأكثر تأييداً</option>
                  <option value="replies">الأكثر ردوداً</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* Posts Feed List */}
          {filteredPosts.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={MessageSquare}
                title="لا توجد منشورات مطابقة لمعايير البحث"
                description="جرّب تغيير كلمات البحث أو الفلاتر، أو ابدأ النقاش بطرح موضوع جديد للحصول على نقاط!"
                actionLabel="طرح سؤال أو موضوع الآن"
                onAction={() => setIsCreateModalOpen(true)}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const categoryMeta = getCategoryMeta(post.postType);
                const isExpanded = expandedPostIds.has(post.id);
                const postComments = commentsList.filter((c) => c.targetId === post.id);
                const hasSolvedComment = postComments.some((c) => c.isSolution);
                const isSolvedState = post.isSolved || hasSolvedComment;

                return (
                  <Card
                    key={post.id}
                    padding="lg"
                    className="space-y-4"
                  >
                    {/* Post Top Header */}
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={post.authorAvatar}
                          alt={post.authorName}
                          size="md"
                          fallback={post.authorName?.[0] || "?"}
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-ehb-text-primary">
                              {post.authorName}
                            </span>
                            {post.authorRole === "moderator" && (
                              <Badge variant="primary" size="sm" dot>
                                مشرف أكاديمي
                              </Badge>
                            )}
                            {post.authorRole === "supervisor" && (
                              <Badge variant="warning" size="sm" dot>
                                عضو هيئة تدريس
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-ehb-text-muted flex items-center gap-1.5 mt-0.5">
                            <span>{post.authorDepartment}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {new Date(post.createdAt).toLocaleDateString("ar-EG")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Meta Chips */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {post.isPinned && (
                          <Badge variant="warning" size="sm" dot>
                            <Pin className="w-3 h-3" />
                            مثبت
                          </Badge>
                        )}
                        <Badge variant={categoryMeta.color as any} size="sm">
                          <categoryMeta.icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{categoryMeta.label}</span>
                        </Badge>
                        {post.courseCode && (
                          <Badge variant="neutral" size="sm" className="course-code">
                            {post.courseCode}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Post Title & Content */}
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-bold text-ehb-text-primary leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-ehb-text-muted leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {post.tags.map((tag, idx) => (
                          <Badge key={idx} variant="neutral" size="sm">
                            <Tag className="w-2.5 h-2.5 text-ehb-text-muted" />
                            <bdi>{tag}</bdi>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Solved Status Indicator Banner */}
                    {isSolvedState && (
                      <div className="p-3 rounded-ehb-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          تم حل هذا الاستفسار واعتماد الإجابة النموذجية من المشرف الأكاديمي / صاحب
                          السؤال
                        </span>
                      </div>
                    )}

                    {/* Bottom Action Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-ehb-subtle text-xs">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          variant={post.hasUpvoted ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => handleUpvote(post.id)}
                          leftIcon={<ThumbsUp className="w-3.5 h-3.5" />}
                        >
                          {post.upvotes} تأييد
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleExpand(post.id)}
                          leftIcon={
                            isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {postComments.length} إجابات
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSharePost(post.id)}
                          leftIcon={
                            copiedPostId === post.id ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          مشاركة
                        </Button>
                      </div>

                      <div className="text-ehb-text-muted text-[11px] flex items-center gap-1">
                        <span>{post.views || 1} مشاهدة</span>
                      </div>
                    </div>

                    {/* Expanded Replies & Comment Input */}
                    {isExpanded && (
                      <div className="pt-4 space-y-4 border-t border-ehb-subtle">
                        {/* Comments Thread List */}
                        <div className="space-y-3">
                          {postComments.length === 0 ? (
                            <div className="p-4 rounded-ehb-md bg-ehb-surface text-center text-xs text-ehb-text-muted">
                              لا توجد ردود بعد. كن أول من يجيب ويساعد زملاءه للحصول على نقاط (+5
                              نقاط للإجابة)!
                            </div>
                          ) : (
                            [...postComments]
                              .sort((a, b) => (b.isSolution ? 1 : 0) - (a.isSolution ? 1 : 0))
                              .map((cmt) => (
                                <div
                                  key={cmt.id}
                                  className={`p-4 rounded-ehb-md border transition-all ${
                                    cmt.isSolution
                                      ? "bg-emerald-500/10 border-emerald-500/30"
                                      : "bg-ehb-surface border-ehb-subtle"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-ehb-text-primary">
                                        {cmt.authorName}
                                      </span>
                                      <span className="text-[10px] text-ehb-text-muted">
                                        • {cmt.authorDepartment}
                                      </span>
                                      {cmt.isSolution && (
                                        <Badge variant="success" size="sm" dot>
                                          <Check className="w-3 h-3" />
                                          حل نموذجي معتمد (+10 نقاط)
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-ehb-text-muted font-mono">
                                      {cmt.createdAt}
                                    </span>
                                  </div>

                                  <p className="text-xs sm:text-sm text-ehb-text-primary leading-relaxed whitespace-pre-line">
                                    {cmt.content}
                                  </p>

                                  <div className="flex items-center gap-2 mt-3">
                                    {/* Mark as Solution button */}
                                    {!cmt.isSolution &&
                                      (user?.id === post.authorId ||
                                        user?.role !== "student") && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleMarkAsSolution(post.id, cmt.id)}
                                        >
                                          اعتماد كحل نموذجي ✓
                                        </Button>
                                      )}

                                    <Button
                                      variant={cmt.hasUpvoted ? "primary" : "secondary"}
                                      size="sm"
                                      onClick={() => handleUpvoteComment(cmt.id)}
                                    >
                                      ▲ {cmt.upvotes}
                                    </Button>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>

                        {/* Reply Input Box */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="أضف رداً أكاديمياً..."
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
                            className="flex-1 px-3.5 py-2 rounded-ehb-md border border-ehb-default bg-ehb-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddReply(post.id)}
                            disabled={isSubmittingReply[post.id] || !replyInputMap[post.id]?.trim()}
                            leftIcon={<Send className="w-3.5 h-3.5" />}
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

      {/* ------------------------------------------------ */}
      {/* 2. HONOR BOARD & ACHIEVERS TAB                   */}
      {/* ------------------------------------------------ */}
      {activeTab === "leaderboard" && (
        <HonorBoardView currentUser={user} departments={departments} />
      )}

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <Card
            padding="lg"
            className="w-full max-w-lg shadow-ehb-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-ehb-text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                إنشاء منشور أو سؤال أكاديمي جديد
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="إغلاق"
              >
                ✕
              </Button>
            </div>

            {createError && (
              <div className="p-3 rounded-ehb-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ehb-text-primary">
                  نوع المنشور
                </label>
                <Select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  size="sm"
                  className="w-full"
                >
                  <option value="question">❓ سؤال واستفسار أكاديمي</option>
                  <option value="resource_share">📚 مشاركة مرجع أو ملخص</option>
                  <option value="study_tip">💡 نصيحة دراسية وتجربة معملية</option>
                  <option value="exam_discussion">📝 نقاش امتحانات سابقة</option>
                  <option value="project_help">🛠️ استشارة وتطوير مشروع تخرج/عملي</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ehb-text-primary">
                  المقرر المرتبط
                </label>
                <Select
                  value={newCourseId}
                  onChange={(e) => {
                    const c = courses.find((crs) => crs.id === e.target.value);
                    setNewCourseId(e.target.value);
                    if (c) setNewCourseCode(c.code);
                  }}
                  size="sm"
                  className="w-full"
                >
                  <option value="course-general">عام (كافة المقررات الهندسية)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ehb-text-primary">
                  عنوان الموضوع
                </label>
                <input
                  type="text"
                  placeholder="اكتب عنواناً دقيقاً وواضحاً..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ehb-text-primary">
                  التفاصيل والشرح
                </label>
                <textarea
                  rows={4}
                  placeholder="اشرح المسألة أو المرجع بالتفصيل لتسهيل فهم الزملاء والمشرفين..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ehb-text-primary">
                  الوسوم والكلمات المفتاحية (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  placeholder="مثال: Laplace, Logic, C++, Midterm"
                  value={newTagsInput}
                  onChange={(e) => setNewTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={isSubmittingPost}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {isSubmittingPost ? "جاري النشر..." : "نشر الموضوع (+5 نقاط)"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
