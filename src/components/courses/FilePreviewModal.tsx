import {
  X,
  Download,
  Star,
  Bookmark,
  ShieldCheck,
  Award,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";
import { StudyFile, Comment } from "../../types";
import { parseApiError } from "../../utils/errorUtils";

interface FilePreviewModalProps {
  file: StudyFile | null;
  onClose: () => void;
  onRateFile: (fileId: string, rating: number) => void;
  onToggleBookmark: (fileId: string) => void;
  comments: Comment[];
  onAddComment: (fileId: string, text: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onRateFile,
  onToggleBookmark,
  comments,
  onAddComment,
}) => {
  const [commentInput, setCommentInput] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!file) return null;

  const fileComments = comments.filter((c) => c.targetId === file.id);

  const isOfficial = file.verificationStatus === "official";
  const isVerified = file.verificationStatus === "verified";
  const isPending = file.moderationStatus === "pending" || file.status === "pending";

  const handleDownloadSignedUrl = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/files/download-url?fileId=${file.id}`);
      const data = await res.json();
      if (!res.ok) {
        setDownloadError(parseApiError(data, "تعذر تحميل الملف."));
        return;
      }
      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank");
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Download error:", err);
      setDownloadError("خطأ أثناء إنشاء رابط التحميل الآمن.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(file.id, commentInput);
    setCommentInput("");
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
        className="w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs uppercase flex items-center justify-center shrink-0 border border-orange-500/20">
                {file.fileType}
              </div>
              <div className="truncate space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {isOfficial && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>رسمي معتمد</span>
                    </span>
                  )}
                  {isVerified && !isOfficial && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>مرجع موثق</span>
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>قيد المراجعة</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium dir-ltr">
                    • {file.fileSize}
                  </span>
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {file.title}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onToggleBookmark(file.id)}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                file.isBookmarked
                  ? "border-orange-500 bg-orange-500/10 text-orange-500"
                  : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600"
              }`}
              title="حفظ في المفضلة"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadSignedUrl}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex-1 sm:flex-initial justify-center"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloading
                  ? "جاري التحقق..."
                  : downloadSuccess
                    ? "تم التحميل!"
                    : "تحميل المرجع (Signed)"}
              </span>
            </button>

            <button
              onClick={onClose}
              className="hidden sm:block p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Modal Body: Document Viewer & Comments */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-y-auto lg:overflow-hidden">
          {/* Main Document Content Viewer */}
          <div className="lg:col-span-2 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-800 space-y-6">
            {/* File Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2.5">
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {file.description}
              </p>
              <div className="flex flex-wrap items-center justify-between text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] gap-2">
                <span>
                  الرافع:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {file.uploaderName}
                  </strong>{" "}
                  ({file.uploaderDepartment})
                </span>
                <div className="flex items-center gap-3">
                  <span>تاريخ النشر: {file.uploadDate}</span>
                  {file.academicYear && <span>السنة: {file.academicYear}</span>}
                  {file.semester && <span>الفصل: {file.semester}</span>}
                </div>
              </div>
            </div>

            {/* In-Browser Document Preview Container */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner space-y-4">
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-3 border-b border-slate-800 font-sans">
                <span>EngHub Document Rendering Engine</span>
                <span>Page 1 of 1</span>
              </div>

              <pre className="whitespace-pre-wrap font-mono text-xs">
                  {file.previewContent ||
                    `// ${file.title || "Untitled"}\n// Standard study resource file: ${(file.fileType || "FILE").toUpperCase()} format.\n// Verified Academic Resource for Engineering Students.\n// Download the original document securely using the signed download button.`}
              </pre>
            </div>

            {/* Star Rating Bar */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  تقييم جودة المرجع
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  ساعد زملاءك في إيجاد أفضل الملخصات والحلول الموثوقة.
                </p>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRateFile(file.id, star)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                    title={`${star} نجوم`}
                  >
                    <Star
                      className={`w-5 h-5 ${star <= Math.round(file.rating || 5) ? "fill-current" : ""}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Resource Discussion */}
          <div className="p-4 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/50 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                المناقشات والتقييمات على الملف ({fileComments.length})
              </h3>

              <div className="space-y-2">
                {fileComments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    لا توجد تعليقات بعد. كن أول من يناقش هذا المرجع!
                  </p>
                ) : (
                  fileComments.map((cmt) => (
                    <div
                      key={cmt.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {cmt.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(cmt.createdAt || "").slice(0, 10)}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{cmt.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comment Form */}
            <form
              onSubmit={handleSendComment}
              className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800"
            >
              <input
                type="text"
                placeholder="اكتب تعليقاً أو استفساراً..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-orange-600 text-white shadow-md hover:bg-orange-500 transition-colors"
                title="إرسال"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
