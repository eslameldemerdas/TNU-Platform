import React, { HTMLAttributes, forwardRef } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, rounded = true, className = "", ...props }, ref) => {
    const style: React.CSSProperties = {
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
    };

    return (
      <div
        ref={ref}
        style={style}
        className={`animate-pulse bg-ehb-surface-elevated-2 ${rounded ? "rounded-ehb-md" : ""} ${className}`}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

interface CardSkeletonProps {
  lines?: number;
  showImage?: boolean;
}

export const CardSkeleton = ({ lines = 3, showImage = false }: CardSkeletonProps) => {
  return (
    <div className="p-4 rounded-ehb-md border border-ehb-default bg-ehb-surface-elevated shadow-ehb-sm space-y-3">
      {showImage && <Skeleton height={120} />}
      <div className="space-y-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="90%" height={12} />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? "40%" : "100%"} height={12} />
        ))}
      </div>
    </div>
  );
};

interface ListSkeletonProps {
  items?: number;
}

export const ListSkeleton = ({ items = 4 }: ListSkeletonProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-ehb-md border border-ehb-default bg-ehb-surface-elevated">
          <Skeleton width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
};
