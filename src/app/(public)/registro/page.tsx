"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute, ROUTES } from "@/types";
import { parseApiError } from "@/lib/apiError";
import { clearFieldError, focusFirstError, type FieldErrors } from "@/lib/form";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  OTP_LENGTH,
  validateEmail,
  validateOtp,
  validatePassword,
} from "@/lib/validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";

const RESEND_COOLDOWN_SECONDS = 30;
const FIELD_ORDER = ["email", "password", "phone", "otpCode"];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestRegisterOtp, register } = useAuth();

  const isBusinessIntent = searchParams.get("intent") === "business";
  const emailParam = searchParams.get("email") || "";

  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setResendMessage(null);

    const errors: FieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, FIELD_ORDER);
      return;
    }

    setIsLoading(true);
    try {
      await requestRegisterOtp(email.trim());
      setOtpCode("");
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos enviar el código. Revisá los datos e intentá de nuevo.",
      );
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      focusFirstError(parsed.fieldErrors, FIELD_ORDER);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setResendMessage(null);

    const otpError = validateOtp(otpCode);
    if (otpError) {
      setFieldErrors({ otpCode: otpError });
      focusFirstError({ otpCode: otpError }, FIELD_ORDER);
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), password, phone.trim() || undefined, otpCode);
      router.replace(
        isBusinessIntent ? ROUTES.auth.onboarding : getDashboardRoute(),
      );
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos crear tu cuenta. Verificá el código e intentá de nuevo.",
      );
      const nextFieldErrors: FieldErrors = { ...parsed.fieldErrors };
      if (parsed.status === 409 && Object.keys(nextFieldErrors).length === 0) {
        nextFieldErrors.email = parsed.message;
      }
      // Si el error es de un campo que no está en el paso OTP, volvemos al formulario.
      const OTP_STEP_FIELDS = new Set(["otpCode"]);
      const hiddenFieldError = Object.keys(nextFieldErrors).some(
        (field) => !OTP_STEP_FIELDS.has(field),
      );
      if (hiddenFieldError) {
        setStep("form");
      }
      setFieldErrors(nextFieldErrors);
      setFormError(
        Object.keys(nextFieldErrors).length > 0 && !hiddenFieldError
          ? null
          : parsed.message,
      );
      if (!hiddenFieldError) {
        focusFirstError(nextFieldErrors, FIELD_ORDER);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setFormError(null);
    setResendMessage(null);
    setIsLoading(true);
    try {
      await requestRegisterOtp(email.trim());
      setResendMessage("Te enviamos un código nuevo. Revisá tu email.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setFormError(
        parseApiError(err, "No pudimos reenviar el código. Intentá nuevamente.")
          .message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard
        title={step === "form" ? "Creá tu cuenta" : "Verificá tu email"}
        subtitle={
          step === "form"
            ? "Empezá a gestionar tus turnos en segundos"
            : `Te enviamos un código de ${OTP_LENGTH} dígitos a ${email.trim()}.`
        }
        footer={
          step === "form" ? (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link
                href={ROUTES.public.login}
                className="font-semibold text-signal-blue hover:underline"
              >
                Ingresá
              </Link>
            </>
          ) : undefined
        }
      >
        {step === "form" ? (
          <>
            {emailParam && (
              <div className="mb-5">
                <Alert variant="info">
                  Te invitaron a unirte a un equipo. Creá tu cuenta con este
                  correo para quedar vinculado.
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <TextField
                id="email"
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError(setFieldErrors, "email");
                }}
                error={fieldErrors.email}
                disabled={isLoading}
                required
              />

              <PasswordField
                id="password"
                name="password"
                label="Contraseña"
                hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                autoComplete="new-password"
                maxLength={MAX_PASSWORD_LENGTH}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError(setFieldErrors, "password");
                }}
                error={fieldErrors.password}
                disabled={isLoading}
                required
              />

              <TextField
                id="phone"
                name="phone"
                label="Teléfono"
                hint="Opcional"
                type="tel"
                autoComplete="tel"
                placeholder="+54 9 11 1234-5678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError(setFieldErrors, "phone");
                }}
                error={fieldErrors.phone}
                disabled={isLoading}
              />

              {formError && <Alert variant="error">{formError}</Alert>}

              <Button type="submit" size="lg" fullWidth loading={isLoading}>
                Continuar
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5" noValidate>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-signal-blue">
                <EnvelopeSimple className="h-6 w-6" weight="regular" />
              </span>
              <div>
                <p className="text-body font-semibold text-ink-navy">
                  Código de verificación
                </p>
                <p className="text-caption text-slate-gray">
                  Lo enviamos a {email.trim()}
                </p>
              </div>
            </div>

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
              disabled={isLoading}
              className="text-center text-2xl tracking-[0.5em]"
              required
            />

            {resendMessage && <Alert variant="success">{resendMessage}</Alert>}
            {formError && <Alert variant="error">{formError}</Alert>}

            <Button type="submit" size="lg" fullWidth loading={isLoading}>
              Crear cuenta
            </Button>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading || cooldown > 0}
                className="text-body-sm font-medium text-signal-blue transition-colors hover:underline disabled:cursor-not-allowed disabled:text-mist-gray disabled:no-underline"
              >
                {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtpCode("");
                  setFormError(null);
                  setResendMessage(null);
                }}
                className="text-body-sm text-slate-gray transition-colors hover:text-ink-navy"
              >
                Cambiar datos
              </button>
            </div>
          </form>
        )}
      </AuthCard>

      {step === "form" && (
        <p className="mt-6 text-center text-caption text-slate-gray">
          Al crear una cuenta, aceptás nuestros{" "}
          <Link
            href="/terminos"
            className="text-ink-navy underline hover:text-signal-blue"
          >
            términos y condiciones
          </Link>{" "}
          y nuestra{" "}
          <Link
            href="/privacidad"
            className="text-ink-navy underline hover:text-signal-blue"
          >
            política de privacidad
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
