import {
  HelpCircle,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Bot,
  BookOpenCheck,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Search,
  Flag,
  AlertCircle,
  FileText,
  GraduationCap,
  ListOrdered,
  Layers,
  Bookmark,
  BookmarkCheck,
  Flame,
  AlertTriangle,
  FileQuestion,
  TrendingUp,
} from "lucide-react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { MOCK_EXAMS_QUIZZES } from "../../data/mockData";
import { ExamQuiz, QuizQuestion, QuizSubmission, Course, UserProfile } from "../../types";
import { ScrollableTabs, ScrollableTabItem } from "../common/ScrollableTabs";

interface ExamsQuizzesEngineProps {
  courses: Course[];
  initialQuizzes?: ExamQuiz[];
  currentUser: UserProfile;
  onUpdatePoints?: (points: number) => void;
  onOpenCourse?: (_courseId: string) => void;
  onStartPomodoroStudy?: (courseCode: string, taskName: string) => void;
}

export const ExamsQuizzesEngine: React.FC<ExamsQuizzesEngineProps> = ({
  courses,
  initialQuizzes = MOCK_EXAMS_QUIZZES,
  currentUser,
  onUpdatePoints,
  _onOpenCourse,
  onStartPomodoroStudy,
}) => {
  const [quizzes, setQuizzes] = useState<ExamQuiz[]>(initialQuizzes);
  const [selectedQuiz, setSelectedQuiz] = useState<ExamQuiz | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "quizzes" | "past_exams" | "mistakes" | "bookmarks" | "history"
  >("all");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTermType, setSelectedTermType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Bookmarks State (Saved Exam IDs and Saved Question IDs)
  const [bookmarkedExamIds, setBookmarkedExamIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("enghub_bookmarked_exams");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("enghub_bookmarked_questions");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Quiz Taking State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(null);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState<boolean>(false);

  // Submissions History & Mistakes Aggregator
  const [submissionsHistory, setSubmissionsHistory] = useState<QuizSubmission[]>([]);
  const [_isLoadingSubmissions, _setIsLoadingSubmissions] = useState<boolean>(true);

  // Fetch real submissions from the server on mount
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    _setIsLoadingSubmissions(true);
    fetch("/api/quiz/submissions", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.resolve({ submissions: [] })))
      .then((data) => {
        if (cancelled) return;
        const subs: QuizSubmission[] = Array.isArray(data.submissions) ? data.submissions : [];
        setSubmissionsHistory(subs);
        _setIsLoadingSubmissions(false);
      })
      .catch(() => {
        if (!cancelled) _setIsLoadingSubmissions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // AI Explanation State
  const [aiExplanationModal, setAiExplanationModal] = useState<{
    isOpen: boolean;
    question: QuizQuestion | null;
    userAnswerText?: string;
    courseCode?: string;
    loading: boolean;
    explanationText: string | null;
  }>({
    isOpen: false,
    question: null,
    loading: false,
    explanationText: null,
  });

  // AI Practice Quiz Generator Form State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiCourseCode, setAiCourseCode] = useState<string>(courses[0]?.code || "AIE 103");
  const [aiTopic, setAiTopic] = useState<string>("");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(4);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "enghub_bookmarked_exams",
        JSON.stringify(Array.from(bookmarkedExamIds)),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [bookmarkedExamIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "enghub_bookmarked_questions",
        JSON.stringify(Array.from(bookmarkedQuestionIds)),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [bookmarkedQuestionIds]);

  // Aggregate mistake questions across past submissions
  const mistakeQuestionsList = useMemo(() => {
    const wrongMap = new Map<
      string,
      { question: QuizQuestion; courseCode: string; quizTitle: string; selectedIndex: number }
    >();

    submissionsHistory.forEach((sub) => {
      const matchedQuiz = quizzes.find(
        (q) => q.id === sub.quizId || q.courseCode === sub.courseCode,
      );
      if (!matchedQuiz) return;

      sub.answers.forEach((ans) => {
        if (!ans.isCorrect) {
          const qObj = matchedQuiz.questions.find((q) => q.id === ans.questionId);
          if (qObj) {
            wrongMap.set(qObj.id, {
              question: qObj,
              courseCode: sub.courseCode,
              quizTitle: sub.quizTitle,
              selectedIndex: ans.selectedIndex,
            });
          }
        }
      });
    });

    return Array.from(wrongMap.values());
  }, [submissionsHistory, quizzes]);

  // Aggregate bookmarked questions
  const bookmarkedQuestionsList = useMemo(() => {
    const list: Array<{ question: QuizQuestion; courseCode: string; quizTitle: string }> = [];
    quizzes.forEach((quiz) => {
      quiz.questions.forEach((q) => {
        if (bookmarkedQuestionIds.has(q.id)) {
          list.push({
            question: q,
            courseCode: quiz.courseCode,
            quizTitle: quiz.title,
          });
        }
      });
    });
    return list;
  }, [quizzes, bookmarkedQuestionIds]);

  // Filter quizzes based on active tab and filters
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      if (activeTab === "quizzes" && quiz.isPastExam) return false;
      if (activeTab === "past_exams" && !quiz.isPastExam) return false;
      if (activeTab === "bookmarks" && !bookmarkedExamIds.has(quiz.id)) return false;

      if (
        selectedCourseFilter !== "all" &&
        quiz.courseId !== selectedCourseFilter &&
        quiz.courseCode !== selectedCourseFilter
      )
        return false;
      if (selectedDifficulty !== "all" && quiz.difficulty !== selectedDifficulty) return false;
      if (selectedTermType !== "all" && quiz.term !== selectedTermType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = quiz.title.toLowerCase().includes(q);
        const matchTopic = quiz.topic.toLowerCase().includes(q);
        const matchCode = quiz.courseCode.toLowerCase().includes(q);
        if (!matchTitle && !matchTopic && !matchCode) return false;
      }
      return true;
    });
  }, [
    quizzes,
    activeTab,
    selectedCourseFilter,
    selectedDifficulty,
    selectedTermType,
    searchQuery,
    bookmarkedExamIds,
  ]);

  // Toggle Bookmark Exam
  const handleToggleBookmarkExam = (examId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  };

  // Toggle Bookmark Question
  const handleToggleBookmarkQuestion = (questionId: string) => {
    setBookmarkedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // Start a Quiz
  const handleStartQuiz = (quiz: ExamQuiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setIsQuizSubmitted(false);
    setSubmissionResult(null);
    setIsReviewDrawerOpen(false);
    setTimeLeftSeconds(quiz.durationMinutes * 60);
  };

  // Start a Custom Practice Quiz containing only mistake questions
  const handleStartMistakesQuiz = (courseCodeFilter?: string) => {
    const targetMistakes = courseCodeFilter
      ? mistakeQuestionsList.filter((m) => m.courseCode === courseCodeFilter)
      : mistakeQuestionsList;

    if (targetMistakes.length === 0) return;

    const customMistakesQuiz: ExamQuiz = {
      id: `mistakes-quiz-${Date.now()}`,
      title: `اختبار إعادة حل الأخطاء — ${courseCodeFilter || "مراجعة عامة"}`,
      courseId: "mistakes-rev",
      courseCode: courseCodeFilter || targetMistakes[0]?.courseCode || "ENG",
      departmentId: currentUser.departmentId,
      topic: "إعادة حل وتثبيت المسائل غير الصحيحة",
      difficulty: "medium",
      durationMinutes: Math.max(5, targetMistakes.length * 3),
      questions: targetMistakes.map((m) => m.question),
      createdAt: new Date().toISOString().split("T")[0],
      term: "Quiz",
      totalAttempts: 1,
      averageScore: 90,
    };

    handleStartQuiz(customMistakesQuiz);
  };

  // Timer Effect
  useEffect(() => {
    if (!selectedQuiz || isQuizSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // eslint-disable-next-line react-hooks/immutability
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuiz, isQuizSubmitted]);

  // Answer selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isQuizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // Auto-submit or manual submit
  function handleAutoSubmit() {
    if (!selectedQuiz || isQuizSubmitted) return;
    submitQuizInternal();
  }

  const handleSubmitQuiz = () => {
    if (!selectedQuiz) return;
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = selectedQuiz.questions.length;

    if (answeredCount < totalCount) {
      setIsReviewDrawerOpen(true);
      return;
    }

    submitQuizInternal();
  };

  const submitQuizInternal = async () => {
    if (!selectedQuiz) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsReviewDrawerOpen(false);

    const questions = selectedQuiz.questions;
    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: userAnswers[q.id] !== undefined ? userAnswers[q.id] : -1,
      correctIndex: q.correctIndex,
    }));

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          quizTitle: selectedQuiz.title,
          courseCode: selectedQuiz.courseCode,
          answers: formattedAnswers,
          totalQuestions: questions.length,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissionResult(data.submission);
        setIsQuizSubmitted(true);
        setSubmissionsHistory((prev) => [data.submission, ...prev]);
        if (data.submission.pointsEarned && onUpdatePoints) {
          onUpdatePoints(data.submission.pointsEarned);
        }
      } else {
        // Fallback offline calculation
        let correct = 0;
        formattedAnswers.forEach((a) => {
          if (a.selectedIndex === a.correctIndex) correct++;
        });
        const pct = Math.round((correct / questions.length) * 100);
        const sub: QuizSubmission = {
          id: `sub-${Date.now()}`,
          quizId: selectedQuiz.id,
          quizTitle: selectedQuiz.title,
          courseCode: selectedQuiz.courseCode,
          studentId: currentUser.id,
          studentName: currentUser.name,
          score: correct,
          totalQuestions: questions.length,
          percentage: pct,
          passed: pct >= 60,
          pointsEarned: pct >= 60 ? 15 : 5,
          answers: formattedAnswers.map((a) => ({
            ...a,
            isCorrect: a.selectedIndex === a.correctIndex,
          })),
          timeTakenSeconds: selectedQuiz.durationMinutes * 60 - timeLeftSeconds,
          submittedAt: new Date().toISOString(),
        };
        setSubmissionResult(sub);
        setIsQuizSubmitted(true);
        setSubmissionsHistory((prev) => [sub, ...prev]);
        if (onUpdatePoints) onUpdatePoints(sub.pointsEarned || 5);
      }
    } catch {
      // Fallback
      let correct = 0;
      formattedAnswers.forEach((a) => {
        if (a.selectedIndex === a.correctIndex) correct++;
      });
      const pct = Math.round((correct / questions.length) * 100);
      const sub: QuizSubmission = {
        id: `sub-${Date.now()}`,
        quizId: selectedQuiz.id,
        quizTitle: selectedQuiz.title,
        courseCode: selectedQuiz.courseCode,
        studentId: currentUser.id,
        studentName: currentUser.name,
        score: correct,
        totalQuestions: questions.length,
        percentage: pct,
        passed: pct >= 60,
        pointsEarned: pct >= 60 ? 15 : 5,
        answers: formattedAnswers.map((a) => ({
          ...a,
          isCorrect: a.selectedIndex === a.correctIndex,
        })),
        timeTakenSeconds: selectedQuiz.durationMinutes * 60 - timeLeftSeconds,
        submittedAt: new Date().toISOString(),
      };
      setSubmissionResult(sub);
      setIsQuizSubmitted(true);
      setSubmissionsHistory((prev) => [sub, ...prev]);
      if (onUpdatePoints) onUpdatePoints(sub.pointsEarned || 5);
    }
  };

  // AI Tutor Explain Question Handler
  const handleRequestAiExplanation = async (
    q: QuizQuestion,
    userSelectedIdx?: number,
    courseCode?: string,
  ) => {
    const userSelectedText =
      userSelectedIdx !== undefined && userSelectedIdx >= 0
        ? q.options[userSelectedIdx]
        : "لم يُجب";
    const correctText = q.options[q.correctIndex];

    setAiExplanationModal({
      isOpen: true,
      question: q,
      userAnswerText: userSelectedText,
      courseCode: courseCode || selectedQuiz?.courseCode || "ENG",
      loading: true,
      explanationText: null,
    });

    try {
      const prompt = `أنا طالب هندسة في مقرر ${courseCode || "الهندسة"}.
السؤال: ${q.question}
الخيارات:
${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join("\n")}

الإجابة الصحيحة: ${correctText}
إجابتي التي اخترتها: ${userSelectedText}

اشرح لي بأسلوب أستاذ هندسي متميز:
1. لماذا الإجابة الصحيحة هي "${correctText}" بالخطوات والقوانين العلمية؟
2. أين يقع الخطأ في الإجابات الأخرى؟
3. نصيحة عملية لتذكر هذا المفهوم في الامتحان.`;

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          courseCode: courseCode || selectedQuiz?.courseCode,
          courseTitle: selectedQuiz?.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanationModal((prev) => ({
          ...prev,
          loading: false,
          explanationText: data.reply || data.answer || q.explanation,
        }));
      } else {
        setAiExplanationModal((prev) => ({
          ...prev,
          loading: false,
          explanationText:
            q.explanation ||
            "تعذر الاتصال بالمساعد الذكي حالياً، يرجى مراجعة الشرح النموذجي المرفق.",
        }));
      }
    } catch {
      setAiExplanationModal((prev) => ({
        ...prev,
        loading: false,
        explanationText:
          q.explanation || "تعذر الاتصال بالمساعد الذكي حالياً، يرجى مراجعة الشرح النموذجي المرفق.",
      }));
    }
  };

  // Generate AI Quiz
  const handleGenerateAiQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAiQuiz(true);
    setAiError(null);

    const matchedCourse = courses.find((c) => c.code === aiCourseCode) || courses[0];

    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: aiCourseCode,
          courseTitle: matchedCourse?.title || "الهندسة",
          topic: aiTopic || "مفاهيم المنهج الأساسية",
          difficulty: aiDifficulty,
          questionCount: aiQuestionCount,
        }),
      });

      if (!res.ok) {
        throw new Error("فشل توليد الاختبار من خادم الذكاء الاصطناعي");
      }

      const data = await res.json();
      const questions: QuizQuestion[] = data.questions || data.quiz || [];

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("لم يتم استلام أسئلة صالحة");
      }

      const newQuiz: ExamQuiz = {
        id: `quiz-ai-${Date.now()}`,
        title: `اختبار ذكي: ${aiTopic || matchedCourse?.title || aiCourseCode}`,
        courseId: matchedCourse?.id || "course-general",
        courseCode: aiCourseCode,
        departmentId: matchedCourse?.departmentId || currentUser.departmentId,
        topic: aiTopic || "مراجعة وتدريب ذكي شامل",
        difficulty: aiDifficulty,
        durationMinutes: Math.max(5, questions.length * 3),
        createdAt: new Date().toISOString().split("T")[0],
        totalAttempts: 1,
        averageScore: 85,
        term: "Quiz",
        questions,
      };

      setQuizzes((prev) => [newQuiz, ...prev]);
      setIsAiModalOpen(false);
      handleStartQuiz(newQuiz);
    } catch (err: any) {
      setAiError(err.message || "حدث خطأ أثناء الاتصال بالمساعد الذكي");
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Build tabs items for ScrollableTabs
  const navTabs: ScrollableTabItem[] = [
    {
      id: "all",
      label: "جميع الاختبارات",
      icon: <Layers className="w-4 h-4" />,
      badge: quizzes.length,
    },
    {
      id: "quizzes",
      label: "كويزات تدريبية",
      icon: <FileQuestion className="w-4 h-4" />,
      badge: quizzes.filter((q) => !q.isPastExam).length,
    },
    {
      id: "past_exams",
      label: "امتحانات سابقة محلولة",
      icon: <FileText className="w-4 h-4" />,
      badge: quizzes.filter((q) => q.isPastExam).length,
    },
    {
      id: "mistakes",
      label: "مراجعة أخطائي",
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      badge: mistakeQuestionsList.length,
      badgeColor: mistakeQuestionsList.length > 0 ? "bg-rose-500 text-white" : undefined,
    },
    {
      id: "bookmarks",
      label: "المحفوظات",
      icon: <Bookmark className="w-4 h-4 text-amber-400" />,
      badge: bookmarkedExamIds.size + bookmarkedQuestionIds.size,
    },
    {
      id: "history",
      label: "سجل محاولاتي",
      icon: <TrendingUp className="w-4 h-4" />,
      badge: submissionsHistory.length,
    },
  ];

  // ----------------------------------------------------
  // RENDER: ACTIVE QUIZ TAKING / RESULT VIEW
  // ----------------------------------------------------
  if (selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestionIndex];
    const answeredCount = Object.keys(userAnswers).length;
    const progressPercent = Math.round(
      ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100,
    );
    const isWarningTime = timeLeftSeconds > 0 && timeLeftSeconds <= 120;

    return (
      <div className="space-y-6" id="exam-quiz-active-runner">
        {/* Top Quiz Header Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {selectedQuiz.courseCode}
              </span>
              <span className="text-xs text-slate-400">
                {selectedQuiz.term || "اختبار تقييمي"} • {selectedQuiz.questions.length} أسئلة
              </span>
              {selectedQuiz.isPastExam && (
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-300">
                  امتحان سابق {selectedQuiz.year}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {selectedQuiz.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">الموضوع: {selectedQuiz.topic}</p>
          </div>

          {/* Timer & Actions */}
          <div className="flex items-center gap-3">
            {!isQuizSubmitted && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold transition-colors ${
                  isWarningTime
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                    : "bg-slate-800 text-emerald-400 border border-slate-700"
                }`}
                role="timer"
                aria-live="polite"
              >
                <Clock className="w-5 h-5 text-current" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            )}

            {!isQuizSubmitted && (
              <button
                onClick={() => setIsReviewDrawerOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ListOrdered className="w-4 h-4 text-emerald-400" />
                <span>
                  مراجعة ({answeredCount}/{selectedQuiz.questions.length})
                </span>
              </button>
            )}

            <button
              onClick={() => {
                if (!isQuizSubmitted && Object.keys(userAnswers).length > 0) {
                  if (
                    !window.confirm(
                      "هل تريد مغادرة الاختبار الحالي؟ سيتم فقدان إجاباتك غير المحفوظة.",
                    )
                  )
                    return;
                }
                setSelectedQuiz(null);
                setIsQuizSubmitted(false);
                setSubmissionResult(null);
              }}
              className="px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              خروج
            </button>
          </div>
        </div>

        {/* QUIZ SUBMISSION RESULTS REPORT VIEW */}
        {isQuizSubmitted && submissionResult ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Score Banner */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border ${
                submissionResult.passed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      submissionResult.passed
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                    }`}
                  >
                    {submissionResult.passed ? (
                      <Award className="w-8 h-8" />
                    ) : (
                      <AlertCircle className="w-8 h-8" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {submissionResult.passed
                        ? "أحسنت! لقد اجتزت الاختبار بنجاح"
                        : "محاولة جيدة! راجع الأخطاء لتحسين مستواك"}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      حصلت على {submissionResult.score} من إجمالي {submissionResult.totalQuestions}{" "}
                      إجابات صحيحة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:border-r sm:pr-6 sm:border-slate-200 dark:sm:border-slate-700">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {submissionResult.percentage}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      النسبة المئوية
                    </div>
                  </div>
                  {submissionResult.pointsEarned && (
                    <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <div className="text-xl font-bold">+{submissionResult.pointsEarned}</div>
                      <div className="text-xs font-medium">نقاط مضافة</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Study Loop Connector */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleStartQuiz(selectedQuiz)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    إعادة الاختبار مرة أخرى
                  </button>

                  <button
                    onClick={() => {
                      setSelectedQuiz(null);
                      setIsQuizSubmitted(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    العودة لقائمة الاختبارات
                  </button>
                </div>

                {/* STUDY LOOP CALL TO ACTION */}
                {onStartPomodoroStudy && (
                  <button
                    onClick={() =>
                      onStartPomodoroStudy(
                        selectedQuiz.courseCode,
                        `مراجعة أخطاء ومفاهيم ${selectedQuiz.courseCode}`,
                      )
                    }
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-slate-950" />
                    ذاكر مقرر {selectedQuiz.courseCode} الآن مع بومودورو
                  </button>
                )}
              </div>
            </div>

            {/* Detailed Question by Question Solution Breakdown */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                مراجعة الإجابات والحلول النموذجية مع الشرح الهندسي
              </h4>

              <div className="space-y-4">
                {selectedQuiz.questions.map((q, idx) => {
                  const userAnsIdx = userAnswers[q.id];
                  const isCorrect = userAnsIdx === q.correctIndex;
                  const isUnanswered = userAnsIdx === undefined;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                        isCorrect
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                          : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {idx + 1}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : isUnanswered
                                  ? "bg-amber-500 text-white"
                                  : "bg-rose-500 text-white"
                            }`}
                          >
                            {isCorrect
                              ? "إجابة صحيحة"
                              : isUnanswered
                                ? "لم يتم الإجابة"
                                : "إجابة خاطئة"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBookmarkQuestion(q.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              bookmarkedQuestionIds.has(q.id)
                                ? "text-amber-500 bg-amber-500/10"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            }`}
                            title={
                              bookmarkedQuestionIds.has(q.id) ? "إلغاء حفظ السؤال" : "حفظ السؤال"
                            }
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>

                          <button
                            onClick={() =>
                              handleRequestAiExplanation(q, userAnsIdx, selectedQuiz.courseCode)
                            }
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-500/20"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            طلب شرح المسألة
                          </button>
                        </div>
                      </div>

                      <p className="text-base font-semibold text-slate-900 dark:text-white mb-4 leading-relaxed">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                        {q.options.map((opt, optIdx) => {
                          const isThisCorrect = optIdx === q.correctIndex;
                          const isThisUserSelected = optIdx === userAnsIdx;

                          let optionClass =
                            "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300";
                          if (isThisCorrect) {
                            optionClass =
                              "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/30";
                          } else if (isThisUserSelected && !isThisCorrect) {
                            optionClass =
                              "bg-rose-500/10 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500/30";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-sm flex items-center justify-between ${optionClass}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center border border-current">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              {isThisUserSelected && !isThisCorrect && (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BookOpenCheck className="w-4 h-4 text-emerald-500" />
                            الشرح والتفسير العلمي النموذجي:
                          </div>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE QUESTION CARD & NAVIGATION PALETTE */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Question Display Area */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                {/* Progress and Question Meta */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      السؤال {currentQuestionIndex + 1} من {selectedQuiz.questions.length}
                    </span>
                    {currentQ?.hint && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                        تلميح متاح
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBookmarkQuestion(currentQ.id)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        bookmarkedQuestionIds.has(currentQ.id)
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                      title="حفظ السؤال في المحفوظات"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">
                        {bookmarkedQuestionIds.has(currentQ.id) ? "محفوظ" : "حفظ"}
                      </span>
                    </button>

                    <button
                      onClick={() => handleToggleFlag(currentQ.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        flaggedQuestions.has(currentQ.id)
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flaggedQuestions.has(currentQ.id) ? "مُميّز للمراجعة" : "تمييز"}</span>
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Multiple Choice Options List */}
                <div className="space-y-3">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = userAnswers[currentQ.id] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between group ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 font-semibold"
                            : "bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-500 group-hover:text-white"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm sm:text-base">{opt}</span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Question Hint Accordion (Optional) */}
                {currentQ.hint && (
                  <details className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
                    <summary className="font-semibold cursor-pointer select-none">
                      💡 هل تحتاج تلميحاً هندسياً لحل هذه المسألة؟ (انقر للعرض)
                    </summary>
                    <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentQ.hint}
                    </p>
                  </details>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReviewDrawerOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      مراجعة قبل التسليم
                    </button>

                    {currentQuestionIndex < selectedQuiz.questions.length - 1 ? (
                      <button
                        onClick={() =>
                          setCurrentQuestionIndex((prev) =>
                            Math.min(selectedQuiz.questions.length - 1, prev + 1),
                          )
                        }
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors flex items-center gap-1.5"
                      >
                        التالي
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تسليم الاختبار النهائي
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Palette / Quick Nav */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-emerald-500" />
                    خريطة الأسئلة
                  </h4>
                  <span className="text-xs text-slate-500">
                    تم حل {answeredCount} من {selectedQuiz.questions.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Questions Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {selectedQuiz.questions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isFlagged = flaggedQuestions.has(q.id);

                    let buttonClass =
                      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                    if (isCurrent) {
                      buttonClass =
                        "bg-emerald-600 text-white font-bold ring-2 ring-emerald-500/40 border-emerald-600";
                    } else if (isFlagged) {
                      buttonClass = "bg-amber-500 text-white font-semibold border-amber-600";
                    } else if (isAnswered) {
                      buttonClass =
                        "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-semibold";
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-full aspect-square rounded-xl text-xs flex items-center justify-center border transition-all ${buttonClass}`}
                        title={`السؤال ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>السؤال الحالي / تم حله</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>مُميّز للمراجعة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span>لم يتم حله بعد</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmitQuiz}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
                >
                  تسليم الاختبار
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW BEFORE SUBMIT MODAL */}
        {isReviewDrawerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-emerald-500" />
                    مراجعة حالة الإجابات قبل التسليم
                  </h3>
                  <p className="text-xs text-slate-500">
                    أجبت على {answeredCount} من أصل {selectedQuiz.questions.length} أسئلة
                  </p>
                </div>
                <button
                  onClick={() => setIsReviewDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {answeredCount < selectedQuiz.questions.length && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    تنبيه: لديك {selectedQuiz.questions.length - answeredCount} أسئلة لم تُجب عليها
                    بعد.
                  </span>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {selectedQuiz.questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions.has(q.id);

                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setIsReviewDrawerOpen(false);
                      }}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                          {q.question}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isFlagged && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                            مُميّز
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAnswered
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isAnswered ? "تمت الإجابة" : "معلق"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setIsReviewDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  متابعة الحل
                </button>
                <button
                  onClick={submitQuizInternal}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  تأكيد تسليم الاختبار الآن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: QUIZ CATALOG / PAST EXAMS / MISTAKES / BOOKMARKS
  // ----------------------------------------------------
  return (
    <div className="space-y-6" id="exams-quizzes-hub">
      {/* Top Banner / Actions */}
      <div className="bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-emerald-200" />
            منصة بنك الاختبارات والامتحانات الهندسية الذكية
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            بنك الامتحانات والاختبارات القصيرة (Exams & Quizzes)
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            تدرب على نماذج امتحانات منتصف الفصل والنهائي لجميع مقررات الهندسة، واختبر مهاراتك مع
            الشرح النموذجي، وراجع أخطاءك، وذاكر نقاط ضعفك مباشرة عبر حلقة المذاكرة الذكية.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 shadow-md transition-colors flex items-center gap-2"
            >
              <BookOpenCheck className="w-4 h-4 text-emerald-600" />
              إنشاء اختبار تدريبي مخصص
            </button>

            {mistakeQuestionsList.length > 0 && (
              <button
                onClick={() => setActiveTab("mistakes")}
                className="px-4 py-2.5 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-white font-bold text-sm backdrop-blur-sm border border-rose-400/40 transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-200" />
                مراجعة {mistakeQuestionsList.length} أسئلة غير صحيحة
              </button>
            )}
          </div>
        </div>

        {/* Decorative Background Element */}
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Horizontal Sub-Navigation Bar with ScrollableTabs */}
      <div className="space-y-4">
        <ScrollableTabs
          tabs={navTabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
          ariaLabel="شريط تبويبات بنك الاختبارات"
        />

        {/* Filters Bar (Shown on All, Quizzes, Past Exams, Bookmarks) */}
        {activeTab !== "history" && activeTab !== "mistakes" && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث في الاختبارات، المواضيع، أو كود المادة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="all">كافة المقررات</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="all">كافة الصعوبات</option>
                <option value="easy">أساسي (Easy)</option>
                <option value="medium">متوسط (Medium)</option>
                <option value="hard">متقدم (Hard)</option>
              </select>

              <select
                value={selectedTermType}
                onChange={(e) => setSelectedTermType(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="all">كافة الأنواع</option>
                <option value="Midterm">منتصف الفصل (Midterm)</option>
                <option value="Final">النهائي (Final)</option>
                <option value="Quiz">كويز (Quiz)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. MISTAKES REVIEW VIEW (مراجعة أخطائي)               */}
      {/* ---------------------------------------------------- */}
      {activeTab === "mistakes" && (
        <div className="space-y-6">
          {/* Mistakes Header & Study Loop Actions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                سجل الأسئلة التي تحتاج إلى مراجعة وتثبيت ({mistakeQuestionsList.length})
              </h3>
              <p className="text-xs text-slate-500">
                هنا يتم تجميع الأسئلة التي تمت الإجابة عليها بشكل خاطئ في محاولاتك السابقة لتتمكن من
                إعادة حلها ومذاكرتها.
              </p>
            </div>

            {mistakeQuestionsList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleStartMistakesQuiz()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  إعادة حل جميع الأخطاء ({mistakeQuestionsList.length})
                </button>
              </div>
            )}
          </div>

          {mistakeQuestionsList.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                رائع جداً! لا توجد أسئلة غير صحيحة مسجلة حالياً
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                عند حل الاختبارات وظهور أي خطأ، سيتم إدراجه هنا تلقائياً لكي تتمكن من مراجعته
                وتثبيته.
              </p>
              <button
                onClick={() => setActiveTab("all")}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                تصفح بنك الاختبارات
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mistakeQuestionsList.map((item, _idx) => (
                <div
                  key={item.question.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        {item.courseCode}
                      </span>
                      <span className="text-xs text-slate-500 line-clamp-1">
                        من: {item.quizTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBookmarkQuestion(item.question.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          bookmarkedQuestionIds.has(item.question.id)
                            ? "text-amber-500 bg-amber-500/10"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                        title="حفظ السؤال"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        onClick={() =>
                          handleRequestAiExplanation(
                            item.question,
                            item.selectedIndex,
                            item.courseCode,
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-500/20"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        طلب شرح المسألة
                      </button>

                      {onStartPomodoroStudy && (
                        <button
                          onClick={() =>
                            onStartPomodoroStudy(
                              item.courseCode,
                              `مذاكرة مسألة: ${item.question.question.substring(0, 30)}...`,
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-500/20"
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          ذاكر بـ Pomodoro
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {item.question.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {item.question.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === item.question.correctIndex;
                      const isSelectedByUser = optIdx === item.selectedIndex;

                      let optClass =
                        "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
                      if (isCorrect) {
                        optClass =
                          "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold";
                      } else if (isSelectedByUser) {
                        optClass =
                          "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-bold";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${optClass}`}
                        >
                          <span>
                            {String.fromCharCode(65 + optIdx)}) {opt}
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          {isSelectedByUser && (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {item.question.explanation && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                      <strong>التفسير النموذجي: </strong>
                      {item.question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. BOOKMARKS VIEW (المحفوظات)                        */}
      {/* ---------------------------------------------------- */}
      {activeTab === "bookmarks" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" />
              الاختبارات والأسئلة المحفوظة للمراجعة
            </h3>
            <p className="text-xs text-slate-500">
              يمكنك الرجوع للاختبارات والأسئلة المميزة التي قمت بحفظها في أي وقت.
            </p>
          </div>

          {/* Bookmarked Exams Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              الامتحانات والاختبارات المحفوظة ({filteredQuizzes.length})
            </h4>

            {filteredQuizzes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">لا توجد اختبارات محفوظة حالياً.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {quiz.courseCode}
                        </span>
                        <button
                          onClick={(e) => handleToggleBookmarkExam(quiz.id, e)}
                          className="p-1.5 rounded-lg text-amber-500 bg-amber-500/10"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {quiz.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">الموضوع: {quiz.topic}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{quiz.questions.length} أسئلة</span>
                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm"
                      >
                        ابدأ الاختبار
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarked Questions List */}
          {bookmarkedQuestionsList.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                الأسئلة الفردية المحفوظة ({bookmarkedQuestionsList.length})
              </h4>
              <div className="space-y-3">
                {bookmarkedQuestionsList.map((item) => (
                  <div
                    key={item.question.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          {item.courseCode}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {item.question.question}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBookmarkQuestion(item.question.id)}
                      className="text-amber-500 p-1 shrink-0"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. SUBMISSIONS HISTORY VIEW                          */}
      {/* ---------------------------------------------------- */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            سجل محاولات الاختبارات والنتائج المحققة
          </h3>

          {submissionsHistory.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                مفيش محاولات مسجلة بعد
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                لما تجاوب على أي اختبار، هتظهر نتيجتك هنا عشان تقدر تراجع أداءك.
              </p>
              <button
                onClick={() => setActiveTab("all")}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                تصفح بنك الاختبارات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissionsHistory.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {sub.courseCode}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${sub.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}
                      >
                        {sub.passed ? "ناجح" : "يحتاج مراجعة"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {sub.quizTitle}
                    </h4>
                    <p className="text-xs text-slate-500">
                      الدرجة: {sub.score} / {sub.totalQuestions} ({sub.percentage}%) • +
                      {sub.pointsEarned} نقطة
                    </p>
                  </div>

                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {sub.percentage}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. MAIN EXAM CARDS CATALOG (All, Quizzes, Past Exams) */}
      {/* ---------------------------------------------------- */}
      {activeTab !== "mistakes" && activeTab !== "bookmarks" && activeTab !== "history" && (
        <div className="space-y-6">
          {filteredQuizzes.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <FileQuestion className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                لا توجد اختبارات مطابقة لبحثك
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                جرب تغيير خيارات التصفية أو اسم المادة، أو قم بتوليد اختبار جديد بالذكاء الاصطناعي.
              </p>
              <button
                onClick={() => {
                  setSelectedCourseFilter("all");
                  setSelectedDifficulty("all");
                  setSelectedTermType("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuizzes.map((quiz) => {
                const isBookmarked = bookmarkedExamIds.has(quiz.id);
                const difficultyBadge =
                  quiz.difficulty === "hard"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : quiz.difficulty === "medium"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

                const difficultyText =
                  quiz.difficulty === "hard"
                    ? "متقدم"
                    : quiz.difficulty === "medium"
                      ? "متوسط"
                      : "أساسي";

                return (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {quiz.courseCode}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyBadge}`}
                          >
                            {difficultyText}
                          </span>
                          {quiz.isPastExam && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              امتحان سابق {quiz.year}
                            </span>
                          )}

                          <button
                            onClick={(e) => handleToggleBookmarkExam(quiz.id, e)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isBookmarked
                                ? "text-amber-500 bg-amber-500/10"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            }`}
                            title={isBookmarked ? "إلغاء الحفظ" : "حفظ في المحفوظات"}
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {quiz.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        الموضوع: {quiz.topic}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          {quiz.durationMinutes} دقيقة
                        </span>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                          {quiz.questions.length} أسئلة
                        </span>
                      </div>

                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        ابدأ الاختبار
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI QUIZ GENERATOR MODAL */}
      {isAiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    إنشاء اختبار تدريبي مخصص
                  </h3>
                  <p className="text-xs text-slate-500">
                    اختر المقرر والوحدة لإنشاء بنك أسئلة تدريبي مع الحلول والخطوات النموذجية
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {aiError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {aiError}
              </div>
            )}

            <form onSubmit={handleGenerateAiQuiz} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المقرر الدراسي
                </label>
                <select
                  value={aiCourseCode}
                  onChange={(e) => setAiCourseCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الموضوع أو الوحدة المحددة (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: Karnaugh Maps، تحويل لابلاس، المؤشرات في C++..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    مستوى الصعوبة
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e: any) => setAiDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="easy">سهل (مفاهيم أساسية)</option>
                    <option value="medium">متوسط (تطبيقات وحسابات)</option>
                    <option value="hard">متقدم (مسائل مركبة)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    عدد الأسئلة
                  </label>
                  <select
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={3}>3 أسئلة سريعة</option>
                    <option value={4}>4 أسئلة نموذجية</option>
                    <option value={6}>6 أسئلة شاملة</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAiQuiz}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingAiQuiz ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      جاري إنشاء الاختبار...
                    </>
                  ) : (
                    <>
                      <BookOpenCheck className="w-4 h-4" />
                      إنشاء وبدء الاختبار
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI EXPLANATION MODAL */}
      {aiExplanationModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    الشرح والتفسير الهندسي للمسألة
                  </h3>
                  <p className="text-xs text-slate-500">مقرر {aiExplanationModal.courseCode}</p>
                </div>
              </div>
              <button
                onClick={() => setAiExplanationModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {aiExplanationModal.question && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                {aiExplanationModal.question.question}
              </div>
            )}

            <div className="min-h-[140px] max-h-72 overflow-y-auto pr-1 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {aiExplanationModal.loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">
                    جاري صياغة الشرح العلمي والخطوات التفصيلية...
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 whitespace-pre-wrap">
                  {aiExplanationModal.explanationText}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setAiExplanationModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                إغلاق
              </button>

              {onStartPomodoroStudy && aiExplanationModal.courseCode && (
                <button
                  onClick={() => {
                    const code = aiExplanationModal.courseCode!;
                    setAiExplanationModal((prev) => ({ ...prev, isOpen: false }));
                    onStartPomodoroStudy(code, `مذاكرة موضوع السؤال في ${code}`);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  بدء جلسة تركيز بومودورو
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
