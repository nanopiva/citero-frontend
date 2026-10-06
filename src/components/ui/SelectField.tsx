import type { ReactNode, SelectHTMLAttributes } from "react";
import { Label } from "./Label";
import { Select } from "./Select";
import { FieldError } from "./FieldError";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  children: ReactNode;
};

/** Select con label/hint/error asociados (a11y) y API consistente con TextField. */
export function SelectField({
  id,
  label,
  error,
  hint,
  labelAction,
  required,
  children,
  ...props
}: SelectFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        required={required}
        hint={hint}
        hintId={hintId}
        action={labelAction}
      >
        {label}
      </Label>
      <Select
        id={id}
        hasError={Boolean(error)}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </Select>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
