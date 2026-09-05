import { Search } from "lucide-react";
import React, { InputHTMLAttributes, forwardRef } from "react";
import { Input } from "./Input";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        size={size}
        leftIcon={<Search className="w-4 h-4" />}
        placeholder="بحث..."
        className={className}
        {...props}
      />
    );
  }
);

SearchField.displayName = "SearchField";
