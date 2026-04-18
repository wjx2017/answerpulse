"use client";

import { useState } from "react";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  required,
  minLength,
  className = "",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:border-transparent ${className}`}
        autoComplete="current-password"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          // Eye-off icon
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.787M12 9a3 3 0 100 6 3 3 0 000-6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
          </svg>
        ) : (
          // Eye icon
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
