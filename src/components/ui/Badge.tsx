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
      "bg-ehb-success-subtle text-ehb-success border border-ehb-success",
    warning:
      "bg-ehb-warning-subtle text-ehb-warning border border-ehb-warning",
    error:
      "bg-ehb-error-subtle text-ehb-error border border-ehb-error",
    info:
      "bg-ehb-info-subtle text-ehb-info border border-ehb-info",
    primary:
      "bg-ehb-primary-subtle text-ehb-primary-accent border border-ehb-default",
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
