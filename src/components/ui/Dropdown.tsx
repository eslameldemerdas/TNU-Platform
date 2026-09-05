import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState } from "react";

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  width?: string;
  onClose?: () => void;
}

export const Dropdown = ({ trigger, items, align = "end", width = "w-56", onClose }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as Node).nodeType === 1) {
        setIsOpen(false);
        onClose?.();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full ${align === "end" ? "ltr:right-0 rtl:left-0" : "ltr:left-0 rtl:right-0"} mt-2 ${width} rounded-ehb-md border border-ehb-default bg-ehb-surface-elevated shadow-ehb-lg z-dropdown overflow-hidden`}
          >
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors duration-fast ${
                    item.danger
                      ? "text-rose-400 hover:bg-rose-500/10"
                      : "text-ehb-text-primary hover:bg-ehb-surface-elevated-2"
                  } ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
