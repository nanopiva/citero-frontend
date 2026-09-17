import type { LabelHTMLAttributes, ReactNode } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
  hint?: string;
  hintId?: string;
  action?: ReactNode;
};

export function Label({
  children,
  required,
  hint,
  hintId,
  action,
  className = "",
  ...props
}: LabelProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <label
          className={`text-body-sm font-medium text-ink-navy ${className}`}
          {...props}
        >
          {children}
          {required && (
            <span className="ml-0.5 text-signal-blue" aria-hidden>
              *
            </span>
          )}
        </label>
        {action}
      </div>
      {hint && (
        <span id={hintId} className="text-caption text-slate-gray">
          {hint}
        </span>
      )}
    </div>
  );
}
