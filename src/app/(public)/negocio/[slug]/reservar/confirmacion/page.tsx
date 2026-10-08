"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  StorefrontIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { normalizeUrl } from "@/lib/url";
import { parseApiError } from "@/lib/apiError";
import { formatCurrency } from "@/lib/currency";
import { parseYMDDate } from "@/lib/datetime";
import { clearFieldError, focusFirstError, type FieldErrors } from "@/lib/form";
import { capitalize } from "@/lib/strings";
import { validateEmail, validateOtp, OTP_LENGTH } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Alert } from "@/components/ui/Alert";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { BusinessInfo } from "@/components/booking/BusinessInfo";
import { BookingSummary } from "@/components/booking/BookingSummary";
import {
  ReservationMode,
  type BusinessResponseDto,
  type ServiceResponseDto,
  type StaffResponseDto,
} from "@/types";

interface AppointmentPayload {
  serviceId: number;
  staffId?: number;
  startTime: string;
  guestEmail?: string;
  guestPhone?: string;
  guestName?: string;
  otpCode?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const RESEND_COOLDOWN_SECONDS = 30;
const FIELD_ORDER = ["email", "name", "phone", "otpCode"];

function formatDate(iso: string) {
  const dateObj = parseYMDDate(iso);
  const weekday = dateObj.toLocaleDateString("es-AR", { weekday: "long" });
  const long = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    weekday: capitalize(weekday),
    long,
  };
}

function ConfirmationSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-cloud">
      <Navbar />
      <main className="mx-auto w-full max-w-page px-6 py-10">
        <div className="h-4 w-16 animate-pulse rounded bg-pebble" />
        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-pebble" />
            <div className="h-64 animate-pulse rounded-2xl bg-pebble" />
            <div className="h-72 animate-pulse rounded-2xl bg-pebble" />
          </div>
          <div className="space-y-5">
            <div className="h-16 w-48 animate-pulse rounded-2xl bg-pebble" />
            <div className="h-56 animate-pulse rounded-2xl bg-pebble" />
          </div>
        </div>
      </main>
    </div>
  );
}

function ConfirmacionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const { user, initialized } = useAuth();
  const reduce = useReducedMotion();

  const serviceId = searchParams.get("serviceId");
  const staffId = searchParams.get("staffId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [service, setService] = useState<ServiceResponseDto | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [reservationMode, setReservationMode] = useState<ReservationMode>(
    ReservationMode.PUBLIC,
  );

  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [loadError, setLoadError] = useState<"network" | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cooldown, setCooldown] = useState(0);

  const [guestForm, setGuestForm] = useState({
    email: "",
    name: "",
    phone: "",
  });
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (!serviceId || !date || !time) {
      router.replace(`/negocio/${slug}`);
    }
  }, [serviceId, date, time, slug, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!serviceId || !date || !time) return;
    let active = true;

    const fetchDetails = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const bizRes = await api.get<BusinessResponseDto>(
          `/businesses/${slug}`,
        );
        if (!active) return;
        setBusiness(bizRes.data);

        const configRes = await api
          .get(`/businesses/${bizRes.data.id}/config`)
          .catch(() => ({
            data: { reservationMode: ReservationMode.PUBLIC },
          }));
        if (!active) return;
        setReservationMode(configRes.data.reservationMode as ReservationMode);

        const [servicesRes, staffRes] = await Promise.all([
          api.get<ServiceResponseDto[]>(
            `/businesses/${bizRes.data.id}/services`,
          ),
          api
            .get<StaffResponseDto[]>(`/businesses/${bizRes.data.id}/staff`)
            .catch(() => ({ data: [] as StaffResponseDto[] })),
        ]);
        if (!active) return;

        setService(
          servicesRes.data.find((item) => item.id.toString() === serviceId) ??
            null,
        );

        if (staffId) {
          const staff = staffRes.data.find(
            (item) => item.id.toString() === staffId,
          );
          setStaffName(staff?.customName ?? null);
        }
      } catch (err) {
        if (!active) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        // 404 = enlace inválido (se resuelve como estado "no disponible");
        // cualquier otro fallo = error de red reintentable.
        if (status !== 404) setLoadError("network");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      active = false;
    };
  }, [slug, serviceId, staffId, date, time, reloadKey]);

  const executeReservation = async (
    emailToUse: string,
    phoneToUse?: string,
    nameToUse?: string,
    otpToUse?: string,
  ) => {
    if (!business || !serviceId || !date || !time) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: AppointmentPayload = {
        serviceId: Number(serviceId),
        staffId: staffId ? Number(staffId) : undefined,
        startTime: `${date}T${time}`,
      };

      if (!user) {
        payload.guestEmail = emailToUse;
        if (phoneToUse) payload.guestPhone = phoneToUse;
        if (nameToUse) payload.guestName = nameToUse;
        if (otpToUse) payload.otpCode = otpToUse;
      }

      await api.post("/appointments", payload);
      setStep("success");
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos confirmar el turno. Probá con otro horario.",
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
      setIsSubmitting(false);
    }
  };

  const handleInitialSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setResendMessage(null);

    if (user) {
      await executeReservation(user.email, user.phone);
      return;
    }

    const errors: FieldErrors = {};
    const emailError = validateEmail(guestForm.email);
    if (emailError) errors.email = emailError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, FIELD_ORDER);
      return;
    }

    if (reservationMode === ReservationMode.AUTHENTICATED) {
      setIsSendingOtp(true);
      try {
        await api.post("/otp/send", { target: guestForm.email.trim() });
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
      return;
    }

    await executeReservation(
      guestForm.email.trim(),
      guestForm.phone.trim() || undefined,
      guestForm.name.trim() || undefined,
    );
  };

  const handleVerifyAndBook = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const otpError = validateOtp(otpCode);
    if (otpError) {
      setFieldErrors({ otpCode: otpError });
      focusFirstError({ otpCode: otpError }, ["otpCode"]);
      return;
    }

    await executeReservation(
      guestForm.email.trim(),
      guestForm.phone.trim() || undefined,
      guestForm.name.trim() || undefined,
      otpCode,
    );
  };

  const handleResendOtp = async () => {
    setFormError(null);
    setResendMessage(null);
    setIsSendingOtp(true);
    try {
      await api.post("/otp/send", { target: guestForm.email.trim() });
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

  // Espera a que se restaure la sesión para no mostrar el formulario de invitado
  // a un usuario que en realidad está logueado.
  if (loading || !initialized) return <ConfirmationSkeleton />;

  if (loadError === "network") {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <ErrorState
            title="No pudimos cargar la reserva"
            message="Revisá tu conexión e intentá de nuevo."
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        </div>
      </div>
    );
  }

  if (!service || !business) {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="flex max-w-md flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
              <WarningCircleIcon className="h-7 w-7" weight="regular" />
            </span>
            <h1 className="mt-5 text-subheading font-bold leading-subheading text-ink-navy">
              No pudimos cargar la reserva
            </h1>
            <p className="mt-2 text-body leading-body-lg text-slate-gray">
              El turno que intentás confirmar ya no está disponible o el enlace
              es incorrecto.
            </p>
            <ButtonLink
              href={`/negocio/${slug}`}
              variant="outline"
              className="mt-6"
            >
              Volver al negocio
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const dateInfo = date ? formatDate(date) : null;
  const timeLabel = time ? time.slice(0, 5) : "";
  const isOtp = reservationMode === ReservationMode.AUTHENTICATED;
  const logoUrl = normalizeUrl(business.logoUrl);
  const logoInitials = business.name.slice(0, 2).toUpperCase();
  const emailUsed = user?.email || guestForm.email;

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
                ¡Turno confirmado!
              </h1>
              <p className="mt-3 text-body leading-body-lg text-slate-gray">
                Te esperamos el{" "}
                <strong className="text-ink-navy">{dateInfo?.long}</strong> a
                las <strong className="text-ink-navy">{timeLabel} hs</strong> en{" "}
                <strong className="text-ink-navy">{business.name}</strong>.
              </p>
              <p className="mt-2 text-body-sm text-slate-gray">
                Enviamos el resumen a{" "}
                <strong className="text-ink-navy">{emailUsed}</strong>.
              </p>
              {!user && (
                <p className="mt-2 text-body-sm text-slate-gray">
                  Para gestionar o cancelar el turno, usá el enlace de gestión
                  que enviamos a tu email.
                </p>
              )}

              <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-cloud p-5 text-left">
                <div>
                  <dt className="text-caption text-slate-gray">Servicio</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-ink-navy">
                    {service.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-slate-gray">Profesional</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-ink-navy">
                    {staffName ?? "Cualquier profesional"}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-slate-gray">Duración</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-ink-navy">
                    {service.durationMinutes} min
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-slate-gray">Precio</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-ink-navy">
                    {formatCurrency(service.price)}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  fullWidth
                  onClick={() => router.push(`/negocio/${slug}`)}
                >
                  Volver al negocio
                </Button>
                {user && (
                  <ButtonLink href="/mis-turnos" variant="outline" fullWidth>
                    Ver mis turnos
                  </ButtonLink>
                )}
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
      <main className="mx-auto w-full max-w-page flex-1 px-6 py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-slate-gray transition-colors hover:text-ink-navy"
        >
          <ArrowLeftIcon className="h-4 w-4" weight="bold" />
          Volver
        </button>

        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section className="space-y-6">
            <nav
              aria-label="Pasos de la reserva"
              className="flex flex-wrap items-center gap-2 text-caption text-slate-gray"
            >
              <span>Servicio</span>
              <span aria-hidden>›</span>
              <span>Profesional</span>
              <span aria-hidden>›</span>
              <span>Fecha y hora</span>
              <span aria-hidden>›</span>
              <span className="font-semibold text-ink-navy">Confirmar</span>
            </nav>
            <div>
              <h1 className="text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
                Confirmá tu reserva
              </h1>
              <p className="mt-2 text-body leading-body-lg text-slate-gray">
                Revisá los datos del turno y completá tus datos para finalizar.
              </p>
            </div>

            <BookingSummary
              service={service}
              weekday={dateInfo?.weekday ?? ""}
              dateLong={dateInfo?.long ?? ""}
              timeLabel={timeLabel}
              staffName={staffName}
            />

            <Card>
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
                      onSubmit={handleVerifyAndBook}
                      className="space-y-5"
                      noValidate
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-signal-blue">
                          <EnvelopeSimpleIcon className="h-6 w-6" weight="regular" />
                        </span>
                        <div>
                          <h2 className="text-body font-semibold text-ink-navy">
                            Verificá tu identidad
                          </h2>
                          <p className="text-caption text-slate-gray">
                            Te enviamos un código a {guestForm.email}
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
                        disabled={isSubmitting}
                        className="text-center text-2xl tracking-[0.5em]"
                        required
                      />

                      {resendMessage && (
                        <Alert variant="success">{resendMessage}</Alert>
                      )}
                      {formError && (
                        <Alert variant="error">{formError}</Alert>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={isSubmitting}
                      >
                        Verificar y confirmar turno
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
                  ) : (
                    <form
                      onSubmit={handleInitialSubmit}
                      className="space-y-5"
                      noValidate
                    >
                      <h2 className="text-body-lg font-semibold text-ink-navy">
                        Tus datos
                      </h2>

                      {user ? (
                        <Alert variant="info" title="Reservando con tu cuenta">
                          {user.email}
                        </Alert>
                      ) : (
                        <>
                          {isOtp && (
                            <Alert variant="info">
                              Este negocio verifica tu identidad. Te enviaremos
                              un código a tu email antes de confirmar.
                            </Alert>
                          )}

                          <TextField
                            id="email"
                            name="email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            maxLength={100}
                            placeholder="tu@email.com"
                            value={guestForm.email}
                            onChange={(e) => {
                              setGuestForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }));
                              clearFieldError(setFieldErrors, "email");
                            }}
                            error={fieldErrors.email}
                            disabled={isSubmitting || isSendingOtp}
                            required
                          />

                          <TextField
                            id="name"
                            name="name"
                            label="Nombre"
                            hint="Opcional"
                            autoComplete="name"
                            maxLength={100}
                            placeholder="Tu nombre"
                            value={guestForm.name}
                            onChange={(e) => {
                              setGuestForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }));
                              clearFieldError(setFieldErrors, "name");
                            }}
                            error={fieldErrors.name}
                            disabled={isSubmitting || isSendingOtp}
                          />

                          <TextField
                            id="phone"
                            name="phone"
                            label="Teléfono"
                            hint="Opcional"
                            type="tel"
                            autoComplete="tel"
                            maxLength={20}
                            placeholder="+54 9 11 1234-5678"
                            value={guestForm.phone}
                            onChange={(e) => {
                              setGuestForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }));
                              clearFieldError(setFieldErrors, "phone");
                            }}
                            error={fieldErrors.phone}
                            disabled={isSubmitting || isSendingOtp}
                          />
                        </>
                      )}

                      {formError && <Alert variant="error">{formError}</Alert>}

                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={isSubmitting || isSendingOtp}
                      >
                        {!user && isOtp
                          ? "Enviar código y continuar"
                          : "Confirmar turno"}
                      </Button>

                      {!user && isOtp && (
                        <p className="text-center text-caption text-slate-gray">
                          Al continuar, aceptás recibir un código de
                          verificación en tu correo.
                        </p>
                      )}
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </Card>
          </section>

          <aside className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-hairline bg-paper">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-body-lg font-bold text-ink-navy">
                    {logoInitials}
                  </span>
                )}
              </div>
              <h2 className="text-body-lg font-semibold text-ink-navy">
                {business.name}
              </h2>
            </div>

            {business.description && (
              <p className="text-body-sm text-slate-gray">
                {business.description}
              </p>
            )}

            <BusinessInfo business={business} />
          </aside>
        </div>
      </main>

      <footer className="border-t border-hairline bg-cloud">
        <div className="mx-auto flex max-w-page flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <p className="text-body-sm text-slate-gray">
            Reservas gestionadas con{" "}
            <span className="font-semibold text-ink-navy">Citero</span>
          </p>
          <span className="flex items-center gap-1.5 text-body-sm text-slate-gray">
            <StorefrontIcon className="h-4 w-4" weight="regular" />
            {business.name}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<ConfirmationSkeleton />}>
      <ConfirmacionContent />
    </Suspense>
  );
}
