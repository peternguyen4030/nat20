"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#C97B5A",
    color: "#fff",
    border: "2px solid #C97B5A",
    boxShadow: "2px 2px 0px #9B5A3A",
  },
  secondary: {
    background: "#FAF7F2",
    color: "#5C4F3A",
    border: "2px solid #C4B49A",
    boxShadow: "2px 2px 0px #C4B49A",
  },
  ghost: {
    background: "transparent",
    color: "#9B8E7A",
    border: "none",
    boxShadow: "none",
    textDecoration: "underline",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "3px",
  },
  danger: {
    background: "#FAF7F2",
    color: "#C97B5A",
    border: "2px solid #C97B5A44",
    boxShadow: "none",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "4px 12px", fontSize: "0.75rem" },
  md: { padding: "8px 16px", fontSize: "0.875rem" },
  lg: { padding: "10px 22px", fontSize: "1rem" },
};

const sketchRadius = "4px 8px 6px 5px / 6px 4px 8px 5px";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, children, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          borderRadius: sketchRadius,
          cursor: props.disabled || loading ? "not-allowed" : "pointer",
          opacity: props.disabled || loading ? 0.6 : 1,
          transition: "opacity 0.15s, transform 0.1s",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          lineHeight: 1,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!props.disabled && !loading) {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(-1px, -1px)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          (e.currentTarget as HTMLButtonElement).style.transform = "translate(0, 0)";
        }}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? <span style={{ opacity: 0.7 }}>...</span> : children}
      </button>
    );
  }
);

Button.displayName = "Button";
