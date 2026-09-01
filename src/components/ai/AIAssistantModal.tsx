import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Course } from '../../types';
import { Bot, X, Send, User, CheckCircle2, HelpCircle, Loader2, BookOpenCheck } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  activeCourse?: Course;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  courses,
  activeCourse
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourse ? activeCourse.id : 'all');
  const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: `أهلاً بك! أنا المساعد الأكاديمي لمقررات الهندسة. يمكنك طرح أي استفسار حول المفاهيم الهندسية والمسائل الرياضية والبرمجية، أو إنشاء اختبارات تدريبية تقييمية.`,
      time: 'الآن'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Quiz mode state
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userMsg = inputQuery;
    setInputQuery('');
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: timeStr }]);
    setLoading(true);

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);

    // Prepare placeholder AI message for streaming
    setMessages((prev) => [...prev, { sender: 'ai', text: '', time: timeStr }]);

    let stallTimeout: any = null;

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          prompt: userMsg,
          query: userMsg,
          courseCode: selectedCourse ? selectedCourse.code : undefined,
          courseTitle: selectedCourse ? selectedCourse.title : undefined,
          syllabus: selectedCourse ? selectedCourse.description : undefined,
          fileContext: selectedCourse ? `Files in ${selectedCourse.code}: ${selectedCourse.title}` : undefined,
          isStream: true
        })
      });

      if (!res.ok) {
        let errData: any = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData.error || errData.details || `خطأ في الخادم (${res.status})`);
      }

      if (res.headers.get('content-type')?.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        const resetStallTimer = () => {
          if (stallTimeout) clearTimeout(stallTimeout);
          stallTimeout = setTimeout(() => {
            console.warn('AI stream stalled for 7s');
          }, 7000);
        };

        resetStallTimer();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          resetStallTimer();

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMessages((prev) => {
                    const newArr = [...prev];
                    newArr[newArr.length - 1] = {
                      sender: 'ai',
                      text: accumulated,
                      time: timeStr
                    };
                    return newArr;
                  });
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Ignore chunk parse error
              }
            }
          }
        }
        if (stallTimeout) clearTimeout(stallTimeout);
      } else {
        const data = await res.json();
        const replyText = data.reply || data.answer || 'إليك الشرح والتوضيح المطلوب للمسألة الهندسية.';
        setMessages((prev) => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = {
            sender: 'ai',
            text: replyText,
            time: timeStr
          };
          return newArr;
        });
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      if (stallTimeout) clearTimeout(stallTimeout);
      setMessages((prev) => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = {
          sender: 'ai',
          text: err?.message || 'تعذر الاتصال بالمساعد الذكي للمادة. يرجى التأكد من مفتاح API الخاص بالخدمة.',
          time: timeStr
        };
        return newArr;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setActiveQuiz(null);
    setQuizScore(null);
    setUserAnswers({});

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: selectedCourse ? selectedCourse.code : 'AIE 111',
          courseTitle: selectedCourse ? selectedCourse.title : 'أسس البرمجة الهيكلية',
          topic: selectedCourse ? selectedCourse.title : 'الهندسة العامة'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `فشل توليد الاختبار (${res.status})`);
      }

      const data = await res.json();
      const quizList = data.quiz || data.questions;
      if (Array.isArray(quizList) && quizList.length > 0) {
        setActiveQuiz(quizList);
      } else {
        throw new Error('لم يتم إرجاع أسئلة اختبار');
      }
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      alert(err.message || 'فشل توليد الاختبار التجريبي.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGradeQuiz = () => {
    if (!activeQuiz) return;
    let score = 0;
    activeQuiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
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
        className="w-full max-w-3xl h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-right"
      >
        {/* Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-white">المساعد الأكاديمي للمقررات الهندسية</h2>
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    نشط الآن
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300">مساعد دراسي متخصص ومولد اختبارات تقييمية</p>
              </div>
            </div>

            <button onClick={onClose} className="sm:hidden p-1.5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Context Selector */}
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none max-w-[140px] sm:max-w-[200px] truncate"
            >
              <option value="all">جميع المقررات الكلية</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all shrink-0 active:scale-[0.98]"
            >
              {isGeneratingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpenCheck className="w-3.5 h-3.5" />}
              <span>إنشاء اختبار تدريبي</span>
            </button>

            <button onClick={onClose} className="hidden sm:block p-1.5 text-slate-400 hover:text-white shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Quiz View or Chat Feed */}
        {activeQuiz ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  اختبار تدريبي ذكي
                </h3>
                <p className="text-xs text-slate-400">اختبر مدى استيعابك للمادة واستعد للامتحانات الفردية</p>
              </div>

              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-bold text-amber-500 hover:underline"
              >
                العودة للدردشة والشرح
              </button>
            </div>

            <div className="space-y-4">
              {activeQuiz.map((q, qIdx) => (
                <div key={qIdx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    س{qIdx + 1}: {q.question}
                  </p>
                  <div className="space-y-2">
                    {(q.options || []).map((opt: string, optIdx: number) => {
                      const isSelected = userAnswers[qIdx] === optIdx;
                      const isCorrect = quizScore !== null && q.correctIndex === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs text-right transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-bold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                          } ${isCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : ''}`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                        </button>
                      );
                    })}
                  </div>
                  {quizScore !== null && (
                    <p className="text-[11px] text-slate-500 italic mt-1 font-sans">
                      التفسير والشرح: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              {quizScore !== null ? (
                <div className="text-sm font-bold text-amber-500">
                  نتيجة الاختبار: {quizScore} / {activeQuiz.length} ({( (quizScore / activeQuiz.length) * 100 ).toFixed(0)}%)
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={handleGradeQuiz}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
              >
                اعتماد وتصحيح الاختبار
              </button>
            </div>
          </div>
        ) : (
          /* Chat Feed */
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'mr-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-amber-600 text-white font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-sans leading-relaxed'
                  }`}
                >
                  {msg.text ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 italic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      <span>جاري التفكير وصياغة الشرح...</span>
                    </div>
                  )}
                  <span className="text-[10px] opacity-60 block text-left">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        {!activeQuiz && (
          <form
            onSubmit={handleSendQuery}
            className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="اطرح سؤالاً عن المؤشرات (Pointers)، تحويلات لابلاس، أو أي مفهوم هندسي..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
