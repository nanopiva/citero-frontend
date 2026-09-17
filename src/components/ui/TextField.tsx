import type { InputHTMLAttributes, ReactNode } from "react";
import { Label } from "./Label";
import { Input } from "./Input";
import { FieldError } from "./FieldError";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
};

export function TextField({
  id,
  label,
  error,
  hint,
  labelAction,
  required,
  ...props
}: TextFieldProps) {
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
      <Input
        id={id}
        hasError={Boolean(error)}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
