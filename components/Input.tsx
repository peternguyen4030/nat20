"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5"
    >
      {children}
    </label>
  );
}

function HelperText({ error, children }: { error?: boolean; children: React.ReactNode }) {
  return (
    <p
      className={`font-display text-[0.85rem] mt-1 ${
        error ? "text-blush" : "text-ink-faded"
      }`}
    >
      {children}
    </p>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error = false, wrapperClassName, className = "", id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const borderClass =
      error || focused ? "border-blush" : "border-sketch";

    return (
      <div className={wrapperClassName}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full font-sans text-[0.875rem] bg-parchment text-ink
            rounded-input px-3 py-2 border-2 outline-none
            transition-colors duration-150 box-border
            ${borderClass} ${className}
          `.trim().replace(/\s+/g, " ")}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {helperText && <HelperText error={error}>{helperText}</HelperText>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error = false, wrapperClassName, className = "", id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const borderClass =
      error || focused ? "border-blush" : "border-sketch";

    return (
      <div className={wrapperClassName}>
        {label && <Label htmlFor={textareaId}>{label}</Label>}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={`
            w-full font-sans text-[0.875rem] bg-parchment text-ink
            rounded-input px-3 py-2 border-2 outline-none resize-y
            transition-colors duration-150 box-border
            ${borderClass} ${className}
          `.trim().replace(/\s+/g, " ")}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {helperText && <HelperText error={error}>{helperText}</HelperText>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
