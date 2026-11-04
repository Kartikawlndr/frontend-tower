"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchableYearSelectProps = {
  id: string;
  ariaLabel: string;
  searchLabel: string;
  optionsLabel: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  triggerClassName: string;
  name?: string;
  describedBy?: string;
  invalid?: boolean;
  allowAll?: boolean;
};

export function SearchableYearSelect({
  id,
  ariaLabel,
  searchLabel,
  optionsLabel,
  value,
  onChange,
  placeholder,
  triggerClassName,
  name,
  describedBy,
  invalid = false,
  allowAll = false,
}: SearchableYearSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1900 + 1 },
    (_, index) => currentYear - index,
  ).filter((year) => year.toString().includes(search.trim()));

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectYear(year: number | null) {
    onChange(year === null ? "" : String(year));
    setOpen(false);
    setSearch("");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && years.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, years.length - 1));
    } else if (event.key === "ArrowUp" && years.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (
      event.key === "Enter" &&
      open &&
      years[activeIndex] !== undefined
    ) {
      event.preventDefault();
      selectYear(years[activeIndex]);
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-haspopup="listbox"
        aria-invalid={invalid ? "true" : "false"}
        aria-describedby={describedBy}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-input border border-border px-2.5 text-left transition-colors duration-150 focus:border-primary focus:outline-none",
          triggerClassName,
          invalid && "border-danger",
        )}
      >
        <span className={cn(!value && "text-muted")}>{value || placeholder}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-input border border-border bg-surface shadow-lg">
          <div className="border-b border-border-soft p-2">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              />
              <input
                ref={searchRef}
                type="search"
                aria-label={searchLabel}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari"
                className="h-9 w-full rounded-input border border-border bg-surface pl-9 pr-3 text-sm text-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div
            id={`${id}-options`}
            role="listbox"
            aria-label={optionsLabel}
            className="max-h-60 overflow-y-auto p-1"
          >
            {allowAll && (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => selectYear(null)}
                className={cn(
                  "flex min-h-8 w-full items-center rounded-input px-2.5 text-left text-sm text-text hover:bg-nav-active-bg",
                  !value && "font-semibold text-primary",
                )}
              >
                Semua Tahun
              </button>
            )}
            {years.length > 0 ? (
              years.map((year, index) => (
                <button
                  key={year}
                  type="button"
                  role="option"
                  aria-selected={value === String(year)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectYear(year)}
                  className={cn(
                    "flex min-h-8 w-full items-center rounded-input px-2.5 text-left text-sm text-text hover:bg-nav-active-bg",
                    activeIndex === index && "bg-nav-active-bg",
                    value === String(year) && "font-semibold text-primary",
                  )}
                >
                  {year}
                </button>
              ))
            ) : (
              <p className="px-2.5 py-3 text-sm text-muted">
                Tahun tidak ditemukan.
              </p>
            )}
          </div>
        </div>
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
