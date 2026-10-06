"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  BuildingsIcon,
  CalendarCheckIcon,
  CalendarDotsIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  InfoIcon,
  MapPinIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { wallClockToMs } from "@/lib/datetime";
import { clearFieldError, focusFirstError, type FieldErrors } from "@/lib/form";
import { capitalize } from "@/lib/strings";
import { validateEmail, validateOtp, OTP_LENGTH } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import { Navbar } from "@/components/layout/Navbar";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";

interface PublicAppointment {
  id: number;
  businessName: string;
  slug?: string;
  timezone?: string;
  serviceName: string;
  staffName: string;
  startTime: string;
  endTime: string;
  status: string;
  address: string;
  ownedByViewer: boolean;
}

type Step = "details" | "otp" | "success";

const EASE = [0.16, 1, 0.3, 1] as const;
const RESEND_COOLDOWN_SECONDS = 30;
const FIELD_ORDER = ["email", "otpCode"];

function formatDateTime(isoString: string) {
  const [datePart, timePart] = isoString.split("T");
  const [year, month, day] = datePart.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const weekday = dateObj.toLocaleDateString("es-AR", { weekday: "long" });
  const restOfDate = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    weekday: capitalize(weekday),
    restOfDate,
    time: `${timePart.substring(0, 5)} hs`,
  };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "CANCELLED") return <Badge variant="neutral">Cancelado</Badge>;
  if (status === "NO_SHOW") return <Badge variant="danger">No asistió</Badge>;
  if (status === "COMPLETED") return <Badge variant="primary">Completado</Badge>;
  return <Badge variant="primary">Confirmado</Badge>;
}

function GestionarSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-cloud">
      <Navbar />
      <main className="mx-auto w-full max-w-lg px-4 py-12">
        <div className="h-4 w-16 animate-pulse rounded bg-pebble" />
        <div className="mt-6 h-52 animate-pulse rounded-2xl bg-pebble" />
        <div className="mt-6 h-56 animate-pulse rounded-2xl bg-pebble" />
      </main>
    </div>
  );
}

function GestionarTurnoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initialized } = useAuth();
  const reduce = useReducedMotion();
  const appointmentId = searchParams.get("id");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelledOnLoad, setCancelledOnLoad] = useState(false);
  const [appointment, setAppointment] = useState<PublicAppointment | null>(
    null,
  );
  const [step, setStep] = useState<Step>("details");
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cooldown, setCooldown] = useState(0);

  const minute = useCurrentMinute();
  // Solo se pre-carga el email del usuario si el turno le pertenece; si no,
  // debe escribir el email del cliente del turno para cancelarlo.
  const email =
    emailInput ?? (appointment?.ownedByViewer ? (user?.email ?? "") : "");
  const isOwner = !!appointment?.ownedByViewer;
  const canCancel =
    !!appointment &&
    appointment.status === "CONFIRMED" &&
    wallClockToMs(appointment.startTime, appointment.timezone) >
      minute * 60_000;

  useEffect(() => {
    if (!appointmentId) {
      router.replace("/");
      return;
    }
    // Esperar a que se restaure la sesión para que, si es el cliente logueado,
    // el GET viaje con el Authorization y el backend marque ownedByViewer=true.
    if (!initialized) return;
    let active = true;

    const fetchAppointment = async () => {
      try {
        const res = await api.get<PublicAppointment>(
          `/appointments/public/${appointmentId}`,
          { params: token ? { token } : undefined },
        );
        if (!active) return;
        setAppointment(res.data);
        if (res.data.status === "CANCELLED") {
          setCancelledOnLoad(true);
          setStep("success");
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAppointment();
    return () => {
      active = false;
    };
  }, [appointmentId, token, router, initialized]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!appointment) return;
    setFormError(null);
    setResendMessage(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      focusFirstError({ email: emailError }, FIELD_ORDER);
      return;
    }

    setIsSendingOtp(true);
    try {
      await api.post(
        `/appointments/public/${appointment.id}/send-cancellation-otp`,
        null,
        {
          params: {
            email: email.trim(),
            ...(token ? { token } : {}),
          },
        },
      );
      setStep("otp");
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos enviar el código. Verificá el email e intentá de nuevo.",
      );
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      focusFirstError(parsed.fieldErrors, FIELD_ORDER);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleCancelAsGuest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!appointment) return;
    setFormError(null);

    const otpError = validateOtp(otpCode);
    if (otpError) {
      setFieldErrors({ otpCode: otpError });
      focusFirstError({ otpCode: otpError }, FIELD_ORDER);
      return;
    }

    setIsCancelling(true);
    try {
      await api.put(`/appointments/public/${appointment.id}/cancel`, {
        email: email.trim(),
        otpCode,
      });
      setStep("success");
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos cancelar el turno. Verificá el código e intentá de nuevo.",
      );
      const nextFieldErrors: FieldErrors = { ...parsed.fieldErrors };
      if (
        Object.keys(nextFieldErrors).length === 0 &&
        /c[oó]digo|otp|verific/i.test(parsed.message)
      ) {
        nextFieldErrors.otpCode = parsed.message;
      }
      setFieldErrors(nextFieldErrors);
      setFormError(
        Object.keys(nextFieldErrors).length > 0 ? null : parsed.message,
      );
      focusFirstError(nextFieldErrors, FIELD_ORDER);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelAsOwner = async () => {
    if (!appointment) return;
    setFormError(null);
    setIsCancelling(true);
    try {
      await api.put(`/appointments/${appointment.id}/cancel`);
      setStep("success");
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos cancelar el turno. Verificá la política de cancelación.",
      );
      setFormError(parsed.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResendOtp = async () => {
    if (!appointment) return;
    setFormError(null);
    setResendMessage(null);
    setIsSendingOtp(true);
    try {
      await api.post(
        `/appointments/public/${appointment.id}/send-cancellation-otp`,
        null,
        {
          params: {
            email: email.trim(),
            ...(token ? { token } : {}),
          },
        },
      );
      setResendMessage("Te enviamos un código nuevo. Revisá tu email.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos reenviar el código. Intentá nuevamente.",
      );
      setFormError(parsed.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  if (loading) return <GestionarSkeleton />;

  if (notFound || !appointment) {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="flex max-w-md flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
              <WarningCircleIcon className="h-7 w-7" weight="regular" />
            </span>
            <h1 className="mt-5 text-subheading font-bold leading-subheading text-ink-navy">
              Turno no encontrado
            </h1>
            <p className="mt-2 text-body leading-body-lg text-slate-gray">
              No pudimos encontrar el turno. Es posible que el enlace sea
              incorrecto o que ya no esté disponible.
            </p>
            <ButtonLink href="/" variant="outline" className="mt-6">
              Volver al inicio
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const { weekday, restOfDate, time } = formatDateTime(appointment.startTime);

  if (step === "success") {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
          <motion.div
            className="w-full"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <Card className="text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft text-signal-blue">
                <CheckCircleIcon className="h-10 w-10" weight="fill" />
              </span>
              <h1 className="mt-5 text-subheading font-bold leading-subheading text-ink-navy">
                {cancelledOnLoad
                  ? "Este turno ya estaba cancelado"
                  : "Turno cancelado"}
              </h1>
              <p className="mt-3 text-body leading-body-lg text-slate-gray">
                Tu turno de{" "}
                <strong className="text-ink-navy">
                  {appointment.serviceName}
                </strong>{" "}
                en{" "}
                <strong className="text-ink-navy">
                  {appointment.businessName}
                </strong>{" "}
                fue cancelado.
              </p>
              {!cancelledOnLoad && email && (
                <p className="mt-2 text-body-sm text-slate-gray">
                  Enviamos una confirmación a{" "}
                  <strong className="text-ink-navy">{email}</strong>.
                </p>
              )}

              <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-cloud p-5 text-left">
                <div>
                  <dt className="text-caption text-slate-gray">Fecha</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-ink-navy">
                    {restOfDate}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-slate-gray">Hora</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-ink-navy">
                    {time}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3">
                {appointment.slug && (
                  <ButtonLink
                    href={`/negocio/${appointment.slug}`}
                    fullWidth
                  >
                    Reservar otro turno
                  </ButtonLink>
                )}
                <ButtonLink href="/" variant="outline" fullWidth>
                  Volver al inicio
                </ButtonLink>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cloud">
      <Navbar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1.5 text-body-sm font-medium text-slate-gray transition-colors hover:text-ink-navy"
        >
          <ArrowLeftIcon className="h-4 w-4" weight="bold" />
          Volver
        </button>

        <Card className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-signal-blue">
                <CalendarCheckIcon className="h-6 w-6" weight="regular" />
              </span>
              <h2 className="text-body font-semibold text-ink-navy">
                Detalles del turno
              </h2>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-xl bg-cloud p-4">
            <div className="flex w-20 shrink-0 flex-col items-center rounded-lg bg-pebble px-3 py-2 text-center">
              <span className="text-caption font-semibold uppercase tracking-wider text-slate-gray">
                {weekday}
              </span>
              <span className="mt-0.5 text-body-sm font-semibold text-signal-blue">
                {time}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-body font-semibold text-ink-navy">
                {appointment.serviceName}
              </p>
              <p className="mt-0.5 text-body-sm text-slate-gray">
                {appointment.staffName
                  ? `Con ${appointment.staffName}`
                  : "Cualquier profesional"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-hairline pt-4">
            <p className="flex items-center gap-2 text-body-sm text-slate-gray">
              <CalendarDotsIcon
                className="h-4 w-4 shrink-0"
                weight="regular"
              />
              {restOfDate}
            </p>
            <p className="flex items-center gap-2 text-body-sm text-slate-gray">
              <BuildingsIcon className="h-4 w-4 shrink-0" weight="regular" />
              {appointment.businessName}
            </p>
            {appointment.address && (
              <p className="flex items-center gap-2 text-body-sm text-slate-gray">
                <MapPinIcon className="h-4 w-4 shrink-0" weight="regular" />
                {appointment.address}
              </p>
            )}
          </div>
        </Card>

        <Card>
          {!canCancel ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pebble text-slate-gray">
                  <InfoIcon className="h-6 w-6" weight="regular" />
                </span>
                <div>
                  <h3 className="text-body font-semibold text-ink-navy">
                    Este turno no se puede cancelar
                  </h3>
                  <p className="mt-1 text-body-sm text-slate-gray">
                    El turno está marcado como{" "}
                    {appointment.status === "COMPLETED"
                      ? "completado"
                      : appointment.status === "NO_SHOW"
                        ? "no asistido"
                        : "cerrado"}
                    . Si necesitás ayuda, contactá al negocio.
                  </p>
                </div>
              </div>
              {appointment.slug && (
                <ButtonLink
                  href={`/negocio/${appointment.slug}`}
                  fullWidth
                >
                  Reservar otro turno
                </ButtonLink>
              )}
              <ButtonLink href="/" variant="outline" fullWidth>
                Volver al inicio
              </ButtonLink>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduce ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
              >
                {step === "otp" ? (
                  <form
                    onSubmit={handleCancelAsGuest}
                    className="space-y-5"
                    noValidate
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-signal-blue">
                        <EnvelopeSimpleIcon className="h-6 w-6" weight="regular" />
                      </span>
                      <div>
                        <h3 className="text-body font-semibold text-ink-navy">
                          Código de verificación
                        </h3>
                        <p className="text-caption text-slate-gray">
                          Lo enviamos a {email}
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
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, OTP_LENGTH),
                        );
                        clearFieldError(setFieldErrors, "otpCode");
                      }}
                      error={fieldErrors.otpCode}
                      disabled={isCancelling}
                      className="text-center text-2xl tracking-[0.5em]"
                      required
                    />

                    {resendMessage && (
                      <Alert variant="success">{resendMessage}</Alert>
                    )}
                    {formError && <Alert variant="error">{formError}</Alert>}

                    <Button
                      type="submit"
                      variant="destructive"
                      size="lg"
                      fullWidth
                      loading={isCancelling}
                    >
                      Sí, cancelar mi turno
                    </Button>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isSendingOtp || cooldown > 0}
                        className="text-body-sm font-medium text-signal-blue transition-colors hover:underline disabled:cursor-not-allowed disabled:text-mist-gray disabled:no-underline"
                      >
                        {isSendingOtp
                          ? "Enviando..."
                          : cooldown > 0
                            ? `Reenviar en ${cooldown}s`
                            : "Reenviar código"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("details");
                          setOtpCode("");
                          setFormError(null);
                          setResendMessage(null);
                        }}
                        className="text-body-sm text-slate-gray transition-colors hover:text-ink-navy"
                      >
                        Cambiar email
                      </button>
                    </div>
                  </form>
                ) : isOwner ? (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-body-lg font-semibold text-ink-navy">
                        ¿Querés cancelar este turno?
                      </h3>
                      <p className="mt-1 text-body-sm text-slate-gray">
                        Esta acción no se puede deshacer.
                      </p>
                    </div>

                    <Alert variant="info" title="Identificado como">
                      {user?.email}
                    </Alert>

                    <p className="text-body-sm text-slate-gray">
                      El horario quedará libre para otra persona.
                    </p>

                    {formError && <Alert variant="error">{formError}</Alert>}

                    <div className="flex flex-col gap-3">
                      <Button
                        variant="destructive"
                        size="lg"
                        fullWidth
                        onClick={handleCancelAsOwner}
                        loading={isCancelling}
                      >
                        Sí, cancelar mi turno
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendOtp}
                    className="space-y-5"
                    noValidate
                  >
                    <div>
                      <h3 className="text-body-lg font-semibold text-ink-navy">
                        Cancelá tu turno
                      </h3>
                      <p className="mt-1 text-body-sm text-slate-gray">
                        Ingresá el email con el que reservaste y te enviaremos
                        un código para confirmar la cancelación.
                      </p>
                    </div>

                    <TextField
                      id="email"
                      name="email"
                      label="Email de la reserva"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        clearFieldError(setFieldErrors, "email");
                      }}
                      error={fieldErrors.email}
                      disabled={isSendingOtp}
                      required
                    />

                    {formError && <Alert variant="error">{formError}</Alert>}

                    <div className="flex flex-col gap-3">
                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={isSendingOtp}
                      >
                        Enviar código de verificación
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function GestionarTurnoPage() {
  return (
    <Suspense fallback={<GestionarSkeleton />}>
      <GestionarTurnoContent />
    </Suspense>
  );
}
