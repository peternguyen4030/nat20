"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";

const sketchRadius = "3px 7px 5px 4px / 5px 3px 7px 4px";

// ─── Shared label ─────────────────────────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "0.7rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#9B8E7A",
        display: "block",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

// ─── Helper / error text ──────────────────────────────────────────────────────

function HelperText({ error, children }: { error?: boolean; children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Caveat', cursive",
        fontSize: "0.85rem",
        color: error ? "#C97B5A" : "#9B8E7A",
        marginTop: 4,
      }}
    >
      {children}
    </p>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  wrapperStyle?: React.CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error = false, wrapperStyle, style, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div style={wrapperStyle}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <input
          ref={ref}
          id={inputId}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "0.875rem",
            width: "100%",
            background: "#F5F0E8",
            border: `2px solid ${error ? "#C97B5A" : focused ? "#C97B5A" : "#C4B49A"}`,
            borderRadius: sketchRadius,
            padding: "8px 12px",
            color: "#2C2416",
            outline: "none",
            transition: "border-color 0.15s",
            boxSizing: "border-box",
            ...style,
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {helperText && <HelperText error={error}>{helperText}</HelperText>}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  wrapperStyle?: React.CSSProperties;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error = false, wrapperStyle, style, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div style={wrapperStyle}>
        {label && <Label htmlFor={textareaId}>{label}</Label>}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "0.875rem",
            width: "100%",
            background: "#F5F0E8",
            border: `2px solid ${error ? "#C97B5A" : focused ? "#C97B5A" : "#C4B49A"}`,
            borderRadius: sketchRadius,
            padding: "8px 12px",
            color: "#2C2416",
            outline: "none",
            resize: "vertical",
            transition: "border-color 0.15s",
            boxSizing: "border-box",
            ...style,
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {helperText && <HelperText error={error}>{helperText}</HelperText>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
