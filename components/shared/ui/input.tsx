
"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-md border border-gray-400 bg-white px-3 py-1 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 sm:h-10 sm:text-sm ${className}`}
    />
  );
}