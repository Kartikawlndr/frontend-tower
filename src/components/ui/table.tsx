import * as React from "react";
import { cn } from "@/lib/utils";
 
export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-left text-base", className)}
        {...props}
      />
    </div>
  );
}
 
export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 whitespace-nowrap bg-table-head-bg px-4 text-xs font-semibold text-heading",
        className
      )}
      {...props}
    />
  );
}
 
export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("h-11 border-b border-border-soft px-4 text-text", className)}
      {...props}
    />
  );
}
