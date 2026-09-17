export type FieldErrors = Record<string, string | undefined>;

export function clearFieldError(
  setErrors: (updater: (prev: FieldErrors) => FieldErrors) => void,
  field: string,
) {
  setErrors((prev) => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

export function focusFirstError(errors: FieldErrors, order: string[]) {
  const first = order.find((field) => errors[field]);
  if (!first || typeof document === "undefined") return;
  const element = document.getElementById(first);
  if (element instanceof HTMLElement) {
    element.focus();
  }
}
