import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link, { type LinkProps } from "next/link";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";

export type ButtonVariant =
  | "primary"
  | "dark"
  | "outline"
  | "light"
  | "ghost"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-signal-blue text-paper hover:brightness-95 active:scale-[0.98]",
  dark: "bg-ink-navy text-paper hover:bg-ink-navy/90 active:scale-[0.98]",
  outline:
    "border border-hairline bg-paper text-ink-navy hover:bg-pebble active:scale-[0.98]",
  light:
    "border border-paper bg-transparent text-paper hover:bg-paper/10 active:scale-[0.98]",
  ghost: "text-ink-navy hover:text-signal-blue",
  destructive:
    "border border-danger/30 bg-paper text-danger hover:bg-danger/5",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-body-sm",
  md: "h-11 px-5 text-body",
  lg: "h-12 px-6 text-button",
};

function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold leading-none transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/30",
    "disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant,
  size,
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? (
        <CircleNotchIcon
          className="h-4 w-4 animate-spin"
          weight="bold"
          aria-hidden
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
};

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
