"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Buildings,
  CalendarDots,
  CalendarX,
  ClockCountdown,
  UserCircle,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { wallClockToMs } from "@/lib/datetime";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import { useToast } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import {
  AppointmentResponseDto,
  AppointmentStatus,
  PageResponse,
} from "@/types";

type Tab = "futuros" | "pasados";

const EASE = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 10;

const STATUS_META: Record<
  AppointmentStatus,
  { variant: BadgeVariant; label: string }
> = {
  [AppointmentStatus.CONFIRMED]: { variant: "primary", label: "Confirmado" },
  [AppointmentStatus.COMPLETED]: { variant: "success", label: "Completado" },
  [AppointmentStatus.CANCELLED]: { variant: "danger", label: "Cancelado" },
  [AppointmentStatus.NO_SHOW]: { variant: "warning", label: "Ausente" },
};

const TABS: { id: Tab; label: string }[] = [
  { id: "futuros", label: "Próximos" },
  { id: "pasados", label: "Historial" },
];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const formatDateTime = (isoString: string) => {
  const [datePart, timePart] = isoString.split("T");
  const [year, month, day] = datePart.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  return {
    shortWeekday: capitalize(
      dateObj.toLocaleDateString("es-AR", { weekday: "short" }),
    ),
    full: dateObj.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    numeric: `${String(Number(day)).padStart(2, "0")}/${String(
      Number(month),
    ).padStart(2, "0")}`,
    day: String(Number(day)),
    shortMonth: capitalize(
      dateObj.toLocaleDateString("es-AR", { month: "short" }),
    ),
    time: `${timePart.substring(0, 5)} hs`,
  };
};

function DateBlock({
  weekday,
  numeric,
  time,
  variant = "muted",
}: {
  weekday: string;
  numeric: string;
  time: string;
  variant?: "muted" | "highlight";
}) {
  return (
    <div
      className={`flex w-[4.5rem] shrink-0 flex-col items-center rounded-xl px-2 py-2.5 text-center ${
        variant === "highlight"
          ? "border border-[#c7e0ff] bg-paper"
          : "bg-pebble"
      }`}
    >
      <span className="whitespace-nowrap text-caption font-semibold uppercase tracking-wide text-slate-gray">
        {weekday}
      </span>
      <span className="mt-0.5 whitespace-nowrap text-body-sm font-semibold text-ink-navy">
        {numeric}
      </span>
      <span className="mt-0.5 whitespace-nowrap text-caption text-slate-gray">
        {time}
      </span>
    </div>
  );
}

export default function MisTurnosPage() {
  const toast = useToast();
  const minute = useCurrentMinute();
  const [activeTab, setActiveTab] = useState<Tab>("futuros");
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<AppointmentResponseDto | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<PageResponse<AppointmentResponseDto>>(
          "/appointments/my-appointments",
          { params: { size: 1000 } },
        );
        setAppointments(res.data.content);
      } catch (err) {
        setError(
          parseApiError(err, "No pudimos cargar tus turnos. Intentá de nuevo.")
            .message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const { futuros, pasados } = useMemo(() => {
    const nowMs = minute * 60_000;
    const lists = {
      futuros: [] as AppointmentResponseDto[],
      pasados: [] as AppointmentResponseDto[],
    };

    appointments.forEach((apt) => {
      const aptTime = wallClockToMs(apt.startTime, apt.businessTimezone);
      if (aptTime > nowMs && apt.status === AppointmentStatus.CONFIRMED) {
        lists.futuros.push(apt);
      } else {
        lists.pasados.push(apt);
      }
    });

    lists.futuros.sort(
      (a, b) =>
        wallClockToMs(a.startTime, a.businessTimezone) -
        wallClockToMs(b.startTime, b.businessTimezone),
    );
    lists.pasados.sort(
      (a, b) =>
        wallClockToMs(b.startTime, b.businessTimezone) -
        wallClockToMs(a.startTime, a.businessTimezone),
    );

    return lists;
  }, [appointments, minute]);

  const openCancelModal = (apt: AppointmentResponseDto) => {
    setAppointmentToCancel(apt);
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setAppointmentToCancel(null);
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    try {
      setIsCancelling(true);
      const res = await api.put<AppointmentResponseDto>(
        `/appointments/${appointmentToCancel.id}/cancel`,
      );

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentToCancel.id ? res.data : a)),
      );
      closeCancelModal();
      toast.success(
        "Turno cancelado",
        "Te enviamos la confirmación por email.",
      );
    } catch (err) {
      toast.error(
        "No pudimos cancelar el turno",
        parseApiError(err, "Verificá la política de cancelación.").message,
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const nextAppointment = futuros[0] ?? null;
  const upcomingRest = futuros.slice(1);
  const currentList = activeTab === "futuros" ? upcomingRest : pasados;
  const totalCurrent =
    activeTab === "futuros" ? futuros.length : pasados.length;
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const pagedList = currentList.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="min-h-dvh bg-cloud">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-page space-y-6">
            {error && <Alert variant="error">{error}</Alert>}

            <header>
              <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
                Mi cuenta
              </p>
              <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
                Mis turnos
              </h1>
              <p className="mt-2 text-body-sm text-slate-gray">
                Consultá tus próximas reservas y el historial de tus visitas.
              </p>
            </header>

            {!loading && appointments.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-body-sm text-slate-gray">
                <span>
                  <strong className="font-semibold text-ink-navy">
                    {futuros.length}
                  </strong>{" "}
                  {futuros.length === 1 ? "turno próximo" : "turnos próximos"}
                </span>
                <span>
                  <strong className="font-semibold text-ink-navy">
                    {pasados.length}
                  </strong>{" "}
                  en el historial
                </span>
              </div>
            )}

            <div className="flex gap-1 overflow-x-auto border-b border-hairline">
              {TABS.map((tab) => {
                const count = tab.id === "futuros" ? futuros.length : pasados.length;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(0);
                    }}
                    className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-body-sm font-medium transition-colors ${
                      isActive
                        ? "text-ink-navy"
                        : "text-slate-gray hover:text-ink-navy"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-badges px-1.5 py-0.5 text-[11px] font-semibold ${
                        isActive
                          ? "bg-[#e6f0ff] text-deep-cobalt"
                          : "bg-pebble text-slate-gray"
                      }`}
                    >
                      {count}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="mis-turnos-tab"
                        className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-signal-blue"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 40,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-40 animate-pulse rounded-2xl bg-pebble" />
                <div className="h-24 animate-pulse rounded-2xl bg-pebble" />
                <div className="h-24 animate-pulse rounded-2xl bg-pebble" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="space-y-4"
                >
                  {totalCurrent === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
                        {activeTab === "futuros" ? (
                          <CalendarDots
                            className="h-7 w-7"
                            weight="regular"
                          />
                        ) : (
                          <CalendarX className="h-7 w-7" weight="regular" />
                        )}
                      </span>
                      <h3 className="mt-5 text-body-lg font-semibold text-ink-navy">
                        {activeTab === "futuros"
                          ? "No tenés turnos próximos"
                          : "Todavía no tenés historial"}
                      </h3>
                      <p className="mt-2 max-w-sm text-body-sm text-slate-gray">
                        {activeTab === "futuros"
                          ? "Cuando reserves un turno, va a aparecer acá con todos los detalles."
                          : "Acá vas a ver los turnos que ya pasaron, completados o cancelados."}
                      </p>
                    </Card>
                  ) : (
                    <>
                      {activeTab === "futuros" && nextAppointment && (
                        <NextAppointmentCard
                          appointment={nextAppointment}
                          onCancel={() => openCancelModal(nextAppointment)}
                        />
                      )}

                      {currentList.length > 0 && (
                        <Card padded={false} className="overflow-hidden">
                          <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3.5">
                            <h2 className="text-body font-semibold text-ink-navy">
                              {activeTab === "futuros"
                                ? "Más adelante"
                                : "Turnos anteriores"}
                            </h2>
                            <span className="text-caption text-slate-gray">
                              {currentList.length}{" "}
                              {currentList.length === 1 ? "turno" : "turnos"}
                            </span>
                          </div>
                          <ul className="divide-y divide-hairline">
                            {pagedList.map((apt) => {
                              const { shortWeekday, numeric, time } =
                                formatDateTime(apt.startTime);
                              const businessName =
                                apt.businessName ||
                                apt.service.name ||
                                "Negocio no encontrado";
                              const meta = STATUS_META[apt.status];
                              const canCancel =
                                apt.status === AppointmentStatus.CONFIRMED &&
                                wallClockToMs(apt.startTime, apt.businessTimezone) >
                                  minute * 60_000;
                              return (
                                <li
                                  key={apt.id}
                                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-cloud sm:flex-row sm:items-center sm:gap-4"
                                >
                                  <div className="flex min-w-0 items-center gap-4 sm:flex-1">
                                  <DateBlock
                                    weekday={shortWeekday}
                                    numeric={numeric}
                                    time={time}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="truncate text-body font-semibold text-ink-navy">
                                        {apt.service.name}
                                      </p>
                                      <Badge variant={meta.variant}>
                                        {meta.label}
                                      </Badge>
                                    </div>
                                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-body-sm text-slate-gray">
                                      <Buildings
                                        className="h-3.5 w-3.5 shrink-0"
                                        weight="regular"
                                      />
                                      {businessName}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-caption text-slate-gray">
                                      <UserCircle
                                        className="h-3.5 w-3.5 shrink-0"
                                        weight="regular"
                                      />
                                      Con {apt.staff.customName}
                                    </p>
                                  </div>
                                  </div>
                                  {canCancel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full shrink-0 sm:w-auto"
                                      onClick={() => openCancelModal(apt)}
                                    >
                                      Cancelar
                                    </Button>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </Card>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {!loading && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        </main>
      </div>

      <Modal
        open={isCancelModalOpen}
        onClose={closeCancelModal}
        title="Cancelar reserva"
        size="sm"
      >
        {appointmentToCancel && (
          <div className="space-y-5">
            <p className="text-body text-slate-gray">
              Estás a punto de cancelar tu turno de{" "}
              <strong className="text-ink-navy">
                {appointmentToCancel.service.name}
              </strong>{" "}
              para el{" "}
              {formatDateTime(appointmentToCancel.startTime).full} a las{" "}
              {formatDateTime(appointmentToCancel.startTime).time}. Según las
              políticas del negocio, esta acción podría generar una
              penalización.
            </p>

            <div className="flex justify-end gap-3 border-t border-hairline pt-4">
              <Button
                variant="ghost"
                onClick={closeCancelModal}
                disabled={isCancelling}
              >
                Mantener turno
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelAppointment}
                loading={isCancelling}
              >
                Sí, cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function NextAppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: AppointmentResponseDto;
  onCancel: () => void;
}) {
  const { shortWeekday, day, shortMonth, time } = formatDateTime(
    appointment.startTime,
  );
  const businessName =
    appointment.businessName ||
    appointment.service.name ||
    "Negocio no encontrado";

  return (
    <div className="rounded-2xl border border-[#c7e0ff] bg-[#e6f0ff] p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-5">
          <div className="flex w-24 shrink-0 flex-col items-center rounded-xl border border-[#c7e0ff] bg-paper px-2 py-3 text-center">
            <span className="text-caption font-semibold uppercase tracking-wide text-slate-gray">
              {shortWeekday}
            </span>
            <span className="mt-0.5 text-subheading font-bold leading-none text-signal-blue">
              {day}
            </span>
            <span className="mt-1 text-caption font-semibold uppercase tracking-wide text-slate-gray">
              {shortMonth}
            </span>
            <span className="mt-2 text-body-sm font-medium text-ink-navy">
              {time}
            </span>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-badges bg-paper px-2.5 py-1 text-caption font-medium text-deep-cobalt">
              <ClockCountdown className="h-3.5 w-3.5" weight="fill" />
              Próximo turno
            </span>
            <h3 className="mt-2 text-body-lg font-semibold text-ink-navy">
              {appointment.service.name}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-body-sm text-slate-gray">
              <Buildings className="h-4 w-4" weight="regular" />
              {businessName}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-body-sm text-slate-gray">
              <UserCircle className="h-4 w-4" weight="regular" />
              Con {appointment.staff.customName}
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          className="shrink-0"
          onClick={onCancel}
        >
          <CalendarX className="h-4 w-4" weight="bold" />
          Cancelar turno
        </Button>
      </div>
    </div>
  );
}
