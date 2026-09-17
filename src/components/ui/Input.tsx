import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
};

export function Input({
  hasError,
  leftIcon,
  rightElement,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-gray">
          {leftIcon}
        </span>
      )}
      <input
        aria-invalid={hasError || undefined}
        className={[
          "h-11 w-full rounded-lg border bg-pebble px-4 text-body text-ink-navy outline-none transition-colors",
          "placeholder:text-mist-gray",
          "focus:bg-paper focus:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          leftIcon ? "pl-10" : "",
          rightElement ? "pr-12" : "",
          hasError
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
            : "border-hairline focus:border-signal-blue focus:ring-signal-blue/15",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {rightElement && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightElement}
        </span>
      )}
    </div>
  );
}
