import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, FileText, MessageSquare, AlertCircle, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Course, StudyFile, DiscussionThread, Announcement } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  files: StudyFile[];
  discussions: DiscussionThread[];
  announcements: Announcement[];
  onSelectCourse: (courseId: string) => void;
  onOpenFile: (fileId: string) => void;
  onSelectDiscussion: (discId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  courses,
  files,
  discussions,
  announcements,
  onSelectCourse,
  onOpenFile,
  onSelectDiscussion
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          /* handled externally or here */
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredCourses = q
    ? courses.filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
    : courses.slice(0, 3);

  const filteredFiles = q
    ? files.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          (f.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    : files.slice(0, 3);

  const filteredDiscussions = q
    ? discussions.filter(
        (d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
      )
    : discussions.slice(0, 2);

  const totalResults = filteredCourses.length + filteredFiles.length + filteredDiscussions.length;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Input Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-indigo-500 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, past exams, summaries, discussions, or tags..."
              className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results Container */}
          <div className="max-h-96 overflow-y-auto p-3 space-y-4">
            {totalResults === 0 ? (
              <div className="py-10 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching items found</p>
                <p className="text-xs text-slate-400">Try searching for CS201, PID Tuning, Solved Exams, or AVL Trees</p>
              </div>
            ) : (
              <>
                {/* Courses Section */}
                {filteredCourses.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Courses ({filteredCourses.length})
                    </div>
                    <div className="space-y-1">
                      {filteredCourses.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectCourse(c.id);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {c.code.slice(0, 3)}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                                {c.code}: {c.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {c.instructor} • {c.scheduleDayTime}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Section */}
                {filteredFiles.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Study Files & Past Papers ({filteredFiles.length})
                    </div>
                    <div className="space-y-1">
                      {filteredFiles.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            onOpenFile(f.id);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors truncate">
                                {f.title}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="uppercase font-semibold text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  {f.fileType}
                                </span>
                                <span>{f.fileSize}</span>
                                <span>• {f.downloadCount} downloads</span>
                              </div>
                            </div>
                          </div>
                          <CornerDownLeft className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q&A Discussions Section */}
                {filteredDiscussions.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Discussions & Q&A ({filteredDiscussions.length})
                    </div>
                    <div className="space-y-1">
                      {filteredDiscussions.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            onSelectDiscussion(d.id);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors truncate">
                                {d.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                by {d.authorName} • {d.upvotes} upvotes • {d.replyCount} answers
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>Navigation: <kbd className="px-1 bg-slate-200 dark:bg-slate-800 rounded">↑↓</kbd> to move</span>
              <span>Selection: <kbd className="px-1 bg-slate-200 dark:bg-slate-800 rounded">↵</kbd> to open</span>
            </div>
            <span>EngHub Search Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
