import React, { HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "neutral" | "success" | "warning" | "error" | "info" | "primary";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
    neutral:
      "bg-ehb-surface-elevated-2 text-ehb-text-muted border border-ehb-subtle",
    success:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    error:
      "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    info:
      "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    primary:
      "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: "text-[10px] px-1.5 py-0.5 rounded-md",
    md: "text-xs px-2 py-0.5 rounded-md",
    lg: "text-sm px-2.5 py-1 rounded-lg",
  };

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "neutral", size = "md", dot, className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 font-bold ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {dot && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0" />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
