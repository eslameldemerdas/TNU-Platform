import React, { ImgHTMLAttributes, forwardRef } from "react";

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
}

const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ size = "md", fallback, className = "", alt, ...props }, ref) => {
    const [error, setError] = React.useState(false);

    if (error || !props.src) {
      return (
        <div
          className={`inline-flex items-center justify-center rounded-ehb-full bg-ehb-surface-elevated-2 text-ehb-text-muted font-bold ${sizeClasses[size]} ${className}`}
          aria-label={alt || "Avatar"}
        >
          {fallback ? fallback.slice(0, 2).toUpperCase() : "?"}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        alt={alt || ""}
        className={`rounded-ehb-full object-cover ${sizeClasses[size]} ${className}`}
        onError={() => setError(true)}
        {...props}
      />
    );
  }
);

Avatar.displayName = "Avatar";
