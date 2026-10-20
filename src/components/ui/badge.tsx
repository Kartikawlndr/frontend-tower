"use client";
 
import * as React from "react";
import { cn } from "@/lib/utils";
 
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "neutral";
}
 
function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        {
          "border-transparent bg-primary text-on-primary": variant === "default",
          "border-transparent bg-nav-active-bg text-primary": variant === "secondary",
          "border-transparent bg-danger-bg text-danger": variant === "destructive",
          "border-transparent bg-nav-active-bg text-primary ": variant === "success",
          "border-transparent bg-amber text-amber-text": variant === "warning",
          "border-transparent bg-dropzone-bg text-primary": variant === "info",
          "border-transparent bg-input-fill text-muted": variant === "neutral",
          "border-border bg-surface text-heading": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
 
export { Badge };
