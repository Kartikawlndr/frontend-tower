"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** adds red asterisk after label, per Figma */
  requiredMark?: boolean;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, label, requiredMark, error, hint, id, disabled, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex w-full flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-field-label">
            {label}
            {requiredMark && <span className="ml-0.5 text-danger">*</span>}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          disabled={disabled}
          className={cn(
            "h-9 w-full rounded-input border border-border bg-surface px-2.5 text-sm text-text transition-colors duration-fast placeholder:text-muted focus:border-primary focus:outline-none disabled:cursor-not-allowed",
            error && "border-danger",
            disabled && "bg-input-fill",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-helper text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-helper text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };