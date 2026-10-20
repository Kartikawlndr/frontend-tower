"use client";
 
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
 
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}
 
type Item = number | "gap-start" | "gap-end";
 
function buildItems(page: number, count: number): Item[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const items: Item[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) items.push("gap-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < count - 1) items.push("gap-end");
  items.push(count);
  return items;
}
 
const SQUARE =
  "flex h-8 min-w-8 items-center justify-center rounded-input border px-2 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
 
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
 
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-helper">
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 cursor-pointer rounded-input border border-border bg-surface px-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              {pageSizeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        )}
        <span>
          Showing {from}-{to} of {total}
        </span>
      </div>
 
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
          className={cn(SQUARE, "border-border bg-surface text-heading hover:bg-canvas")}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        {buildItems(current, pageCount).map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === current ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                SQUARE,
                item === current
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-heading hover:bg-canvas"
              )}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="px-1 text-muted" aria-hidden>
              ...
            </span>
          )
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={current === pageCount}
          onClick={() => onPageChange(current + 1)}
          className={cn(SQUARE, "border-border bg-surface text-heading hover:bg-canvas")}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </nav>
    </div>
  );
}
