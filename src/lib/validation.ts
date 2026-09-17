export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;
export const OTP_LENGTH = 6;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Ingresá tu email.";
  if (!EMAIL_REGEX.test(email)) return "Ingresá un email válido.";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Ingresá una contraseña.";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return undefined;
}

export function validateOtp(value: string): string | undefined {
  if (!value) return "Ingresá el código que te enviamos.";
  if (value.length !== OTP_LENGTH) {
    return `El código debe tener ${OTP_LENGTH} dígitos.`;
  }
  return undefined;
}
