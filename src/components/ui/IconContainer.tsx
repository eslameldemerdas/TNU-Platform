import React, { HTMLAttributes, forwardRef } from "react";

type IconContainerSize = "sm" | "md" | "lg";
type IconContainerVariant = "default" | "primary" | "success" | "warning" | "error";

interface IconContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: IconContainerSize;
  variant?: IconContainerVariant;
  children: React.ReactNode;
}

const sizeClasses: Record<IconContainerSize, string> = {
    sm: "w-8 h-8 rounded-ehb-md",
    md: "w-10 h-10 rounded-ehb-lg",
    lg: "w-14 h-14 rounded-ehb-xl",
  };

  const variantClasses: Record<IconContainerVariant, string> = {
    default:
      "bg-ehb-surface-elevated-2 text-ehb-text-muted border border-ehb-subtle",
    primary: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    error: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  };

export const IconContainer = forwardRef<HTMLDivElement, IconContainerProps>(
  ({ size = "md", variant = "default", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

IconContainer.displayName = "IconContainer";
