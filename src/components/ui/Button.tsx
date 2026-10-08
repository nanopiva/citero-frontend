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
  // Mobile: min-height + padding para permitir wrap de etiquetas largas.
  // Desde sm: se restaura la altura/padding originales del desktop.
  sm: "min-h-11 px-4 py-2 text-body-sm sm:h-9 sm:min-h-0 sm:px-4 sm:py-0",
  md: "min-h-11 px-4 py-2.5 text-body sm:h-11 sm:min-h-0 sm:px-5 sm:py-0",
  lg: "min-h-12 px-5 py-3 text-body sm:h-12 sm:min-h-0 sm:px-6 sm:py-0 sm:text-button",
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
    "inline-flex items-center justify-center gap-2 text-center rounded-lg font-semibold leading-tight transition-all",
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
