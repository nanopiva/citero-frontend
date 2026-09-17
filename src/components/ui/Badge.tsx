import type { ReactNode } from "react";

export type BadgeVariant =
  | "primary"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-[#e6f0ff] text-deep-cobalt",
  neutral: "bg-pebble text-slate-gray",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
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
