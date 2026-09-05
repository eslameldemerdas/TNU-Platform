import React, { HTMLAttributes, forwardRef } from "react";

type CardVariant = "default" | "elevated" | "flat" | "interactive" | "outlined";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses: Record<CardVariant, string> = {
    default:
      "bg-ehb-surface-elevated border border-ehb-default rounded-ehb-md shadow-ehb-sm",
    elevated:
      "bg-ehb-surface-elevated border border-ehb-default rounded-ehb-lg shadow-ehb-md",
    flat:
      "bg-ehb-surface border border-ehb-subtle rounded-ehb-md",
    interactive:
      "bg-ehb-surface-elevated border border-ehb-default rounded-ehb-md shadow-ehb-sm cursor-pointer transition-all duration-normal ease-default hover:border-ehb-strong hover:shadow-ehb-md active:scale-[0.99]",
    outlined:
      "bg-transparent border border-ehb-default rounded-ehb-md",
  };

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
