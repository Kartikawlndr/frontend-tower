"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary (solid blue) | outline (white, gray border) | destructive (solid maroon) | danger-outline (white, maroon border) | download (cyan) | amber (Save as draft) */
  variant?:
    | "primary"
    | "outline"
    | "destructive"
    | "danger-outline"
    | "download"
    | "amber";
  size?: "sm" | "md";
  asChild?: boolean;
}

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover disabled:hover:bg-primary",
  outline:
    "border border-border bg-surface text-heading hover:bg-canvas",
  destructive:
    "bg-danger text-on-primary hover:bg-danger-hover disabled:hover:bg-danger",
  "danger-outline":
    "border border-danger bg-surface text-danger hover:bg-danger-bg",
  download:
    "bg-download text-on-primary hover:brightness-95 disabled:hover:bg-download",
  amber: "bg-amber text-amber-text hover:brightness-95",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 gap-1.5 rounded-input px-3 text-xs",
  md: "h-9 gap-2 rounded-card px-3 text-sm",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-semibold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };