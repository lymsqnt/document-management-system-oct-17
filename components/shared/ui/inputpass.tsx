
"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

type InputPassProps = InputHTMLAttributes<HTMLInputElement>;

export default function InputPass({
  className = "",
  type = "password",
  ...props
}: InputPassProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <LockKeyhole
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        {...props}
        type={showPassword ? "text" : type}
        className={`h-9 w-full rounded-md border border-gray-400 bg-white py-1 pl-9 pr-10 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 sm:h-10 sm:text-sm ${className}`}
      />

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}