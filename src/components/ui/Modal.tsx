import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeLabel?: string;
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-7xl",
  };

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeLabel = "إغلاق",
}: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-ehb-overlay backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`relative z-10 w-full ${sizeClasses[size]} bg-ehb-surface-elevated border border-ehb-default rounded-ehb-xl shadow-ehb-xl flex flex-col max-h-[90vh]`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-desc" : undefined}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-ehb-subtle">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h3 id="modal-title" className="text-base font-black text-ehb-text-primary">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p id="modal-desc" className="mt-1 text-xs text-ehb-text-muted">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="shrink-0 p-2 rounded-ehb-md text-ehb-text-muted hover:text-ehb-text-primary hover:bg-ehb-surface-elevated-2 transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-5 sm:px-6 py-4 border-t border-ehb-subtle flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
