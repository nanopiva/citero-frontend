const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;
export const OTP_LENGTH = 6;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Ingresá tu email.";
  if (!EMAIL_REGEX.test(email)) return "Ingresá un email válido.";
  return undefined;
}

// Espejo de CommonPasswordCheck del backend (que sigue siendo la fuente de verdad).
const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "11111111", "00000000",
  "password", "password1", "password123", "contrasena", "contraseña",
  "qwerty123", "qwertyui", "1q2w3e4r", "abc12345", "iloveyou",
  "admin123", "welcome1", "123123123", "citero123", "barberia",
]);

export function validatePassword(value: string): string | undefined {
  if (!value) return "Ingresá una contraseña.";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres. Una frase larga es más segura y fácil de recordar.`;
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Usá como máximo ${MAX_PASSWORD_LENGTH} caracteres.`;
  }
  if (COMMON_PASSWORDS.has(value.trim().toLowerCase())) {
    return "Esa contraseña es demasiado común. Elegí otra.";
  }
  return undefined;
}

export function validateOtp(value: string): string | undefined {
  if (!value) return "Ingresá el código que te enviamos.";
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value)) {
    return `El código debe tener ${OTP_LENGTH} dígitos.`;
  }
  return undefined;
}
