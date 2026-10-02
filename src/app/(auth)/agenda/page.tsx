"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  Plus,
  UsersThree,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { useBusiness } from "@/context/BusinessContext";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import {
  ROUTES,
  WorkspaceRole,
  type StaffResponseDto,
  type ServiceResponseDto,
  type AppointmentResponseDto,
  type BusinessConfigResponseDto,
  type BusinessScheduleResponseDto,
  type ScheduleExceptionResponseDto,
  type PageResponse,
} from "@/types";
import {
  todayYMD as todayYMDInZone,
  wallClockParts,
} from "@/lib/datetime";
import { periodsBounds, resolveDaySchedule } from "@/lib/schedule";

const AGENDA_PAGE_SIZE = 50;
const HOUR_HEIGHT = 72;
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

const DEFAULT_OPEN = 9 * 60;
const DEFAULT_CLOSE = 18 * 60;

const parseLocalDateTime = (value: string) => {
  const [datePart, timePart = "00:00:00"] = value.split("T");
  const [hours = 0, minutes = 0] = timePart.split(":").map(Number);
  return { date: datePart, hours, minutes };
};

const minutesOfDay = (value: string) => {
  const { hours, minutes } = parseLocalDateTime(value);
  return hours * 60 + minutes;
};

const timeToMinutes = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const getTop = (value: string, startHour: number) =>
  Math.max(0, (minutesOfDay(value) - startHour * 60) * PIXELS_PER_MINUTE);

const getHeight = (start: string, end: string) =>
  Math.max((minutesOfDay(end) - minutesOfDay(start)) * PIXELS_PER_MINUTE, 22);

const formatTime = (value: string) => {
  const { hours, minutes } = parseLocalDateTime(value);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatTimeRange = (start: string, end: string) =>
  `${formatTime(start)} - ${formatTime(end)}`;

const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const getTodayYMD = (timeZone?: string | null) => todayYMDInZone(timeZone);

const getWeekDays = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.getTime());
  monday.setDate(diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday.getTime());
    nextDay.setDate(monday.getDate() + i);
    const nextDateStr = `${nextDay.getFullYear()}-${String(
      nextDay.getMonth() + 1,
    ).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;
    days.push(nextDateStr);
  }
  return days;
};

const formatDayHeader = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(
    date,
  );
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${date.getDate()}`;
};

const STATUS_STYLES: Record<
  string,
  {
    container: string;
    accent: string;
    badge: string;
    dot: string;
    label: string;
  }
> = {
  CONFIRMED: {
    container: "border-[#c7e0ff] bg-[#e6f0ff] text-ink-navy",
    accent: "bg-signal-blue",
    badge: "bg-paper text-signal-blue",
    dot: "bg-signal-blue",
    label: "Confirmado",
  },
  COMPLETED: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "bg-emerald-500",
    badge: "bg-paper text-emerald-600",
    dot: "bg-emerald-500",
    label: "Completado",
  },
  NO_SHOW: {
    container: "border-amber-200 bg-amber-50 text-amber-700",
    accent: "bg-amber-500",
    badge: "bg-paper text-amber-600",
    dot: "bg-amber-500",
    label: "Ausente",
  },
  CANCELLED: {
    container: "border-red-200 bg-red-50 text-red-600",
    accent: "bg-red-400",
    badge: "bg-paper text-red-500",
    dot: "bg-red-400",
    label: "Cancelado",
  },
};

type PositionedAppointment = {
  apt: AppointmentResponseDto;
  column: number;
  columns: number;
};

const layoutAppointments = (
  appointments: AppointmentResponseDto[],
): PositionedAppointment[] => {
  const items = appointments
    .map((apt) => ({
      apt,
      start: minutesOfDay(apt.startTime),
      end: minutesOfDay(apt.endTime),
      column: 0,
      columns: 1,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const assign = (cluster: typeof items) => {
    const columnEnds: number[] = [];
    for (const item of cluster) {
      let placed = false;
      for (let c = 0; c < columnEnds.length; c++) {
        if (item.start >= columnEnds[c]) {
          item.column = c;
          columnEnds[c] = item.end;
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.column = columnEnds.length;
        columnEnds.push(item.end);
      }
    }
    for (const item of cluster) item.columns = columnEnds.length;
  };

  let cluster: typeof items = [];
  let clusterEnd = -1;
  for (const item of items) {
    if (cluster.length > 0 && item.start >= clusterEnd) {
      assign(cluster);
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length > 0) assign(cluster);

  return items.map((item) => ({
    apt: item.apt,
    column: item.column,
    columns: item.columns,
  }));
};

function AppointmentBlock({
  apt,
  top,
  height,
  left,
  width,
  showStaff,
  onHover,
  onLeave,
}: {
  apt: AppointmentResponseDto;
  top: number;
  height: number;
  left: string;
  width: string;
  showStaff: boolean;
  onHover?: (apt: AppointmentResponseDto, rect: DOMRect) => void;
  onLeave?: () => void;
}) {
  const styles = STATUS_STYLES[apt.status] ?? STATUS_STYLES.CONFIRMED;

  return (
    <div
      onMouseEnter={(e) => onHover?.(apt, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={onLeave}
      className={`absolute z-10 cursor-pointer overflow-hidden rounded-lg border p-2 pl-3 shadow-sm transition-shadow hover:shadow-sm-2 ${styles.container}`}
      style={{ top, height, left, width }}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`}
        aria-hidden
      />
      <div className="flex h-full flex-col gap-0.5">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate text-caption font-semibold">
            {apt.service.name}
          </p>
          {height >= 56 && (
            <span
              className={`shrink-0 rounded-badges px-1.5 py-0.5 text-[10px] font-semibold ${styles.badge}`}
            >
              {styles.label}
            </span>
          )}
        </div>
        {height >= 40 && (
          <p className="truncate text-caption opacity-80">
            {formatTimeRange(apt.startTime, apt.endTime)}
            {showStaff ? ` · ${apt.staff.customName}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function AppointmentTooltip({
  apt,
  left,
  top,
  below,
}: {
  apt: AppointmentResponseDto;
  left: number;
  top: number;
  below: boolean;
}) {
  const styles = STATUS_STYLES[apt.status] ?? STATUS_STYLES.CONFIRMED;

  return (
    <div
      className="pointer-events-none fixed z-[70] w-64 rounded-xl border border-hairline bg-paper p-3 shadow-lg"
      style={{
        left,
        top,
        transform: `translate(-50%, ${below ? 0 : "-100%"})`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-body-sm font-semibold text-ink-navy">
          {apt.service.name}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-badges px-2 py-0.5 text-[10px] font-semibold ${styles.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          {styles.label}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-caption text-slate-gray">
        <p className="flex justify-between gap-3">
          <span className="shrink-0">Horario</span>
          <span className="truncate text-right font-medium text-ink-navy">
            {formatTimeRange(apt.startTime, apt.endTime)} hs
          </span>
        </p>
        <p className="flex justify-between gap-3">
          <span className="shrink-0">Profesional</span>
          <span className="truncate text-right font-medium text-ink-navy">
            {apt.staff.customName}
          </span>
        </p>
        <p className="flex justify-between gap-3">
          <span className="shrink-0">Cliente</span>
          <span className="truncate text-right font-medium text-ink-navy">
            {apt.client.email}
          </span>
        </p>
        {apt.client.phone && (
          <p className="flex justify-between gap-3">
            <span className="shrink-0">Teléfono</span>
            <span className="truncate text-right font-medium text-ink-navy">
              {apt.client.phone}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

type AgendaColumn = {
  key: string;
  label: string;
  sublabel?: string;
  avatar?: string;
  appointments: AppointmentResponseDto[];
  isToday: boolean;
  showStaff: boolean;
};

function AgendaGrid({
  columns,
  startHour,
  endHour,
  hours,
  gridHeight,
  now,
  timeZone,
  onHover,
  onLeave,
}: {
  columns: AgendaColumn[];
  startHour: number;
  endHour: number;
  hours: number[];
  gridHeight: number;
  now: Date;
  timeZone?: string | null;
  onHover: (apt: AppointmentResponseDto, rect: DOMRect) => void;
  onLeave: () => void;
}) {
  const minColumn = columns.length > 4 ? "9rem" : "13rem";
  const template = `4rem repeat(${columns.length}, minmax(${minColumn}, 1fr))`;

  return (
    <div className="max-h-[70dvh] min-h-[480px] overflow-auto">
      <div
        className="grid"
        style={{ gridTemplateColumns: template, minWidth: "100%" }}
      >
        <div className="sticky left-0 top-0 z-40 h-14 border-b border-r border-hairline bg-paper" />
        {columns.map((column) => (
          <div
            key={`head-${column.key}`}
            className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-r border-hairline bg-paper px-3 last:border-r-0"
          >
            {column.avatar && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pebble text-caption font-semibold text-ink-navy">
                {column.avatar}
              </span>
            )}
            <div className="min-w-0">
              <p
                className={`truncate text-body-sm font-semibold ${
                  column.isToday ? "text-signal-blue" : "text-ink-navy"
                }`}
              >
                {column.label}
              </p>
              {column.sublabel && (
                <p className="truncate text-caption text-slate-gray">
                  {column.sublabel}
                </p>
              )}
            </div>
          </div>
        ))}

        <div
          className="sticky left-0 z-20 border-r border-hairline bg-paper"
          style={{ height: gridHeight }}
        >
          <div className="relative h-full">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-hairline"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute right-3 top-1 bg-paper px-1 text-caption text-slate-gray">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
            <span className="absolute bottom-0 right-3 translate-y-1/2 bg-paper px-1 text-caption text-slate-gray">
              {formatHour(endHour)}
            </span>
          </div>
        </div>

        {columns.map((column) => {
          const positioned = layoutAppointments(column.appointments);
          const nowParts = wallClockParts(now, timeZone);
          const nowTop =
            ((nowParts.hours - startHour) * 60 + nowParts.minutes) *
            PIXELS_PER_MINUTE;
          const showNow =
            column.isToday && nowTop >= 0 && nowTop <= gridHeight;

          return (
            <div
              key={`body-${column.key}`}
              className="relative border-r border-hairline last:border-r-0"
              style={{ height: gridHeight }}
            >
              <div className="pointer-events-none absolute inset-0">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-hairline"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <div className="h-1/2 border-b border-dashed border-hairline/60" />
                  </div>
                ))}
              </div>

              {showNow && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20"
                  style={{ top: nowTop }}
                >
                  <div className="relative h-px bg-signal-blue">
                    <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-signal-blue" />
                  </div>
                </div>
              )}

              {positioned.map(({ apt, column: col, columns }) => {
                const height = getHeight(apt.startTime, apt.endTime);
                const top = Math.min(
                  getTop(apt.startTime, startHour),
                  gridHeight - height,
                );
                const width = 100 / columns;
                return (
                  <AppointmentBlock
                    key={apt.id}
                    apt={apt}
                    top={top}
                    height={height}
                    left={`calc(${col * width}% + 2px)`}
                    width={`calc(${width}% - 4px)`}
                    showStaff={column.showStaff}
                    onHover={onHover}
                    onLeave={onLeave}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaEmptyState({
  canManage,
  filtered,
  onClearFilter,
}: {
  canManage: boolean;
  filtered: boolean;
  onClearFilter: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
        <UsersThree className="h-7 w-7" weight="regular" />
      </span>
      <h2 className="mt-5 text-body-lg font-semibold text-ink-navy">
        {filtered
          ? "No hay profesionales para ese filtro"
          : "Todavía no cargaste profesionales"}
      </h2>
      <p className="mt-2 max-w-sm text-body-sm text-slate-gray">
        {filtered
          ? "Probá quitando el filtro para ver la agenda completa."
          : "Cargá a tu equipo para ver la agenda por profesional y asignar turnos."}
      </p>
      {filtered ? (
        <Button variant="outline" className="mt-6" onClick={onClearFilter}>
          Quitar filtro
        </Button>
      ) : (
        canManage && (
          <ButtonLink href={ROUTES.auth.staff} className="mt-6">
            Agregar profesional
          </ButtonLink>
        )
      )}
    </div>
  );
}

export default function AgendaPage() {
  const { activeWorkspace } = useBusiness();
  const timeZone = activeWorkspace?.timezone;
  const canManage = activeWorkspace?.role === WorkspaceRole.OWNER;

  const [staffList, setStaffList] = useState<StaffResponseDto[]>([]);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>(
    [],
  );
  const [config, setConfig] = useState<BusinessConfigResponseDto | null>(null);
  const [schedules, setSchedules] = useState<BusinessScheduleResponseDto[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleExceptionResponseDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [view, setView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(getTodayYMD());
  const [filterStaffId, setFilterStaffId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const [hoveredAppointment, setHoveredAppointment] = useState<{
    apt: AppointmentResponseDto;
    left: number;
    top: number;
    below: boolean;
  } | null>(null);

  const handleAppointmentHover = (
    apt: AppointmentResponseDto,
    rect: DOMRect,
  ) => {
    const centerX = rect.left + rect.width / 2;
    const below = rect.top < 150;
    const left = Math.min(Math.max(centerX, 148), window.innerWidth - 148);
    const top = below ? rect.bottom + 8 : rect.top - 8;
    setHoveredAppointment({ apt, left, top, below });
  };

  const clearAppointmentHover = () => setHoveredAppointment(null);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    serviceId: "",
    staffId: "",
    date: getTodayYMD(),
    time: "10:00",
    guestEmail: "",
    guestPhone: "",
  });

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Al conocerse la zona horaria del negocio, posicionamos el calendario en su "hoy".
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDate(getTodayYMD(timeZone));
  }, [timeZone]);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const todayYMD = getTodayYMD(timeZone);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchBaseData = async () => {
      const bizId = activeWorkspace.businessId;
      try {
        const [staffRes, srvRes] = await Promise.all([
          api.get<StaffResponseDto[]>(`/businesses/${bizId}/staff`),
          api.get<ServiceResponseDto[]>(`/businesses/${bizId}/services`),
        ]);
        setStaffList(staffRes.data);
        setServices(srvRes.data);
      } catch (err) {
        console.error("Error al cargar datos base:", err);
      }

      try {
        const [configRes, schedulesRes, exceptionsRes] = await Promise.all([
          api.get<BusinessConfigResponseDto>(`/businesses/${bizId}/config`),
          api.get<BusinessScheduleResponseDto[]>(
            `/businesses/${bizId}/schedules`,
          ),
          api.get<ScheduleExceptionResponseDto[]>(
            `/businesses/${bizId}/schedule-exceptions`,
          ),
        ]);
        setConfig(configRes.data);
        setSchedules(schedulesRes.data);
        setExceptions(exceptionsRes.data);
      } catch (err) {
        console.error("Error al cargar horarios del negocio:", err);
      }
    };
    fetchBaseData();
  }, [activeWorkspace]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchAgenda = async () => {
      setLoading(true);
      setError(null);
      try {
        const bizId = activeWorkspace.businessId;

        if (view === "day") {
          const aptRes = await api.get<PageResponse<AppointmentResponseDto>>(
            `/appointments?businessId=${bizId}&date=${selectedDate}&page=${page}&size=${AGENDA_PAGE_SIZE}`,
          );
          setAppointments(aptRes.data.content);
          setTotalPages(aptRes.data.totalPages);
        } else {
          const currentWeekDays = getWeekDays(selectedDate);
          const promises = currentWeekDays.map((d) =>
            api.get<PageResponse<AppointmentResponseDto>>(
              `/appointments?businessId=${bizId}&date=${d}&size=100`,
            ),
          );
          const results = await Promise.all(promises);
          setAppointments(results.flatMap((r) => r.data.content));
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error al cargar la agenda", err);
        setError("No pudimos cargar los turnos del calendario.");
      } finally {
        setLoading(false);
      }
    };
    fetchAgenda();
  }, [activeWorkspace, selectedDate, view, refreshTrigger, page]);

  const scheduleFor = (dateStr: string) => {
    const resolved = resolveDaySchedule(dateStr, schedules, exceptions);
    if (resolved) {
      if (resolved.closed) {
        return { open: 0, close: 0, closed: true };
      }
      const bounds = periodsBounds(resolved.periods);
      if (bounds) {
        return { open: bounds.open, close: bounds.close, closed: false };
      }
    }
    return {
      open: timeToMinutes(config?.defaultOpeningTime ?? "09:00:00"),
      close: timeToMinutes(config?.defaultClosingTime ?? "18:00:00"),
      closed: false,
    };
  };

  const gridRange = useMemo(() => {
    const days = view === "day" ? [selectedDate] : weekDays;
    let open = Infinity;
    let close = -Infinity;

    days.forEach((day) => {
      const schedule = scheduleFor(day);
      if (schedule.closed) return;
      open = Math.min(open, schedule.open);
      close = Math.max(close, schedule.close);
    });

    appointments.forEach((apt) => {
      open = Math.min(open, minutesOfDay(apt.startTime));
      close = Math.max(close, minutesOfDay(apt.endTime));
    });

    if (!Number.isFinite(open) || !Number.isFinite(close)) {
      open = config ? timeToMinutes(config.defaultOpeningTime) : DEFAULT_OPEN;
      close = config ? timeToMinutes(config.defaultClosingTime) : DEFAULT_CLOSE;
    }

    const startHour = Math.max(0, Math.floor(open / 60));
    const endHour = Math.min(24, Math.max(startHour + 1, Math.ceil(close / 60)));
    return { startHour, endHour };
    // scheduleFor se recrea en cada render; se listan las fuentes (incl. exceptions).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedDate, weekDays, schedules, exceptions, config, appointments]);

  const hours = useMemo(
    () =>
      Array.from(
        { length: gridRange.endHour - gridRange.startHour },
        (_, i) => gridRange.startHour + i,
      ),
    [gridRange],
  );
  const gridHeight = hours.length * HOUR_HEIGHT;

  const dayIsClosed =
    view === "day" && schedules.length > 0 && scheduleFor(selectedDate).closed;

  const handlePrevDate = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - (view === "week" ? 7 : 1));
    setSelectedDate(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(date.getDate()).padStart(2, "0")}`,
    );
    setPage(0);
  };

  const handleNextDate = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + (view === "week" ? 7 : 1));
    setSelectedDate(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(date.getDate()).padStart(2, "0")}`,
    );
    setPage(0);
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setManualError(null);

    try {
      setIsSaving(true);
      const startTime = `${manualForm.date}T${manualForm.time}:00`;
      const payload = {
        businessId: activeWorkspace.businessId,
        serviceId: Number(manualForm.serviceId),
        staffId: Number(manualForm.staffId),
        startTime,
        guestEmail: manualForm.guestEmail || undefined,
        guestPhone: manualForm.guestPhone || undefined,
      };

      await api.post("/appointments", payload);

      setIsManualModalOpen(false);
      setManualForm({
        serviceId: "",
        staffId: "",
        date: getTodayYMD(timeZone),
        time: "10:00",
        guestEmail: "",
        guestPhone: "",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setManualError(
        parseApiError(err, "No pudimos agendar el turno. Intentá de nuevo.")
          .message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const visibleStaff = filterStaffId
    ? staffList.filter((s) => s.id.toString() === filterStaffId)
    : staffList;

  const filteredAppointments = appointments.filter((apt) => {
    const matchStatus = filterStatus ? apt.status === filterStatus : true;
    const matchStaff = filterStaffId
      ? apt.staff.id.toString() === filterStaffId
      : true;
    return matchStatus && matchStaff;
  });

  const dayAppointmentsFor = (staffId: number) =>
    filteredAppointments.filter((apt) => apt.staff.id === staffId);

  const weekAppointmentsFor = (dateStr: string) =>
    filteredAppointments.filter(
      (apt) => parseLocalDateTime(apt.startTime).date === dateStr,
    );

  const columns: AgendaColumn[] =
    view === "day"
      ? visibleStaff.map((staff) => ({
          key: `staff-${staff.id}`,
          label: staff.customName,
          sublabel: `${dayAppointmentsFor(staff.id).length} turnos`,
          avatar: (staff.customName ?? "").slice(0, 2).toUpperCase(),
          appointments: dayAppointmentsFor(staff.id),
          isToday: selectedDate === todayYMD,
          showStaff: false,
        }))
      : weekDays.map((dayStr) => ({
          key: `day-${dayStr}`,
          label: formatDayHeader(dayStr),
          sublabel: `${weekAppointmentsFor(dayStr).length} turnos`,
          appointments: weekAppointmentsFor(dayStr),
          isToday: dayStr === todayYMD,
          showStaff: true,
        }));

  const weekRangeLabel = `${weekDays[0]
    .split("-")
    .reverse()
    .slice(0, 2)
    .join("/")} - ${weekDays[6].split("-").reverse().slice(0, 2).join("/")}`;

  const showEmptyState = columns.length === 0;

  return (
    <div className="min-h-dvh bg-cloud">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
          <RoleGuard allowedRoles={[WorkspaceRole.OWNER, WorkspaceRole.STAFF]}>
            <div className="mx-auto max-w-page space-y-6">
              <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
                    Agenda
                  </p>
                  <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
                    Turnos programados
                  </h1>
                </div>
                {canManage && (
                  <Button onClick={() => setIsManualModalOpen(true)}>
                    <Plus className="h-4 w-4" weight="bold" />
                    Nuevo turno
                  </Button>
                )}
              </header>

              {error && <Alert variant="error">{error}</Alert>}

              {loading && appointments.length === 0 ? (
                <div className="flex min-h-[480px] items-center justify-center rounded-2xl border border-hairline bg-paper shadow-sm">
                  <Spinner />
                </div>
              ) : (
                <Card padded={false} className="overflow-hidden">
                  <div className="flex flex-col gap-3 border-b border-hairline p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handlePrevDate}
                          aria-label="Anterior"
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-paper text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy"
                        >
                          <CaretLeft className="h-4 w-4" weight="bold" />
                        </button>

                        {view === "day" ? (
                          <div className="w-36 sm:w-40">
                            <Input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setPage(0);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-11 items-center rounded-lg border border-hairline bg-pebble px-4 text-body-sm text-ink-navy">
                            {weekRangeLabel}
                          </div>
                        )}

                        <button
                          onClick={handleNextDate}
                          aria-label="Siguiente"
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-paper text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy"
                        >
                          <CaretRight className="h-4 w-4" weight="bold" />
                        </button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedDate(getTodayYMD(timeZone));
                            setPage(0);
                          }}
                        >
                          Hoy
                        </Button>

                        {dayIsClosed && <Badge variant="neutral">Cerrado</Badge>}
                      </div>

                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                      <Select
                        className="w-full sm:w-64"
                        value={filterStaffId}
                        onChange={(e) => setFilterStaffId(e.target.value)}
                      >
                        <option value="">Todos los profesionales</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id.toString()}>
                            {s.customName}
                          </option>
                        ))}
                      </Select>

                      <Select
                        className="w-full sm:w-56"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">Todos los estados</option>
                        <option value="CONFIRMED">Confirmados</option>
                        <option value="COMPLETED">Completados</option>
                        <option value="NO_SHOW">Ausentes</option>
                        <option value="CANCELLED">Cancelados</option>
                      </Select>

                      <div className="flex h-11 items-center rounded-lg border border-hairline bg-pebble p-1">
                      <button
                        onClick={() => {
                          setView("day");
                          setPage(0);
                        }}
                        className={`h-full rounded-md px-3 text-body-sm font-medium transition-colors ${
                          view === "day"
                            ? "bg-paper text-ink-navy shadow-sm"
                            : "text-slate-gray hover:text-ink-navy"
                        }`}
                      >
                        Día
                      </button>
                      <button
                        onClick={() => {
                          setView("week");
                          setPage(0);
                        }}
                        className={`h-full rounded-md px-3 text-body-sm font-medium transition-colors ${
                          view === "week"
                            ? "bg-paper text-ink-navy shadow-sm"
                            : "text-slate-gray hover:text-ink-navy"
                        }`}
                      >
                        Semana
                      </button>
                      </div>
                    </div>
                  </div>

                  {showEmptyState ? (
                    <AgendaEmptyState
                      canManage={canManage}
                      filtered={staffList.length > 0 && !!filterStaffId}
                      onClearFilter={() => setFilterStaffId("")}
                    />
                  ) : (
                    <AgendaGrid
                      columns={columns}
                      startHour={gridRange.startHour}
                      endHour={gridRange.endHour}
                      hours={hours}
                      gridHeight={gridHeight}
                      now={now}
                      timeZone={timeZone}
                      onHover={handleAppointmentHover}
                      onLeave={clearAppointmentHover}
                    />
                  )}
                </Card>
              )}

              {!loading && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}

              <div className="flex flex-wrap items-center gap-4">
                {Object.entries(STATUS_STYLES).map(([status, styles]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                    <span className="text-caption text-slate-gray">
                      {styles.label}
                    </span>
                  </div>
                ))}
                <Badge className="ml-auto">
                  {filteredAppointments.length} turnos en vista
                </Badge>
              </div>
            </div>
          </RoleGuard>
        </main>
      </div>

      <Modal
        open={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualError(null);
        }}
        title="Nuevo turno manual"
      >
        <form className="space-y-5" onSubmit={handleCreateManual}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Servicio</Label>
              <Select
                required
                className="mt-2"
                value={manualForm.serviceId}
                onChange={(e) =>
                  setManualForm({ ...manualForm, serviceId: e.target.value })
                }
              >
                <option value="" disabled>
                  Seleccionar...
                </option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Profesional</Label>
              <Select
                required
                className="mt-2"
                value={manualForm.staffId}
                onChange={(e) =>
                  setManualForm({ ...manualForm, staffId: e.target.value })
                }
              >
                <option value="" disabled>
                  Seleccionar...
                </option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.customName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Fecha</Label>
              <Input
                required
                type="date"
                className="mt-2"
                value={manualForm.date}
                onChange={(e) =>
                  setManualForm({ ...manualForm, date: e.target.value })
                }
              />
            </div>
            <div>
              <Label required>Hora</Label>
              <Input
                required
                type="time"
                className="mt-2"
                value={manualForm.time}
                onChange={(e) =>
                  setManualForm({ ...manualForm, time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label hint="Para notificaciones (opcional)">
                Email del cliente
              </Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                className="mt-2"
                value={manualForm.guestEmail}
                onChange={(e) =>
                  setManualForm({ ...manualForm, guestEmail: e.target.value })
                }
              />
            </div>
            <div>
              <Label hint="Opcional">Teléfono</Label>
              <Input
                type="tel"
                placeholder="+54 9 11 1234 5678"
                className="mt-2"
                value={manualForm.guestPhone}
                onChange={(e) =>
                  setManualForm({ ...manualForm, guestPhone: e.target.value })
                }
              />
            </div>
          </div>

          {manualError && <Alert variant="error">{manualError}</Alert>}

          <div className="flex justify-end gap-3 border-t border-hairline pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsManualModalOpen(false);
                setManualError(null);
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              Agendar turno
            </Button>
          </div>
        </form>
      </Modal>

      {hoveredAppointment && (
        <AppointmentTooltip
          apt={hoveredAppointment.apt}
          left={hoveredAppointment.left}
          top={hoveredAppointment.top}
          below={hoveredAppointment.below}
        />
      )}
    </div>
  );
}
