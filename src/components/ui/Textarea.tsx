import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export function Textarea({
  hasError,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={[
        "w-full min-h-[112px] resize-none rounded-lg border bg-pebble px-4 py-3 text-body text-ink-navy outline-none transition-colors",
        "placeholder:text-slate-gray/70",
        "focus:bg-paper focus:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        hasError
          ? "border-danger focus:border-danger focus:ring-danger/15"
          : "border-hairline focus:border-signal-blue focus:ring-signal-blue/15",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
