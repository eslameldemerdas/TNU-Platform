import { LucideIcon, FolderOpen } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-ehb-2xl border border-dashed border-ehb-default bg-ehb-surface/50 transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-ehb-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-ehb-sm">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-ehb-text-primary mb-1 max-w-md">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-ehb-text-muted max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(onAction || onSecondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-ehb-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-ehb-md transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none min-h-[44px]"
            >
              {actionLabel}
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-ehb-md border border-ehb-default bg-ehb-surface-elevated hover:bg-ehb-surface-elevated-2 text-ehb-text-primary text-xs font-semibold shadow-ehb-sm transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none min-h-[44px]"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
