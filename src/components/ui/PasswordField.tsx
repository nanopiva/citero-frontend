import type { ComponentProps, ReactNode } from "react";
import { Label } from "./Label";
import { PasswordInput } from "./PasswordInput";
import { FieldError } from "./FieldError";

type PasswordFieldProps = Omit<
  ComponentProps<typeof PasswordInput>,
  "type" | "rightElement"
> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
};

export function PasswordField({
  id,
  label,
  error,
  hint,
  labelAction,
  required,
  ...props
}: PasswordFieldProps) {
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
      <PasswordInput
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
