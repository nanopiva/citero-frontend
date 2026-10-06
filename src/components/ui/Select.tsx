import type { SelectHTMLAttributes } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export function Select({
  hasError,
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        className={[
          "h-11 w-full appearance-none rounded-lg border bg-pebble pl-3 pr-10 text-body text-ink-navy outline-none transition-colors",
          "focus:bg-paper focus:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          hasError
            ? "border-danger focus:border-danger focus:ring-danger/15"
            : "border-hairline focus:border-signal-blue focus:ring-signal-blue/15",
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </select>
      <CaretDownIcon
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-gray"
        weight="bold"
      />
    </div>
  );
}
