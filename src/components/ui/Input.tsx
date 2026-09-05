import React, { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

type InputSize = "sm" | "md" | "lg";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = "md", label, error, hint, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const sizeClasses: Record<InputSize, string> = {
      sm: "px-3 py-1.5 text-xs rounded-ehb-sm min-h-[36px]",
      md: "px-4 py-2.5 text-xs rounded-ehb-md min-h-[44px]",
      lg: "px-4 py-3 text-sm rounded-ehb-lg min-h-[48px]",
    };

    const borderClass = error
      ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
      : "border-ehb-default focus:ring-amber-500 focus:border-amber-500";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-ehb-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-ehb-text-muted pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full bg-ehb-surface-elevated border ${borderClass}
              text-ehb-text-primary placeholder:text-ehb-text-muted
              transition-colors duration-fast ease-default
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? "ps-10" : ""}
              ${rightIcon ? "pe-10" : ""}
              ${sizeClasses[size]} ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 end-0 flex items-center pe-3 text-ehb-text-muted pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-ehb-text-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = "md", label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const sizeClasses: Record<InputSize, string> = {
      sm: "px-3 py-1.5 text-xs rounded-ehb-sm",
      md: "px-4 py-2.5 text-xs rounded-ehb-md",
      lg: "px-4 py-3 text-sm rounded-ehb-lg",
    };

    const borderClass = error
      ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
      : "border-ehb-default focus:ring-amber-500 focus:border-amber-500";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-ehb-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full bg-ehb-surface-elevated border ${borderClass}
            text-ehb-text-primary placeholder:text-ehb-text-muted
            transition-colors duration-fast ease-default
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${sizeClasses[size]} ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-ehb-text-muted">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  size?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = "md", label, error, hint, options, children, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const sizeClasses: Record<InputSize, string> = {
      sm: "px-3 py-1.5 text-xs rounded-ehb-sm min-h-[36px]",
      md: "px-4 py-2.5 text-xs rounded-ehb-md min-h-[44px]",
      lg: "px-4 py-3 text-sm rounded-ehb-lg min-h-[48px]",
    };

    const borderClass = error
      ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
      : "border-ehb-default focus:ring-amber-500 focus:border-amber-500";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-ehb-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`
            w-full bg-ehb-surface-elevated border ${borderClass}
            text-ehb-text-primary
            transition-colors duration-fast ease-default
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${sizeClasses[size]} ${className}
          `}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-ehb-text-muted">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
