import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  ListTodo,
  Plus,
  Trash2,
  Coffee,
  Headphones,
  ArrowRight,
} from "lucide-react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Course, UserProfile, PomodoroSession } from "../../types";

interface PomodoroFocusTimerProps {
  courses: Course[];
  currentUser: UserProfile;
  onUpdatePoints?: (points: number) => void;
  initialCourseCode?: string;
  initialTask?: string;
  onBackToExams?: () => void;
}

export const PomodoroFocusTimer: React.FC<PomodoroFocusTimerProps> = ({
  courses,
  currentUser,
  onUpdatePoints,
  initialCourseCode,
  initialTask,
  onBackToExams,
}) => {
  // Modes: focus_25, focus_50, short_break (5m), long_break (15m), custom
  const [mode, setMode] = useState<
    "focus_25" | "focus_50" | "short_break" | "long_break" | "custom"
  >("focus_25");
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);

  // Selected course & task
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    initialCourseCode || courses[0]?.code || "ENG X13",
  );
  const [taskName, setTaskName] = useState<string>(initialTask || "مذاكرة ومراجعة مركزة");
  const [tasksList, setTasksList] = useState<
    Array<{ id: string; text: string; courseCode?: string; completed: boolean }>
  >([
    {
      id: "t-1",
      text: "مراجعة خريطة كارنوف وشروط Don't Care",
      courseCode: "AIE 103",
      completed: true,
    },
    { id: "t-2", text: "حل مسائل تحويلات لابلاس العكسية", courseCode: "ENG X13", completed: false },
    {
      id: "t-3",
      text: "تطبيق برمجي لمصفوفات C++ الديناميكية",
      courseCode: "AIE 101",
      completed: false,
    },
  ]);
  const [newTaskInput, setNewTaskInput] = useState<string>("");

  // Daily & Weekly statistics
  const [todayCompletedSessions, setTodayCompletedSessions] = useState<number>(0);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState<number>(0);
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [weeklySessionsCount, setWeeklySessionsCount] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<PomodoroSession[]>([]);
  const [_isLoadingSessions, _setIsLoadingSessions] = useState<boolean>(true);

  // Fetch real sessions from the server on mount
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    _setIsLoadingSessions(true);
    fetch("/api/study/pomodoro/sessions", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.resolve({ sessions: [] })))
      .then((data) => {
        if (cancelled) return;
        const sessions: PomodoroSession[] = Array.isArray(data.sessions) ? data.sessions : [];
        setRecentLogs(sessions);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySessions = sessions.filter((s) => new Date(s.completedAt) >= today);
        setTodayCompletedSessions(todaySessions.length);
        setTodayFocusMinutes(todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0));
        const uniqueDays = new Set<string>();
        sessions.forEach((s) => uniqueDays.add(new Date(s.completedAt).toDateString()));
        setDailyStreak(uniqueDays.size);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekSessions = sessions.filter((s) => new Date(s.completedAt) >= weekAgo);
        setWeeklySessionsCount(weekSessions.length);
      })
      .catch(() => {
        if (!cancelled) _setIsLoadingSessions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Audio / Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ambientSound, setAmbientSound] = useState<"none" | "whitenoise" | "rain">("none");
  const [ambientVolume, _setAmbientVolume] = useState<number>(0.2);

  // Completion modal / toast state
  const [showCompletionNotice, setShowCompletionNotice] = useState<{
    isOpen: boolean;
    mode: "focus" | "break";
    minutes: number;
    courseCode: string;
    points: number;
  } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<{ source: AudioNode; gain: GainNode } | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synchronize when initialCourseCode or initialTask changes
  useEffect(() => {
    if (initialCourseCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCourseCode(initialCourseCode);
    }
    if (initialTask) {
      setTaskName(initialTask);
    }
  }, [initialCourseCode, initialTask]);

  // Top studied course calculation
  const topStudiedCourse = useMemo(() => {
    const courseMinutesMap: Record<string, number> = {};
    recentLogs.forEach((log) => {
      const code = log.courseCode || "عام";
      courseMinutesMap[code] = (courseMinutesMap[code] || 0) + log.durationMinutes;
    });

    let topCode = selectedCourseCode;
    let maxMins = 0;
    Object.entries(courseMinutesMap).forEach(([code, mins]) => {
      if (mins > maxMins) {
        maxMins = mins;
        topCode = code;
      }
    });

    return { code: topCode, minutes: maxMins || todayFocusMinutes };
  }, [recentLogs, selectedCourseCode, todayFocusMinutes]);

  // Web Audio Synth Bell for Timer Completion
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Create a pleasant harmonic twin-bell chime (528Hz Solfeggio & 1056Hz overtone)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(528, now);
      osc1.frequency.exponentialRampToValueAtTime(1056, now + 0.8);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1056, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    } catch {
      // AudioContext fallback
    }
  };

  // Ambient sound synthesizer
  useEffect(() => {
    if (ambientSound === "none" || !isActive) {
      if (ambientNodeRef.current) {
        try {
          ambientNodeRef.current.gain.gain.setValueAtTime(0, 0);
          (ambientNodeRef.current.source as any).stop?.();
        } catch {
          // ignore audio cleanup errors
        }
        ambientNodeRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (ambientSound === "rain") {
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else {
          data[i] = (lastOut * 0.9 + white * 0.1) * 1.5;
          lastOut = white;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = ambientSound === "rain" ? "lowpass" : "bandpass";
      filter.frequency.setValueAtTime(ambientSound === "rain" ? 800 : 1200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(ambientVolume, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      ambientNodeRef.current = { source: noiseSource, gain };
    } catch {
      // ignore audio playback errors
    }

    return () => {
      if (ambientNodeRef.current) {
        try {
          (ambientNodeRef.current.source as any).stop?.();
        } catch {
          // ignore audio cleanup errors
        }
        ambientNodeRef.current = null;
      }
    };
  }, [ambientSound, isActive, ambientVolume]);

  // Mode Selection Helper
  const switchMode = (
    newMode: "focus_25" | "focus_50" | "short_break" | "long_break" | "custom",
    customMins?: number,
  ) => {
    setIsActive(false);
    setMode(newMode);

    let mins = 25;
    if (newMode === "focus_25") mins = 25;
    else if (newMode === "focus_50") mins = 50;
    else if (newMode === "short_break") mins = 5;
    else if (newMode === "long_break") mins = 15;
    else if (newMode === "custom") mins = customMins || durationMinutes || 30;

    setDurationMinutes(mins);
    setTimeLeftSeconds(mins * 60);
  };

  // Adjust duration by step (+5 / -5 min)
  const adjustCustomMinutes = (delta: number) => {
    const newMins = Math.max(5, Math.min(120, durationMinutes + delta));
    setDurationMinutes(newMins);
    if (!isActive) {
      setTimeLeftSeconds(newMins * 60);
      setMode("custom");
    }
  };

  // Timer Tick Hook
  useEffect(() => {
    if (!isActive) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          // eslint-disable-next-line react-hooks/immutability
          handleCompleteSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, mode, durationMinutes, taskName, selectedCourseCode]);

  // Handle Session Completion
  const handleCompleteSession = async () => {
    setIsActive(false);
    playChime();

    const isFocus = mode === "focus_25" || mode === "focus_50" || mode === "custom";

    if (isFocus) {
      const addedMinutes = durationMinutes;
      setTodayCompletedSessions((prev) => prev + 1);
      setTodayFocusMinutes((prev) => prev + addedMinutes);
      setWeeklySessionsCount((prev) => prev + 1);

      const pointsEarned = addedMinutes >= 20 ? 5 : 2;

      const newSessionLog: PomodoroSession = {
        id: `pomo-${Date.now()}`,
        userId: currentUser.id,
        courseCode: selectedCourseCode,
        taskName: taskName || "جلسة تركيز هندسي",
        durationMinutes: addedMinutes,
        mode: "focus",
        completedAt: new Date().toISOString(),
        pointsAwarded: pointsEarned,
      };

      setRecentLogs((prev) => [newSessionLog, ...prev]);

      if (onUpdatePoints) {
        onUpdatePoints(pointsEarned);
      }

      // Log to backend safely
      try {
        await fetch("/api/study/pomodoro/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseCode: selectedCourseCode,
            taskName,
            durationMinutes: addedMinutes,
            mode: "focus",
          }),
        });
      } catch {
        // ignore session completion errors
      }

      setShowCompletionNotice({
        isOpen: true,
        mode: "focus",
        minutes: addedMinutes,
        courseCode: selectedCourseCode,
        points: pointsEarned,
      });
    } else {
      setShowCompletionNotice({
        isOpen: true,
        mode: "break",
        minutes: durationMinutes,
        courseCode: selectedCourseCode,
        points: 0,
      });
    }
  };

  // Toggle Play / Pause
  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeftSeconds(durationMinutes * 60);
  };

  // Task list management
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      text: newTaskInput.trim(),
      courseCode: selectedCourseCode,
      completed: false,
    };
    setTasksList((prev) => [...prev, newTask]);
    setNewTaskInput("");
  };

  const handleToggleTask = (id: string) => {
    setTasksList((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasksList((prev) => prev.filter((t) => t.id !== id));
  };

  // Math for circular progress SVG
  const totalSeconds = durationMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - timeLeftSeconds) / totalSeconds : 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isBreak = mode === "short_break" || mode === "long_break";

  const modeTheme = isBreak
    ? mode === "short_break"
      ? {
          primary: "text-teal-500",
          bg: "bg-teal-500/10",
          stroke: "#14b8a6",
          name: "استراحة قصيرة (Short Break)",
        }
      : {
          primary: "text-indigo-500",
          bg: "bg-indigo-500/10",
          stroke: "#6366f1",
          name: "استراحة طويلة (Long Break)",
        }
    : mode === "focus_50"
      ? {
          primary: "text-purple-500",
          bg: "bg-purple-500/10",
          stroke: "#a855f7",
          name: "تركيز عميق (Deep Focus - 50m)",
        }
      : {
          primary: "text-emerald-500",
          bg: "bg-emerald-500/10",
          stroke: "#10b981",
          name: "جلسة تركيز هندسي (Focus)",
        };

  const currentMatchedCourse = courses.find((c) => c.code === selectedCourseCode);

  return (
    <div className="space-y-6" id="pomodoro-focus-engine">
      {/* Top Breadcrumb / Return to Exams (Study Loop context) */}
      {initialCourseCode && onBackToExams && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <Flame className="w-4 h-4 text-emerald-600" />
            <span>
              حلقة المذاكرة: تم ضبط المؤقت لمذاكرة مقرر {selectedCourseCode} بناءً على مراجعة
              الاختبار.
            </span>
          </div>
          <button
            onClick={onBackToExams}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 transition-colors border border-emerald-500/30"
          >
            العودة للاختبارات
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      )}

      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {todayCompletedSessions}
            </div>
            <div className="text-xs text-slate-500">
              جلسات اليوم ({weeklySessionsCount} أسبوعياً)
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {todayFocusMinutes} دقيقة
            </div>
            <div className="text-xs text-slate-500">إجمالي التركيز اليوم</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {dailyStreak} أيام
            </div>
            <div className="text-xs text-slate-500">سلسلة الالتزام (Streak)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {topStudiedCourse.code}
            </div>
            <div className="text-xs text-slate-500">أكثر مادة تم التركيز عليها</div>
          </div>
        </div>
      </div>

      {/* Main Focus Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Control Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between space-y-6">
          {/* Mode Selector Presets */}
          <div className="inline-flex flex-wrap items-center justify-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-1">
            <button
              onClick={() => switchMode("focus_25")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                mode === "focus_25"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Flame className="w-4 h-4 text-amber-300" />
              تركيز 25 دقيقة
            </button>

            <button
              onClick={() => switchMode("focus_50")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                mode === "focus_50"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-purple-300" />
              جلسة تركيز (50 دقيقة)
            </button>

            <button
              onClick={() => switchMode("short_break")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                mode === "short_break"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Coffee className="w-4 h-4 text-teal-300" />
              استراحة قصيرة (5 دقائق)
            </button>

            <button
              onClick={() => switchMode("long_break")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                mode === "long_break"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-300" />
              استراحة ممتدة (15 دقيقة)
            </button>
          </div>

          {/* Active Target Task & Course Selector */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedCourseCode}
                onChange={(e) => setSelectedCourseCode(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shrink-0"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} — {c.title.split("(")[0]}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="عنوان المهمة التي تركز عليها..."
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {currentMatchedCourse && (
              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>المقرر: {currentMatchedCourse.title}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  +5 نقاط عند إتمام 25 دقيقة
                </span>
              </div>
            )}
          </div>

          {/* Circular SVG Timer */}
          <div className="relative flex items-center justify-center my-2">
            <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
              {/* Background track circle */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Progress dynamic animated circle */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke={modeTheme.stroke}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
              <span className="font-mono text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatTimer(timeLeftSeconds)}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {modeTheme.name}
              </span>
              {/* Duration adjuster steppers */}
              {!isActive && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => adjustCustomMinutes(-5)}
                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center"
                    title="إنقاص 5 دقائق"
                  >
                    -5
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">{durationMinutes} د</span>
                  <button
                    onClick={() => adjustCustomMinutes(5)}
                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center"
                    title="زيادة 5 دقائق"
                  >
                    +5
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="إعادة ضبط العداد"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTimer}
              className={`px-8 py-4 rounded-2xl font-bold text-base text-white shadow-xl transition-all flex items-center gap-2.5 ${
                isActive
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5" />
                  إيقاف مؤقت
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {isBreak ? "بدء الاستراحة" : "بدء جلسة التركيز"}
                </>
              )}
            </button>

            <button
              onClick={handleCompleteSession}
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="تخطي وإنهاء الجلسة"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Ambient Noise & Sounds Switcher */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-500" />
              <span>أصوات التركيز المحيطية:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAmbientSound("none")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    ambientSound === "none"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  صامت
                </button>
                <button
                  onClick={() => setAmbientSound("rain")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    ambientSound === "rain"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  صوت المطر 🌧️
                </button>
                <button
                  onClick={() => setAmbientSound("whitenoise")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    ambientSound === "whitenoise"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  ضوضاء بيضاء ☕
                </button>
              </div>
            </div>

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span>تنبيه نهاية الوقت</span>
            </button>
          </div>
        </div>

        {/* Side Panel: Study Task Checklists & Recent Sessions */}
        <div className="space-y-6">
          {/* Study Checklist Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-500" />
                قائمة مهام جلسة التركيز
              </h3>
              <span className="text-xs text-slate-500">
                {tasksList.filter((t) => t.completed).length} / {tasksList.length} مكتمل
              </span>
            </div>

            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                placeholder="أضف مهمة دراسية جديدة..."
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tasksList.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span
                      className={`${
                        task.completed
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-700 dark:text-slate-300 font-medium"
                      }`}
                    >
                      {task.text}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Completed Sessions Log */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              سجل جلسات التركيز الأخيرة
            </h3>

            <div className="space-y-2.5">
              {recentLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                        {log.courseCode}
                      </span>
                      <span className="line-clamp-1">{log.taskName}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      {log.durationMinutes} دقيقة تركيز •{" "}
                      {new Date(log.completedAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    +{log.pointsAwarded} نقطة
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Session Completion Celebration Modal */}
      {showCompletionNotice && showCompletionNotice.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {showCompletionNotice.mode === "focus"
                  ? "🎉 أحسنت صنعاً! أتممت جلسة التركيز"
                  : "☕ انتهت الاستراحة! هل أنت جاهز؟"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {showCompletionNotice.mode === "focus"
                  ? `أكملت ${showCompletionNotice.minutes} دقيقة تركيز بنجاح في مادة ${showCompletionNotice.courseCode} وحصلت على +${showCompletionNotice.points} نقاط!`
                  : "استعد لبدء جلسة تركيز جديدة ومواصلة التقدم الأكاديمي."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {showCompletionNotice.mode === "focus" ? (
                <button
                  onClick={() => {
                    setShowCompletionNotice(null);
                    switchMode("short_break");
                  }}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Coffee className="w-4 h-4" />
                  بدء استراحة قصيرة (5 دقائق)
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowCompletionNotice(null);
                    switchMode("focus_25");
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  بدء جلسة تركيز جديدة (25 دقيقة)
                </button>
              )}

              <button
                onClick={() => setShowCompletionNotice(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
