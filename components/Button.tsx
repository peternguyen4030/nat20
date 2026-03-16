"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blush text-white border-2 border-blush shadow-sketch-accent hover:opacity-90",
  secondary:
    "bg-warm-white text-ink-soft border-2 border-sketch shadow-sketch hover:opacity-90",
  ghost:
    "bg-transparent text-ink-faded border-none shadow-none underline decoration-dotted underline-offset-[3px] hover:text-ink-soft",
  danger:
    "bg-warm-white text-blush border-2 border-blush/30 shadow-none hover:bg-blush/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-[0.75rem]",
  md: "px-4 py-2 text-[0.875rem]",
  lg: "px-[22px] py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          font-sans font-semibold rounded-sketch
          inline-flex items-center gap-1.5 leading-none
          transition-[opacity,transform] duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
          cursor-pointer
          hover:-translate-x-px hover:-translate-y-px
          ${variantClasses[variant]} ${sizeClasses[size]}
          ${className}
        `.trim().replace(/\s+/g, " ")}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="opacity-70">...</span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
