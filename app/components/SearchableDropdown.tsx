"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";

type Option = {
  value: string | number;
  label: string;
};

type Props = {
  label: string;
  name: string;
  value?: string | number;
  options: Option[];
  onChange: (value: string | number) => void;
  id?: string;
  width?: string;
  error?: string | false;
  placeholder?: string;
};

export default function SearchableDropdown({
  label,
  name,
  id,
  value,
  options,
  onChange,
  width = "max-w-[406px]",
  error,
  placeholder = "Search...",
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
  return options
    .filter(opt => opt.label) // only include items with a label
    .filter(opt => opt.label!.toLowerCase().includes(query.toLowerCase()));
}, [query, options]);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`flex flex-col gap-2 w-full ${width}`}
    >
      <label
        htmlFor={id ?? name}
        className="text-sm font-medium"
        style={{ color: 'var(--input-label, #374151)' }}
      >
        {label}
      </label>

      <div className="relative">
        {/* Input field */}
        <input
          type="text"
          id={id ?? name}
          value={query || selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true); // keep open while typing
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`h-[44px] w-full rounded-md px-3 cursor-pointer ${
            error ? "border-red-500" : ""
          }`}
          style={{
            backgroundColor: 'var(--input-bg, #FFFFFF)',
            borderColor: error ? undefined : 'var(--input-border, #D1D5DB)',
            borderWidth: '1px',
            color: 'var(--input-text, #181D27)'
          }}
          readOnly={false}
        />

        {/* Dropdown list */}
        {isOpen && (
          <ul 
            className="fixed z-10 mt-1 w-[206px] rounded-md max-h-52 overflow-y-auto shadow-md"
            style={{
              backgroundColor: 'var(--dropdown-bg, #FFFFFF)',
              borderColor: 'var(--dropdown-border, #D1D5DB)',
              borderWidth: '1px'
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={`px-3 py-2 cursor-pointer text-sm`}
                  style={{
                    backgroundColor: opt.value === value ? 'var(--dropdown-hover-bg, #E5E7EB)' : 'transparent',
                    color: 'var(--dropdown-text, #181D27)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dropdown-hover-bg, #F3F4F6)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = opt.value === value ? 'var(--dropdown-hover-bg, #E5E7EB)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.value);
                    setQuery(""); // reset query
                    setIsOpen(false); // close dropdown
                  }}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500 text-sm">
                No results found
              </li>
            )}
          </ul>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-500 mt-1">{error}</span>
      )}
    </div>
  );
}
