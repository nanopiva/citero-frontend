"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDotsIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ClockIcon,
  GlobeHemisphereWestIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { parseYMDDate, todayYMD, wallClockParts } from "@/lib/datetime";
import { capitalize } from "@/lib/strings";
import {
  ReservationMode,
  type AvailabilityResponseDto,
  type BusinessResponseDto,
  type ServiceResponseDto,
  type StaffResponseDto,
} from "@/types";

type Step = 1 | 2 | 3;

type BookingWizardProps = {
  business: BusinessResponseDto;
  services: ServiceResponseDto[];
  staffList: StaffResponseDto[];
  reservationMode: ReservationMode;
  slug: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;
const WEEKDAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const WEEKDAYS_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function BookingWizard({
  business,
  services,
  staffList,
  reservationMode,
  slug,
}: BookingWizardProps) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const didMountRef = useRef(false);
  useEffect(() => {
    // Al cambiar de paso, mover el foco al título para orientar a lectores de pantalla.
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [currentStep]);
  const [direction, setDirection] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null | undefined>(
    undefined,
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [slotsReloadKey, setSlotsReloadKey] = useState(0);
  const [lockingTime, setLockingTime] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => {
    // Mes actual en la zona horaria del negocio.
    const parts = wallClockParts(new Date(), business.timezone);
    return new Date(parts.year, parts.month - 1, 1);
  });

  useEffect(() => {
    if (!selectedDateStr || !selectedService) return;

    let active = true;
    const fetchAvailability = async () => {
      setFetchingSlots(true);
      setSlotsError(false);
      try {
        const queryParams = new URLSearchParams({
          businessId: business.id.toString(),
          serviceId: selectedService.toString(),
          date: selectedDateStr,
        });
        if (selectedStaff !== null && selectedStaff !== undefined) {
          queryParams.append("staffId", selectedStaff.toString());
        }
        const res = await api.get<AvailabilityResponseDto>(
          `/availability?${queryParams.toString()}`,
        );
        if (active) setAvailableSlots(res.data.availableSlots);
      } catch {
        if (active) {
          setAvailableSlots([]);
          setSlotsError(true);
        }
      } finally {
        if (active) setFetchingSlots(false);
      }
    };
    fetchAvailability();

    return () => {
      active = false;
    };
  }, [selectedDateStr, selectedService, selectedStaff, business.id, slotsReloadKey]);

  const filteredStaff = useMemo(() => {
    if (!selectedService) return [];
    return staffList.filter(
      (staff) =>
        staff.services?.some((service) => service.id === selectedService) ??
        false,
    );
  }, [staffList, selectedService]);

  const selectedServiceObj = useMemo(
    () => services.find((service) => service.id === selectedService) ?? null,
    [services, selectedService],
  );

  const selectedStaffObj = useMemo(
    () =>
      typeof selectedStaff === "number"
        ? staffList.find((staff) => staff.id === selectedStaff) ?? null
        : null,
    [staffList, selectedStaff],
  );

  const staffLabel =
    selectedStaff === null
      ? "Cualquier profesional"
      : (selectedStaffObj?.customName ?? "Profesional");

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // "Hoy" en la zona horaria del negocio. Los YYYY-MM-DD comparan lexicográficamente.
    const todayStr = todayYMD(business.timezone);

    const days: ({ day: number; dateStr: string; disabled: boolean } | null)[] =
      [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        i,
      ).padStart(2, "0")}`;
      days.push({ day: i, dateStr, disabled: dateStr < todayStr });
    }
    return days;
  }, [currentMonth, business.timezone]);

  const nowParts = wallClockParts(new Date(), business.timezone);
  const canGoPrev = !(
    currentMonth.getFullYear() === nowParts.year &&
    currentMonth.getMonth() === nowParts.month - 1
  );

  const morningSlots = availableSlots.filter(
    (time) => Number(time.slice(0, 2)) < 12,
  );
  const afternoonSlots = availableSlots.filter(
    (time) => Number(time.slice(0, 2)) >= 12,
  );

  const dateLabel = selectedDateStr
    ? capitalize(
        parseYMDDate(selectedDateStr).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      )
    : "";

  const goToStep = (next: Step) => {
    setDirection(next >= currentStep ? 1 : -1);
    setCurrentStep(next);
  };

  const handleSelectService = (id: number) => {
    setSelectedService(id);
    setSelectedStaff(undefined);
    setSelectedDateStr(null);
    setSelectedTime(null);
    setAvailableSlots([]);
    goToStep(2);
  };

  const handleSelectStaff = (id: number | null) => {
    setSelectedStaff(id);
    setSelectedDateStr(null);
    setSelectedTime(null);
    setAvailableSlots([]);
    goToStep(3);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSelectedTime(null);
  };

  const handleSelectTime = (time: string) => {
    if (!selectedService || !selectedDateStr) return;
    setSelectedTime(time);
    setLockingTime(time);
    setIsFinishing(true);
    const confirmParams = new URLSearchParams({
      serviceId: selectedService.toString(),
      date: selectedDateStr,
      time,
    });
    if (selectedStaff !== null && selectedStaff !== undefined) {
      confirmParams.append("staffId", selectedStaff.toString());
    }
    router.push(
      `/negocio/${slug}/reservar/confirmacion?${confirmParams.toString()}`,
    );
  };

  const enterX = reduce ? 0 : direction >= 0 ? 24 : -24;
  const exitX = reduce ? 0 : direction >= 0 ? -24 : 24;

  const steps = [
    { id: 1 as Step, label: "Servicio", value: selectedServiceObj?.name },
    {
      id: 2 as Step,
      label: "Profesional",
      value: selectedStaff !== undefined ? staffLabel : undefined,
    },
    {
      id: 3 as Step,
      label: "Fecha y hora",
      value: selectedDateStr ? dateLabel : undefined,
    },
  ];

  const isOtp = reservationMode === ReservationMode.AUTHENTICATED;

  return (
    <>
      <Card>
        <div className="border-b border-hairline pb-5">
          <h2 className="text-body-lg font-semibold text-ink-navy">
            Reservá tu turno
          </h2>
          <p className="mt-1 text-body-sm text-slate-gray">
            Elegí servicio, profesional y horario.
          </p>
          <p className="mt-3 flex items-center gap-2 text-caption text-slate-gray">
            {isOtp ? (
              <ShieldCheckIcon
                className="h-4 w-4 shrink-0 text-deep-cobalt"
                weight="fill"
              />
            ) : (
              <GlobeHemisphereWestIcon
                className="h-4 w-4 shrink-0 text-deep-cobalt"
                weight="fill"
              />
            )}
            {isOtp
              ? "Vas a verificar tu email con un código antes de confirmar."
              : "Reservá sin crear una cuenta."}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mt-6 mb-6 flex items-start">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div
                key={step.id}
                className="relative flex w-full flex-col items-center gap-2"
              >
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-4 z-0 h-0.5 w-full ${
                      isCompleted ? "bg-signal-blue" : "bg-hairline"
                    }`}
                  />
                )}
                <button
                  type="button"
                  disabled={!isCompleted}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => isCompleted && goToStep(step.id)}
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-body-sm font-semibold transition-colors after:absolute after:-inset-1.5 after:rounded-full after:content-[''] ${
                    isCompleted
                      ? "cursor-pointer bg-signal-blue text-paper"
                      : isActive
                        ? "border-2 border-signal-blue bg-paper text-signal-blue"
                        : "border border-hairline bg-paper text-mist-gray"
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4" weight="bold" />
                  ) : (
                    step.id
                  )}
                </button>
                <span
                  className={`w-full truncate px-1 text-center text-caption ${
                    isActive
                      ? "font-semibold text-signal-blue"
                      : isCompleted
                        ? "text-ink-navy"
                        : "text-slate-gray"
                  }`}
                >
                  {step.value ?? step.label}
                </span>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: enterX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: exitX }}
            transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
          >
            {currentStep === 1 && (
              <div>
                <h3
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-body-lg font-semibold text-ink-navy outline-none"
                >
                  Elegí un servicio
                </h3>
                <p className="mt-1 text-body-sm text-slate-gray">
                  Vas a ver la duración y el precio antes de confirmar.
                </p>

                {services.length === 0 ? (
                  <EmptyState
                    icon={<CalendarDotsIcon className="h-6 w-6" weight="regular" />}
                    title="Sin servicios publicados"
                    text="Este negocio todavía no cargó servicios para reservar."
                  />
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {services.map((service) => {
                      const isSelected = selectedService === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelectService(service.id)}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-2 border-signal-blue bg-accent-soft"
                              : "border-hairline bg-paper hover:border-signal-blue/40 hover:bg-pebble"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-body font-semibold text-ink-navy">
                              {service.name}
                            </span>
                            {isSelected && (
                              <CheckCircleIcon
                                className="h-5 w-5 shrink-0 text-signal-blue"
                                weight="fill"
                              />
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-body-sm text-slate-gray">
                            <span className="inline-flex items-center gap-1.5">
                              <ClockIcon className="h-4 w-4" weight="regular" />
                              {service.durationMinutes} min
                            </span>
                            <span className="font-semibold text-ink-navy">
                              {formatCurrency(service.price)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-body-lg font-semibold text-ink-navy outline-none"
                >
                  ¿Con quién querés atenderte?
                </h3>
                <p className="mt-1 text-body-sm text-slate-gray">
                  Elegí un profesional o dejá que asignemos uno automáticamente.
                </p>

                {filteredStaff.length === 0 ? (
                  <EmptyState
                    icon={<UsersThreeIcon className="h-6 w-6" weight="regular" />}
                    title="Sin profesionales"
                    text="No hay personal disponible para este servicio."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToStep(1)}
                      >
                        Elegir otro servicio
                      </Button>
                    }
                  />
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {filteredStaff.length > 1 && (
                      <button
                        type="button"
                        aria-pressed={selectedStaff === null}
                        onClick={() => handleSelectStaff(null)}
                        className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                          selectedStaff === null
                            ? "border-2 border-signal-blue bg-accent-soft"
                            : "border-hairline bg-paper hover:border-signal-blue/40 hover:bg-pebble"
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                            selectedStaff === null
                              ? "bg-signal-blue text-paper"
                              : "bg-pebble text-ink-navy"
                          }`}
                        >
                          <UsersThreeIcon className="h-5 w-5" weight="regular" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-semibold text-ink-navy">
                            Cualquier profesional
                          </span>
                          <span className="block text-caption text-slate-gray">
                            Asignación automática
                          </span>
                        </span>
                      </button>
                    )}

                    {filteredStaff.map((staff) => {
                      const isSelected = selectedStaff === staff.id;
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelectStaff(staff.id)}
                          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-2 border-signal-blue bg-accent-soft"
                              : "border-hairline bg-paper hover:border-signal-blue/40 hover:bg-pebble"
                          }`}
                        >
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body-sm font-semibold ${
                              isSelected
                                ? "bg-signal-blue text-paper"
                                : "bg-pebble text-ink-navy"
                            }`}
                          >
                            {(staff.customName ?? "").slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body font-semibold text-ink-navy">
                              {staff.customName}
                            </span>
                            <span className="block text-caption text-slate-gray">
                              Profesional
                            </span>
                          </span>
                          {isSelected && (
                            <CheckCircleIcon
                              className="h-5 w-5 shrink-0 text-signal-blue"
                              weight="fill"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-body-lg font-semibold text-ink-navy outline-none"
                >
                  Elegí fecha y horario
                </h3>
                <p className="mt-1 text-body-sm text-slate-gray">
                  Solo se muestran los horarios realmente libres.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                  <div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonth(
                            (prev) =>
                              new Date(
                                prev.getFullYear(),
                                prev.getMonth() - 1,
                                1,
                              ),
                          )
                        }
                        disabled={!canGoPrev}
                        aria-label="Mes anterior"
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:h-8 sm:w-8"
                      >
                        <CaretLeftIcon className="h-5 w-5" weight="bold" />
                      </button>
                      <p className="text-body-sm font-semibold capitalize text-ink-navy">
                        {currentMonth.toLocaleString("es-AR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonth(
                            (prev) =>
                              new Date(
                                prev.getFullYear(),
                                prev.getMonth() + 1,
                                1,
                              ),
                          )
                        }
                        aria-label="Mes siguiente"
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy sm:h-8 sm:w-8"
                      >
                        <CaretRightIcon className="h-5 w-5" weight="bold" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-7 gap-1 text-center text-caption font-medium text-slate-gray">
                      {WEEKDAYS.map((day, index) => (
                        <div key={day} className="py-1">
                          <abbr
                            title={WEEKDAYS_FULL[index]}
                            className="no-underline"
                          >
                            {day}
                          </abbr>
                        </div>
                      ))}
                    </div>

                    <div className="mt-1 grid grid-cols-7 gap-1">
                      {calendarDays.map((item, index) => {
                        if (!item) return <div key={`empty-${index}`} />;
                        const isSelected = selectedDateStr === item.dateStr;
                        return (
                          <button
                            key={item.dateStr}
                            type="button"
                            disabled={item.disabled}
                            aria-pressed={isSelected}
                            aria-label={parseYMDDate(
                              item.dateStr,
                            ).toLocaleDateString("es-AR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                            onClick={() => handleSelectDate(item.dateStr)}
                            className={`flex h-10 w-full items-center justify-center rounded-lg text-body-sm transition-colors sm:aspect-square sm:h-auto ${
                              item.disabled
                                ? "cursor-not-allowed text-mist-gray"
                                : isSelected
                                  ? "bg-signal-blue font-semibold text-paper"
                                  : "text-ink-navy hover:bg-pebble"
                            }`}
                          >
                            {item.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:border-l lg:border-hairline lg:pl-8">
                    {!selectedDateStr ? (
                      <EmptyState
                        icon={
                          <CalendarDotsIcon className="h-6 w-6" weight="regular" />
                        }
                        title="Elegí una fecha"
                        text="Los horarios disponibles para ese día van a aparecer acá."
                      />
                    ) : slotsError ? (
                      <EmptyState
                        icon={
                          <WarningCircleIcon className="h-6 w-6" weight="regular" />
                        }
                        title="No pudimos cargar los horarios"
                        text="Revisá tu conexión e intentá de nuevo."
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSlotsReloadKey((key) => key + 1)
                            }
                          >
                            Reintentar
                          </Button>
                        }
                      />
                    ) : fetchingSlots ? (
                      <div>
                        <p className="text-body-sm font-semibold text-ink-navy">
                          {dateLabel}
                        </p>
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {Array.from({ length: 8 }).map((_, index) => (
                            <div
                              key={index}
                              className="h-11 animate-pulse rounded-lg bg-pebble"
                            />
                          ))}
                        </div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <EmptyState
                        icon={
                          <WarningCircleIcon className="h-6 w-6" weight="regular" />
                        }
                        title="Sin horarios libres"
                        text="No quedan turnos para esta fecha. Probá con otro día."
                      />
                    ) : (
                      <div>
                        <p className="text-body-sm font-semibold text-ink-navy">
                          {dateLabel}
                        </p>
                        {[
                          { label: "Mañana", slots: morningSlots },
                          { label: "Tarde", slots: afternoonSlots },
                        ]
                          .filter((group) => group.slots.length > 0)
                          .map((group) => (
                            <div key={group.label} className="mt-4">
                              <p className="text-caption font-semibold uppercase tracking-wider text-slate-gray">
                                {group.label}
                              </p>
                              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {group.slots.map((time) => {
                                  const isSelected = selectedTime === time;
                                  const isLocking = lockingTime === time;
                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      disabled={lockingTime !== null}
                                      aria-pressed={isSelected}
                                      onClick={() => handleSelectTime(time)}
                                      className={`flex h-11 items-center justify-center rounded-lg border text-body-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                                        isLocking
                                          ? "border-signal-blue bg-signal-blue text-paper opacity-100"
                                          : isSelected
                                            ? "border-signal-blue bg-accent-soft text-signal-blue"
                                            : "border-hairline bg-paper text-ink-navy hover:border-signal-blue/40 hover:bg-pebble"
                                      }`}
                                    >
                                      {isLocking ? (
                                        <CircleNotchIcon
                                          className="h-4 w-4 animate-spin"
                                          weight="bold"
                                        />
                                      ) : (
                                        time.slice(0, 5)
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      <AnimatePresence>
        {isFinishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cloud/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <CircleNotchIcon
                className="h-8 w-8 animate-spin text-signal-blue"
                weight="bold"
              />
              <p className="text-body-sm font-medium text-ink-navy">
                Reservando tu lugar...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
