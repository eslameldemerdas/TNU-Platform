import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 ltr:right-5 rtl:left-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-ehb-md border shadow-ehb-lg backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-ehb-success-subtle text-ehb-text-primary border-ehb-success"
                : toast.type === "error"
                  ? "bg-ehb-error-subtle text-ehb-text-primary border-ehb-error"
                  : toast.type === "warning"
                    ? "bg-ehb-warning-subtle text-ehb-text-primary border-ehb-warning"
                    : "bg-ehb-surface-elevated text-ehb-text-primary border-ehb-default"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toast.type === "warning" && (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            {toast.type === "info" && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold tracking-tight">{toast.title}</h4>
              {toast.description && (
                <p className="text-[11px] text-ehb-text-muted mt-0.5 leading-relaxed line-clamp-2">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-ehb-text-muted hover:text-ehb-text-primary p-1 rounded-lg hover:bg-ehb-surface-elevated-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
