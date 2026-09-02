import { AlertTriangle, X, Loader2, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: LucideIcon;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "تأكيد الإجراء",
  cancelText = "إلغاء",
  variant = "danger",
  icon: CustomIcon,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const IconComponent = CustomIcon || AlertTriangle;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isLoading) onCancel();
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 text-right"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                variant === "danger"
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  : variant === "warning"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
              }`}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-base font-black text-slate-900 dark:text-slate-100"
              >
                {title}
              </h3>
              <p
                id="confirm-dialog-desc"
                className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
              >
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none min-h-[44px]"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-none min-h-[44px] ${
                variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25 focus-visible:ring-rose-500"
                  : variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25 focus-visible:ring-amber-500"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 focus-visible:ring-indigo-500"
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
