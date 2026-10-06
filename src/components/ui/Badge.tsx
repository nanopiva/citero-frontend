import type { ReactNode } from "react";

export type BadgeVariant =
  | "primary"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-accent-soft text-deep-cobalt",
  neutral: "bg-pebble text-slate-gray",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  variant = "primary",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-badges px-2 py-1 text-caption font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
