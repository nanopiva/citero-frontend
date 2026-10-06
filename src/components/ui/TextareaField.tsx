import type { ReactNode, TextareaHTMLAttributes } from "react";
import { Label } from "./Label";
import { Textarea } from "./Textarea";
import { FieldError } from "./FieldError";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
};

/** Textarea con label/hint/error asociados (a11y) y API consistente con TextField. */
export function TextareaField({
  id,
  label,
  error,
  hint,
  labelAction,
  required,
  ...props
}: TextareaFieldProps) {
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
      <Textarea
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
