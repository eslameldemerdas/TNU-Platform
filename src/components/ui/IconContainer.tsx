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
    primary: "bg-ehb-primary-subtle text-ehb-primary-accent border border-ehb-default",
    success: "bg-ehb-success-subtle text-ehb-success border border-ehb-success",
    warning: "bg-ehb-warning-subtle text-ehb-warning border border-ehb-warning",
    error: "bg-ehb-error-subtle text-ehb-error border border-ehb-error",
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
