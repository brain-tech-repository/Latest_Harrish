"use client";
import Skeleton from "@mui/material/Skeleton";
import React, { useEffect, useRef, useState } from "react";
import CustomCheckbox from "@/app/components/customCheckbox";
import { Icon } from "@iconify/react";

/* ================= TYPES ================= */

export type Option = {
  value: string;
  label: any;
  [key: string]: any;
};

type BaseProps = {
  placeholder?: string;
  onSearch: (query: string) => Promise<Option[]>;
  onSelect: (option: Option) => void;
  minSearchLength?: number;
  debounceMs?: number;
  className?: string;
  initialValue?: string;
  renderOption?: (opt: Option) => React.ReactNode;
  noOptionsMessage?: string;
  label?: string;
  required?: boolean;
  error?: string | false;
  id?: string;
  name?: string;
  width?: string;
  disabled?: boolean;
  onClear?: () => void;
  selectedOption?: Option | null;
  multiple?: boolean;
  initialSelected?: Option[];
  onChangeSelected?: (selected: Option[]) => void;
};

export type Props = BaseProps;

/* ================= COMPONENT ================= */

export default function AutoSearch({
  placeholder = "Search...",
  onSearch,
  onSelect,
  minSearchLength = 1,
  debounceMs = 500,
  initialValue = "",
  renderOption,
  noOptionsMessage = "No options",
  label,
  required = false,
  error,
  id,
  name,
  width = "max-w-[406px]",
  disabled = false,
  onClear,
  selectedOption,
  multiple = false,
  initialSelected = [],
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  /* ================= SYNC ================= */

  useEffect(() => {
    setQuery(initialValue || "");
  }, [initialValue]);

  /* ================= SEARCH ================= */

  useEffect(() => {
    if (query.length < minSearchLength) {
      setOptions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setOpen(true);
      try {
        const res = await onSearch(query);
        setOptions(res || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [query]);

  /* ================= OUTSIDE CLICK ================= */

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  /* ================= CLEAR ================= */

  const clearAll = () => {
    setQuery("");
    setOptions([]);
    setOpen(false);
    onClear?.();
    inputRef.current?.focus();
  };

  /* ================= RENDER ================= */

  return (
    <div ref={containerRef} className={`relative w-full ${width}`}>
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* ============ SINGLE SELECT INPUT ============ */}
      {!multiple && (
        <div
          className="relative text-[14px]"
          style={{ color: "var(--table-text-color, #717680)" }}
        >
          {/* 🔍 SEARCH ICON */}
          <div className="absolute top-0 left-0 flex items-center h-full pl-[12px]">
            <Icon icon="mdi:magnify" width={18} />
          </div>

          <input 
            ref={inputRef}
            id={id ?? name}
            name={name}
            disabled={disabled}
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              if (!v) clearAll();
            }}
            onFocus={() => options.length && setOpen(true)}
            placeholder={placeholder}
            className={`border mt-[2px] inout-field rounded-md w-full h-[36px] py-[8px] px-[40px]
              ${error ? "border-red-500" : "border-gray-300"}
            `}
            style={{
              backgroundColor: "var(--table-bg-color, #FFFFFF)",
              borderColor: "var(--table-border-color, #E9EAEB)",
              color: "var(--text-primary-color, #181D27)",
            }}
          />

          {/* ❌ CLOSE ICON */}
          {query && (
            <div
              onClick={clearAll}
              className="absolute top-0 right-0 flex items-center h-full pr-[12px] cursor-pointer"
            >
              <Icon
                icon="iconamoon:close-light"
                width={18}
                className="text-gray-500 hover:text-red-500"
              />
            </div>
          )}
        </div>
      )}

      {/* ============ DROPDOWN ============ */}
      {open && (
        <div className="absolute autosuggestion z-50 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3">
              <Skeleton />
              <Skeleton />
            </div>
          ) : options.length === 0 ? (
            <div className="p-3 text-center text-gray-500">{noOptionsMessage}</div>
          ) : (
            options.map((opt, idx) => (
              <div
                key={idx}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                  onSelect(opt);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 list-li"
              >
                {renderOption ? renderOption(opt) : opt.label}
              </div>
            ))
          )}
        </div>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}