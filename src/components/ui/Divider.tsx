import React, { HTMLAttributes, forwardRef } from "react";

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = "horizontal", className = "", ...props }, ref) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={`w-px self-stretch bg-ehb-subtle ${className}`}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={`w-full h-px bg-ehb-subtle ${className}`}
        {...props}
      />
    );
  }
);

Divider.displayName = "Divider";
