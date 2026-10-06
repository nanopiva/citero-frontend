"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute, ROUTES } from "@/types";
import { parseApiError } from "@/lib/apiError";
import { clearFieldError, focusFirstError, type FieldErrors } from "@/lib/form";
import { validateEmail } from "@/lib/validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthenticatedRedirect } from "@/components/auth/AuthenticatedRedirect";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginMfa } = useAuth();

  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    if (!password) errors.password = "Ingresá tu contraseña.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, ["email", "password"]);
      return;
    }

    setIsLoading(true);
    try {
      const outcome = await login(email.trim(), password);
      if (outcome.mfaRequired && outcome.mfaToken) {
        setMfaToken(outcome.mfaToken);
        setStep("mfa");
        return;
      }
      router.replace(getDashboardRoute());
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos iniciar sesión. Intentá de nuevo.",
      );
      setFormError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        focusFirstError(parsed.fieldErrors, ["email", "password"]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!mfaCode.trim()) {
      setFormError("Ingresá el código de verificación.");
      return;
    }
    setIsLoading(true);
    try {
      await loginMfa(mfaToken, mfaCode.trim());
      router.replace(getDashboardRoute());
    } catch (err) {
      setFormError(
        parseApiError(err, "Código incorrecto. Intentá de nuevo.").message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthenticatedRedirect />
      <AuthCard
        title={step === "mfa" ? "Verificación en dos pasos" : "Bienvenido de vuelta"}
        subtitle={
          step === "mfa"
            ? "Ingresá el código de tu app de autenticación"
            : "Ingresá a tu cuenta para continuar"
        }
        footer={
          step === "credentials" ? (
            <>
              ¿No tenés cuenta?{" "}
              <Link
                href={ROUTES.public.register}
                className="font-semibold text-signal-blue hover:underline"
              >
                Registrate
              </Link>
            </>
          ) : undefined
        }
      >
        {step === "mfa" ? (
          <form onSubmit={handleMfaSubmit} className="space-y-5" noValidate>
            <p className="text-body-sm text-slate-gray">
              Abrí tu app de autenticación e ingresá el código de 6 dígitos. Si
              perdiste el dispositivo, podés usar un código de recuperación.
            </p>

            <TextField
              id="mfaCode"
              name="mfaCode"
              label="Código de verificación"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={20}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              disabled={isLoading}
              className="text-center text-2xl tracking-[0.25em]"
              required
            />

            {formError && <Alert variant="error">{formError}</Alert>}

            <Button type="submit" size="lg" fullWidth loading={isLoading}>
              Verificar
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setMfaCode("");
                setFormError(null);
              }}
              className="text-body-sm text-slate-gray transition-colors hover:text-ink-navy"
            >
              Volver
            </button>
          </form>
        ) : (
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError(setFieldErrors, "password");
              }}
              error={fieldErrors.password}
              disabled={isLoading}
              required
              labelAction={
                <Link
                  href="/recuperar-contrasena"
                  className="text-body-sm font-medium text-signal-blue hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              }
            />

            {formError && <Alert variant="error">{formError}</Alert>}

            <Button type="submit" size="lg" fullWidth loading={isLoading}>
              Ingresar
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
