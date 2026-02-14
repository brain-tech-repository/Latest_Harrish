"use client";

import { useState } from "react";
import { Icon } from "@iconify-icon/react";

export default function CustomPasswordInput({
  label,
  value,
  onChange,
  required = false,
  width = "w-full",
  error,
  onBlur,
  autoComplete = true,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  width?: string;
  required?: boolean;
  error?: string | false;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoComplete?: boolean;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function togglePasswordVisibility() {
    setIsPasswordVisible((prev) => !prev);
  }

  return (
    <div className={`${width}`}>
      <label htmlFor={label} className="text-sm text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {/* Hint icon with tooltip */}
        <div className="relative group cursor-pointer">
          <Icon icon="lucide:info" width={14} className="text-gray-500 hover:text-gray-700" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 w-[240px]">
            Password must be at least 12 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.
          </div>
        </div>
      </label>

      <div className="relative mt-[6px]">
        <input
          autoComplete={autoComplete ? "on" : "off"}
          type={isPasswordVisible ? "text" : "password"}
          id={label}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`border h-[44px] w-full rounded-md px-3 pr-10 text-sm ${error ? "border-red-500" : "border-gray-300"
            }`}
          placeholder="••••••••"
        />
        <div
          className="absolute cursor-pointer text-[#717680] h-full flex items-center top-1/2 -translate-y-1/2 right-3"
          onClick={togglePasswordVisibility}
        >
          {isPasswordVisible ? (
            <Icon icon="lucide:eye-off" width={16} />
          ) : (
            <Icon icon="lucide:eye" width={16} />
          )}
        </div>
      </div>

      {error && (
        <div className="mt-1">
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}
    </div>

  );
}
