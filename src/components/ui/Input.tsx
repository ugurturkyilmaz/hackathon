"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white resize-none",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        className,
      )}
      {...rest}
    />
  );
}

export function Select({
  className,
  ...rest
}: InputHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        className,
      )}
      {...rest}
    />
  );
}
