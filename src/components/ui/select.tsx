"use client";
 
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
 
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  requiredMark?: boolean;
  error?: string;
  hint?: string;
}
 
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, requiredMark, error, hint, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
 
    return (
      <div className="flex w-full flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-field-label">
            {label}
            {requiredMark && <span className="ml-0.5 text-danger">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            className={cn(
              "h-9 w-full cursor-pointer appearance-none rounded-input border border-border bg-surface pl-2.5 pr-8 text-sm text-text focus:border-primary focus:outline-none disabled:cursor-not-allowed",
              error && "border-danger",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
        </div>
        {error && (
          <p className="text-helper text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && <p className="text-helper">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
 
export { Select };
