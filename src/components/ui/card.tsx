"use client";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ className, title, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border-soft bg-surface shadow-card",
        className
      )}
      {...props}
    >
      {title && (
        <div className="px-6 pt-5">
          <h2 className="text-card-title">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}