"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute, ROUTES } from "@/types";
import { parseApiError } from "@/lib/apiError";
import { clearFieldError, focusFirstError, type FieldErrors } from "@/lib/form";
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const isBusinessIntent = searchParams.get("intent") === "business";
  const emailParam = searchParams.get("email") || "";
  const invitationToken = searchParams.get("invitacion") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, ["email", "password"]);
      return;
    }

    setIsLoading(true);
    try {
      await register(
        email.trim(),
        password,
        phone.trim() || undefined,
        invitationToken || undefined,
      );
      router.replace(
        isBusinessIntent ? ROUTES.auth.onboarding : getDashboardRoute(),
      );
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos crear tu cuenta. Verificá los datos e intentá de nuevo.",
      );
      const nextFieldErrors: FieldErrors = { ...parsed.fieldErrors };
      if (parsed.status === 409) {
        nextFieldErrors.email = parsed.message;
      }
      setFieldErrors(nextFieldErrors);
      setFormError(
        Object.keys(nextFieldErrors).length > 0 ? null : parsed.message,
      );
      focusFirstError(nextFieldErrors, ["email", "password", "phone"]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard
        title="Creá tu cuenta"
        subtitle="Empezá a gestionar tus turnos en segundos"
        footer={
          <>
            ¿Ya tenés cuenta?{" "}
            <Link
              href={ROUTES.public.login}
              className="font-semibold text-signal-blue hover:underline"
            >
              Ingresá
            </Link>
          </>
        }
      >
        {invitationToken && (
          <div className="mb-5">
            <Alert variant="info">
              Te invitaron a unirte a un equipo. Creá tu cuenta con este correo
              para quedar vinculado.
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
            Crear cuenta
          </Button>
        </form>
      </AuthCard>

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
