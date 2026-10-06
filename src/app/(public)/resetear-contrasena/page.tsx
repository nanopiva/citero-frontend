"use client";

import {
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { clearResetEmail, getResetEmail } from "@/lib/resetEmail";
import { clearFieldError, focusFirstError, type FieldErrors } from "@/lib/form";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  OTP_LENGTH,
  validateOtp,
  validatePassword,
} from "@/lib/validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";

const RESEND_COOLDOWN_SECONDS = 30;
const FIELD_ORDER = ["otpCode", "newPassword", "confirmPassword"];

// El email se lee de sessionStorage (no de la URL) como store externo.
const subscribeToResetEmail = () => () => {};
const getServerResetEmail = () => "";

function ResetContent() {
  const router = useRouter();
  const email = useSyncExternalStore(
    subscribeToResetEmail,
    getResetEmail,
    getServerResetEmail,
  );

  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.replace("/recuperar-contrasena");
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Limpia el email guardado al salir de la pantalla de éxito.
  useEffect(() => {
    if (step !== "success") return;
    return () => clearResetEmail();
  }, [step]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setFormError(null);
    setResendMessage(null);

    const errors: FieldErrors = {};
    const otpError = validateOtp(otpCode);
    if (otpError) errors.otpCode = otpError;
    const passwordError = validatePassword(newPassword);
    if (passwordError) errors.newPassword = passwordError;
    if (!confirmPassword) {
      errors.confirmPassword = "Repetí tu contraseña.";
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, FIELD_ORDER);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otpCode,
        newPassword,
      });
      setStep("success");
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos restablecer la contraseña. Verificá el código e intentá nuevamente.",
      );
      const nextFieldErrors: FieldErrors = { ...parsed.fieldErrors };
      if (
        Object.keys(nextFieldErrors).length === 0 &&
        /c[oó]digo|otp|expirado/i.test(parsed.message)
      ) {
        nextFieldErrors.otpCode = parsed.message;
      }
      setFieldErrors(nextFieldErrors);
      setFormError(
        Object.keys(nextFieldErrors).length > 0 ? null : parsed.message,
      );
      focusFirstError(nextFieldErrors, FIELD_ORDER);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    setFormError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setResendMessage("Te enviamos un código nuevo. Revisá tu email.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos reenviar el código. Intentá nuevamente.",
      );
      setFormError(parsed.message);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <AuthShell>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {step === "success" ? (
          <AuthCard
            key="success"
            icon={<CheckCircleIcon className="h-7 w-7" weight="fill" />}
            title="¡Contraseña actualizada!"
            subtitle="Ya podés iniciar sesión con tu nueva contraseña."
          >
            <ButtonLink href="/login" size="lg" fullWidth>
              Ir a iniciar sesión
            </ButtonLink>
          </AuthCard>
        ) : (
          <AuthCard
            key="form"
            title="Creá una nueva contraseña"
            subtitle={`Ingresá el código de ${OTP_LENGTH} dígitos que enviamos a ${email} y elegí tu nueva contraseña.`}
            footer={
              <Link
                href="/recuperar-contrasena"
                className="font-medium text-slate-gray transition-colors hover:text-ink-navy"
              >
                Usar otro email
              </Link>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <TextField
                  id="otpCode"
                  name="otpCode"
                  label="Código de verificación"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(
                      e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                    );
                    clearFieldError(setFieldErrors, "otpCode");
                  }}
                  error={fieldErrors.otpCode}
                  disabled={isSubmitting}
                  className="text-center text-2xl tracking-[0.5em]"
                  required
                />
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending || cooldown > 0}
                  className="text-body-sm font-medium text-signal-blue transition-colors hover:underline disabled:cursor-not-allowed disabled:text-mist-gray disabled:no-underline"
                >
                  {isResending
                    ? "Enviando..."
                    : cooldown > 0
                      ? `Reenviar código en ${cooldown}s`
                      : "¿No lo recibiste? Reenviar código"}
                </button>
              </div>

              <div className="border-t border-hairline" />

              <PasswordField
                id="newPassword"
                name="newPassword"
                label="Nueva contraseña"
                hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                autoComplete="new-password"
                maxLength={MAX_PASSWORD_LENGTH}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearFieldError(setFieldErrors, "newPassword");
                }}
                error={fieldErrors.newPassword}
                disabled={isSubmitting}
                required
              />

              <PasswordField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar nueva contraseña"
                autoComplete="new-password"
                maxLength={MAX_PASSWORD_LENGTH}
                placeholder="Repetí tu contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError(setFieldErrors, "confirmPassword");
                }}
                error={fieldErrors.confirmPassword}
                disabled={isSubmitting}
                required
              />

              {resendMessage && (
                <Alert variant="success">{resendMessage}</Alert>
              )}
              {formError && <Alert variant="error">{formError}</Alert>}

              <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
                Restablecer contraseña
              </Button>
            </form>
          </AuthCard>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}

export default function ResetearContrasenaPage() {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  );
}
