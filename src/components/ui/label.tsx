"use client";
 
import * as React from "react";
import { cn } from "@/lib/utils";
 
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: "default" | "small" | "large";
}
 
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "font-semibold text-heading",
        {
          "text-xs": variant === "default",
          "text-2xs": variant === "small",
          "text-sm": variant === "large",
        },
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";
 
export { Label };
