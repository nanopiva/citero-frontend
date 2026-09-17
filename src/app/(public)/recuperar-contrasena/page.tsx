"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { EnvelopeSimple } from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { clearFieldError, focusFirstError, type FieldErrors } from "@/lib/form";
import { validateEmail } from "@/lib/validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, ["email"]);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStep("success");
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos enviar el código. Intentá nuevamente en unos minutos.",
      );
      setFormError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        focusFirstError(parsed.fieldErrors, ["email"]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {step === "form" ? (
          <AuthCard
            key="form"
            title="¿Olvidaste tu contraseña?"
            subtitle="Ingresá el email de tu cuenta y te enviaremos un código para crear una nueva."
            footer={
              <>
                ¿Recordaste tu contraseña?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-signal-blue hover:underline"
                >
                  Iniciar sesión
                </Link>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <TextField
                id="email"
                name="email"
                label="Email de tu cuenta"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError(setFieldErrors, "email");
                }}
                error={fieldErrors.email}
                disabled={isSubmitting}
                required
              />

              {formError && <Alert variant="error">{formError}</Alert>}

              <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
                Enviar código de recuperación
              </Button>
            </form>
          </AuthCard>
        ) : (
          <AuthCard
            key="success"
            icon={<EnvelopeSimple className="h-7 w-7" weight="regular" />}
            title="Revisá tu bandeja de entrada"
            subtitle={`Si existe una cuenta asociada a ${email.trim()}, te enviamos un código de 6 dígitos para restablecer tu contraseña.`}
          >
            <div className="space-y-4">
              <Alert variant="info" title="¿No lo ves?">
                Revisá la carpeta de spam o promociones. El código expira en 10
                minutos.
              </Alert>

              <ButtonLink
                href={`/resetear-contrasena?email=${encodeURIComponent(email.trim())}`}
                size="lg"
                fullWidth
              >
                Ingresar código
              </ButtonLink>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => {
                  setStep("form");
                  setFormError(null);
                }}
              >
                Usar otro email
              </Button>
            </div>
          </AuthCard>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
