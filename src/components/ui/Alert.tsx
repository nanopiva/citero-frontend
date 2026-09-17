"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle, Info, WarningCircle } from "@phosphor-icons/react";

export type AlertVariant = "error" | "success" | "info";

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: typeof Info }
> = {
  error: {
    container: "border-red-200 bg-red-50 text-red-700",
    icon: WarningCircle,
  },
  success: {
    container: "border-[#c7e0ff] bg-[#e6f0ff] text-deep-cobalt",
    icon: CheckCircle,
  },
  info: {
    container: "border-hairline bg-pebble text-deep-cobalt",
    icon: Info,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const { container, icon: Icon } = variantStyles[variant];

  return (
    <motion.div
      role={variant === "error" ? "alert" : "status"}
      initial={reduce ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-body-sm ${container}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </motion.div>
  );
}
