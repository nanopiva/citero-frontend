const RESET_EMAIL_KEY = "citero_reset_email";

/** Guarda el email del flujo de recuperación en sessionStorage (no en la URL). */
export function setResetEmail(email: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(RESET_EMAIL_KEY, email);
  }
}

export function getResetEmail(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(RESET_EMAIL_KEY) ?? "";
}

export function clearResetEmail(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(RESET_EMAIL_KEY);
  }
}
