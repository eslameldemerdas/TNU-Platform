import React, { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "attention";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 font-bold transition-all duration-fast ease-default focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-xs rounded-ehb-sm min-h-[36px]",
      md: "px-4 py-2.5 text-xs rounded-ehb-md min-h-[42px]",
      lg: "px-5 py-3 text-sm rounded-ehb-lg min-h-[48px]",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-ehb-sm hover:shadow-ehb-md",
      secondary:
        "border border-ehb-default bg-ehb-surface-elevated text-ehb-text-primary hover:bg-ehb-surface-elevated-2 hover:border-ehb-strong",
      ghost:
        "text-ehb-text-muted hover:text-ehb-text-primary hover:bg-ehb-surface-elevated-2",
      danger:
        "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-ehb-sm",
      success:
        "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-ehb-sm",
      attention:
        "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-ehb-sm hover:shadow-ehb-md",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="inline-flex items-center justify-center" aria-hidden="true">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
