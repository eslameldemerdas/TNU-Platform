import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxHeight = "max-h-[85vh]",
  showCloseButton = true,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`relative z-10 w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border-t md:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col ${maxHeight} overflow-hidden`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "bottom-sheet-title" : undefined}
          >
            {/* Mobile Drag Indicator */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h3
                      id="bottom-sheet-title"
                      className="text-base font-bold text-slate-900 dark:text-white truncate"
                    >
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    aria-label="Close sheet"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 safe-area-pb">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
