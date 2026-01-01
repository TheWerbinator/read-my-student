"use client";

import React from "react";
 
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const base = "inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none focus:ring-offset-2  disabled:opacity-50 disable:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-black text-white hover:opacity-90",
  secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
  ghost: "bg-transparent, hover:bg-neutral-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      type,
      ...props
    },
    ref
  ) => {
    return (
      <button ref={ref} type={type ?? "button"} disabled={disabled || loading} className={cx(base, variants[variant], sizes[size], className)} {...props}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Loading</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
