"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  label: string;
  value: string;
};

type SearchableSelectProps = {
  id: string;
  ariaLabel: string;
  searchLabel: string;
  optionsLabel: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  triggerClassName?: string;
  allowAll?: boolean;
  disabled?: boolean;
};

export function SearchableSelect({
  id,
  ariaLabel,
  searchLabel,
  optionsLabel,
  options,
  value,
  onChange,
  placeholder,
  triggerClassName,
  allowAll = false,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase("id-ID").includes(search.trim().toLocaleLowerCase("id-ID")),
  );
  const selectedLabel = options.find((option) => option.value === value)?.label;

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

  function selectOption(option: SearchableSelectOption | null) {
    onChange(option?.value ?? "");
    setOpen(false);
    setSearch("");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && filteredOptions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp" && filteredOptions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (
      event.key === "Enter" &&
      open &&
      filteredOptions[activeIndex]
    ) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
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
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-between rounded-input border border-border bg-white px-2.5 text-left text-xs text-heading transition-colors focus:border-primary focus:outline-none",
          triggerClassName,
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className={cn(!value && "text-muted")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-input border border-border bg-surface shadow-lg">
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
                className="h-9 w-full rounded-input border border-border bg-surface pl-9 pr-3 text-sm text-heading focus:border-primary focus:outline-none"
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
                onClick={() => selectOption(null)}
                className={cn(
                  "flex min-h-8 w-full items-center rounded-input px-2.5 text-left text-sm text-heading hover:bg-nav-active-bg",
                  !value && "font-semibold text-primary",
                )}
              >
                {placeholder}
              </button>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex min-h-8 w-full items-center rounded-input px-2.5 text-left text-sm text-heading hover:bg-nav-active-bg",
                    activeIndex === index && "bg-nav-active-bg",
                    value === option.value && "font-semibold text-primary",
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-2.5 py-3 text-sm text-muted">
                Pilihan tidak ditemukan.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
