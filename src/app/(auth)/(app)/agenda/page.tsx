"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CaretLeftIcon,
  CaretRightIcon,
  PlusIcon,
  UsersThreeIcon,
  DotsThreeVerticalIcon,
  CheckCircleIcon,
  ProhibitIcon,
  XIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/components/ui/Toast";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { STATUS_META } from "@/lib/appointmentStatus";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import {
  AppointmentStatus,
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
  formatHHmm,
  parseYMDDate,
  timeToMinutes,
  todayYMD as todayYMDInZone,
  wallClockDate,
  wallClockParts,
} from "@/lib/datetime";
import { periodsBounds, resolveDaySchedule } from "@/lib/schedule";
import { capitalize, clientDisplayName } from "@/lib/strings";

const AGENDA_PAGE_SIZE = 50;
const HOUR_HEIGHT = 72;
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

type AppointmentAction = "complete" | "no_show" | "cancel";

const APPOINTMENT_ACTIONS: Record<
  AppointmentAction,
  {
    label: string;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "primary" | "destructive";
  }
> = {
  complete: {
    label: "Marcar como completado",
    title: "Marcar turno como completado",
    description: "El turno quedará marcado como completado.",
    confirmLabel: "Marcar completado",
    variant: "primary",
  },
  no_show: {
    label: "Marcar ausencia",
    title: "Marcar ausencia del cliente",
    description:
      "Se marcará al cliente como ausente. Si querés que no vuelva a reservar, podés bloquearlo desde Configuración › Clientes.",
    confirmLabel: "Marcar ausencia",
    variant: "destructive",
  },
  cancel: {
    label: "Cancelar turno",
    title: "Cancelar turno",
    description:
      "El turno se cancelará y se le avisará al cliente por email.",
    confirmLabel: "Cancelar turno",
    variant: "destructive",
  },
};

const DEFAULT_OPEN = 9 * 60;
const DEFAULT_CLOSE = 18 * 60;

const getTop = (value: string, startHour: number) =>
  Math.max(0, (timeToMinutes(value) - startHour * 60) * PIXELS_PER_MINUTE);

const getHeight = (start: string, end: string) =>
  Math.max((timeToMinutes(end) - timeToMinutes(start)) * PIXELS_PER_MINUTE, 22);

const formatTimeRange = (start: string, end: string) =>
  `${formatHHmm(start)} - ${formatHHmm(end)}`;

const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const getTodayYMD = (timeZone?: string | null) => todayYMDInZone(timeZone);

const getWeekDays = (dateStr: string) => {
  const date = parseYMDDate(dateStr);
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
  const date = parseYMDDate(dateStr);
  const dayName = new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(
    date,
  );
  return `${capitalize(dayName)} ${date.getDate()}`;
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
> = Object.fromEntries(
  Object.entries(STATUS_META).map(([key, meta]) => [
    key,
    {
      container: meta.container,
      accent: meta.solid,
      badge: meta.softBadge,
      dot: meta.solid,
      label: meta.label,
    },
  ]),
);

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
      start: timeToMinutes(apt.startTime),
      end: timeToMinutes(apt.endTime),
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
  canManage,
  onHover,
  onLeave,
  onOpen,
  onMenu,
}: {
  apt: AppointmentResponseDto;
  top: number;
  height: number;
  left: string;
  width: string;
  showStaff: boolean;
  canManage?: boolean;
  onHover?: (apt: AppointmentResponseDto, rect: DOMRect) => void;
  onLeave?: () => void;
  onOpen?: (apt: AppointmentResponseDto, rect: DOMRect) => void;
  onMenu?: (apt: AppointmentResponseDto, rect: DOMRect) => void;
}) {
  const styles = STATUS_STYLES[apt.status] ?? STATUS_STYLES.CONFIRMED;
  const canAct = canManage && apt.status === AppointmentStatus.CONFIRMED;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${apt.service.name}, ${formatTimeRange(apt.startTime, apt.endTime)}, ${apt.staff.customName}`}
      onClick={(e) =>
        onOpen?.(apt, e.currentTarget.getBoundingClientRect())
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(apt, e.currentTarget.getBoundingClientRect());
        }
      }}
      onMouseEnter={(e) => onHover?.(apt, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={onLeave}
      className={`group absolute z-10 cursor-pointer overflow-hidden rounded-lg border p-2 pl-3 text-left shadow-sm transition-shadow hover:shadow-sm-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/40 ${styles.container}`}
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
          {canAct ? (
            <button
              type="button"
              aria-label="Acciones del turno"
              onClick={(e) => {
                e.stopPropagation();
                onMenu?.(apt, e.currentTarget.getBoundingClientRect());
              }}
              className="-mr-1 -mt-1 shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:bg-ink-navy/10 hover:opacity-100 focus-visible:opacity-100"
            >
              <DotsThreeVerticalIcon className="h-4 w-4" weight="bold" />
            </button>
          ) : (
            height >= 56 && (
              <span
                className={`shrink-0 rounded-badges px-1.5 py-0.5 text-caption font-semibold ${styles.badge}`}
              >
                {styles.label}
              </span>
            )
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
  onClose,
}: {
  apt: AppointmentResponseDto;
  left: number;
  top: number;
  below: boolean;
  onClose?: () => void;
}) {
  const styles = STATUS_STYLES[apt.status] ?? STATUS_STYLES.CONFIRMED;

  return (
    <div
      role={onClose ? "dialog" : undefined}
      aria-label={onClose ? "Detalle del turno" : undefined}
      className={`${
        onClose ? "pointer-events-auto" : "pointer-events-none"
      } fixed z-[70] w-64 rounded-xl border border-hairline bg-paper p-3 shadow-sm-3`}
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
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-badges px-2 py-0.5 text-caption font-semibold ${styles.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
            {styles.label}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy"
            >
              <XIcon className="h-3.5 w-3.5" weight="bold" />
            </button>
          )}
        </div>
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
            {clientDisplayName(apt.client)}
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
        {apt.cancelledLate && (
          <p className="flex justify-between gap-3">
            <span className="shrink-0">Cancelación</span>
            <span className="truncate text-right font-medium text-danger">
              Tardía
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
  canManage,
  onHover,
  onLeave,
  onOpen,
  onMenu,
}: {
  columns: AgendaColumn[];
  startHour: number;
  endHour: number;
  hours: number[];
  gridHeight: number;
  now: Date;
  timeZone?: string | null;
  canManage?: boolean;
  onHover: (apt: AppointmentResponseDto, rect: DOMRect) => void;
  onLeave: () => void;
  onOpen: (apt: AppointmentResponseDto, rect: DOMRect) => void;
  onMenu?: (apt: AppointmentResponseDto, rect: DOMRect) => void;
}) {
  const minColumn = columns.length > 4 ? "9rem" : "13rem";
  const template = `4rem repeat(${columns.length}, minmax(${minColumn}, 1fr))`;

  return (
    <div className="max-h-[70dvh] min-h-[320px] overflow-auto sm:min-h-[480px]">
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
            {column.avatar && <Avatar name={column.avatar} size="sm" />}
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
                    canManage={canManage}
                    onHover={onHover}
                    onLeave={onLeave}
                    onOpen={onOpen}
                    onMenu={onMenu}
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
    <EmptyState
      className="px-6 py-24"
      icon={<UsersThreeIcon className="h-7 w-7" weight="regular" />}
      title={
        filtered
          ? "No hay profesionales para ese filtro"
          : "Todavía no cargaste profesionales"
      }
      text={
        filtered
          ? "Probá quitando el filtro para ver la agenda completa."
          : "Cargá a tu equipo para ver la agenda por profesional y asignar turnos."
      }
      action={
        filtered ? (
          <Button variant="outline" onClick={onClearFilter}>
            Quitar filtro
          </Button>
        ) : canManage ? (
          <ButtonLink href={ROUTES.auth.staff}>Agregar profesional</ButtonLink>
        ) : undefined
      }
    />
  );
}

export default function AgendaPage() {
  const { activeWorkspace } = useBusiness();
  const toast = useToast();
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

  const [appointmentMenu, setAppointmentMenu] = useState<{
    apt: AppointmentResponseDto;
    left: number;
    top: number;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    apt: AppointmentResponseDto;
    action: AppointmentAction;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [hoveredAppointment, setHoveredAppointment] = useState<{
    apt: AppointmentResponseDto;
    left: number;
    top: number;
    below: boolean;
  } | null>(null);

  const [selectedAppointment, setSelectedAppointment] = useState<{
    apt: AppointmentResponseDto;
    left: number;
    top: number;
    below: boolean;
  } | null>(null);

  const handleAppointmentHover = (
    apt: AppointmentResponseDto,
    rect: DOMRect,
  ) => {
    // El menú de acciones o el detalle abierto tienen prioridad.
    if (appointmentMenu || selectedAppointment) return;
    const centerX = rect.left + rect.width / 2;
    const below = rect.top < 150;
    const left = Math.min(Math.max(centerX, 148), window.innerWidth - 148);
    const top = below ? rect.bottom + 8 : rect.top - 8;
    setHoveredAppointment({ apt, left, top, below });
  };

  const clearAppointmentHover = () => setHoveredAppointment(null);

  const handleAppointmentOpen = (
    apt: AppointmentResponseDto,
    rect: DOMRect,
  ) => {
    setHoveredAppointment(null);
    const centerX = rect.left + rect.width / 2;
    const below = rect.top < 150;
    const left = Math.min(Math.max(centerX, 148), window.innerWidth - 148);
    const top = below ? rect.bottom + 8 : rect.top - 8;
    setSelectedAppointment({ apt, left, top, below });
  };

  const closeAppointmentDetail = () => setSelectedAppointment(null);

  const openAppointmentMenu = (apt: AppointmentResponseDto, rect: DOMRect) => {
    setHoveredAppointment(null);
    const width = 224;
    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8),
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 168);
    setAppointmentMenu({ apt, left, top });
  };

  const chooseAppointmentAction = (action: AppointmentAction) => {
    if (!appointmentMenu) return;
    setPendingAction({ apt: appointmentMenu.apt, action });
    setAppointmentMenu(null);
  };

  const closeActionModal = () => {
    if (isProcessingAction) return;
    setPendingAction(null);
  };

  const handleAppointmentAction = async () => {
    if (!pendingAction) return;
    const { apt, action } = pendingAction;
    try {
      setIsProcessingAction(true);
      const res =
        action === "cancel"
          ? await api.put<AppointmentResponseDto>(
              `/appointments/${apt.id}/cancel-by-business`,
            )
          : await api.put<AppointmentResponseDto>(
              `/appointments/${apt.id}/status`,
              undefined,
              {
                params: {
                  newStatus: action === "complete" ? "COMPLETED" : "NO_SHOW",
                },
              },
            );
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? res.data : a)),
      );
      const titles: Record<AppointmentAction, string> = {
        complete: "Turno completado",
        no_show: "Ausencia registrada",
        cancel: "Turno cancelado",
      };
      toast.success(titles[action], apt.service.name);
      setPendingAction(null);
    } catch (err) {
      toast.error(
        "No pudimos actualizar el turno",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedAppointment(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
      open = Math.min(open, timeToMinutes(apt.startTime));
      close = Math.max(close, timeToMinutes(apt.endTime));
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

  const isOwner = activeWorkspace?.role === WorkspaceRole.OWNER;
  // El dueño siempre ve todo; el staff sólo si el negocio lo habilita.
  const canViewFullAgenda =
    isOwner || config?.staffCanViewFullAgenda === true;

  const visibleStaff = (() => {
    const base = filterStaffId
      ? staffList.filter((s) => s.id.toString() === filterStaffId)
      : staffList;
    if (canViewFullAgenda) return base;
    const ownStaffId = activeWorkspace?.staffId;
    return ownStaffId != null ? base.filter((s) => s.id === ownStaffId) : base;
  })();

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
            (apt) => wallClockDate(apt.startTime) === dateStr,
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
    <>
      <RoleGuard allowedRoles={[WorkspaceRole.OWNER, WorkspaceRole.STAFF]}>
            <div className="mx-auto max-w-page space-y-6">
              <PageHeader
                section="Agenda"
                title="Turnos programados"
                action={
                  canManage ? (
                    <Button onClick={() => setIsManualModalOpen(true)}>
                      <PlusIcon className="h-4 w-4" weight="bold" />
                      Nuevo turno
                    </Button>
                  ) : undefined
                }
              />

              {error && (
                <ErrorState
                  title="No pudimos cargar la agenda"
                  message={error}
                  onRetry={() => setRefreshTrigger((value) => value + 1)}
                />
              )}

              {loading && appointments.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-hairline bg-paper shadow-sm sm:min-h-[480px]">
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
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline bg-paper text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy sm:h-10 sm:w-10"
                        >
                          <CaretLeftIcon className="h-4 w-4" weight="bold" />
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
                          <div className="flex h-11 min-w-0 items-center truncate rounded-lg border border-hairline bg-pebble px-4 text-body-sm text-ink-navy">
                            {weekRangeLabel}
                          </div>
                        )}

                        <button
                          onClick={handleNextDate}
                          aria-label="Siguiente"
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline bg-paper text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy sm:h-10 sm:w-10"
                        >
                          <CaretRightIcon className="h-4 w-4" weight="bold" />
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
                      {canViewFullAgenda && (
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
                      )}

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

                      <div
                        role="tablist"
                        aria-label="Vista de agenda"
                        className="flex h-11 items-center rounded-lg border border-hairline bg-pebble p-0.5 sm:p-1"
                      >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={view === "day"}
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
                        type="button"
                        role="tab"
                        aria-selected={view === "week"}
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

                  {error ? null : showEmptyState ? (
                    <AgendaEmptyState
                      canManage={canManage}
                      filtered={staffList.length > 0 && !!filterStaffId}
                      onClearFilter={() => setFilterStaffId("")}
                    />
                  ) : (
                    <div
                      aria-busy={loading}
                      className={
                        loading
                          ? "pointer-events-none opacity-60 transition-opacity"
                          : "transition-opacity"
                      }
                    >
                      <AgendaGrid
                        columns={columns}
                        startHour={gridRange.startHour}
                        endHour={gridRange.endHour}
                        hours={hours}
                        gridHeight={gridHeight}
                        now={now}
                        timeZone={timeZone}
                        canManage={canManage}
                        onHover={handleAppointmentHover}
                        onLeave={clearAppointmentHover}
                        onOpen={handleAppointmentOpen}
                        onMenu={openAppointmentMenu}
                      />
                    </div>
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

      <Modal
        open={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualError(null);
        }}
        title="Nuevo turno manual"
      >
        <form className="space-y-5" onSubmit={handleCreateManual}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              id="manual-service"
              label="Servicio"
              value={manualForm.serviceId}
              onChange={(e) =>
                setManualForm({ ...manualForm, serviceId: e.target.value })
              }
              required
            >
              <option value="" disabled>
                Seleccionar...
              </option>
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="manual-staff"
              label="Profesional"
              value={manualForm.staffId}
              onChange={(e) =>
                setManualForm({ ...manualForm, staffId: e.target.value })
              }
              required
            >
              <option value="" disabled>
                Seleccionar...
              </option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.customName}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="manual-date"
              label="Fecha"
              type="date"
              value={manualForm.date}
              onChange={(e) =>
                setManualForm({ ...manualForm, date: e.target.value })
              }
              required
            />
            <TextField
              id="manual-time"
              label="Hora"
              type="time"
              value={manualForm.time}
              onChange={(e) =>
                setManualForm({ ...manualForm, time: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="manual-email"
              label="Email del cliente"
              hint="Para notificaciones (opcional)"
              type="email"
              placeholder="cliente@email.com"
              value={manualForm.guestEmail}
              onChange={(e) =>
                setManualForm({ ...manualForm, guestEmail: e.target.value })
              }
            />
            <TextField
              id="manual-phone"
              label="Teléfono"
              hint="Opcional"
              type="tel"
              placeholder="+54 9 11 1234 5678"
              value={manualForm.guestPhone}
              onChange={(e) =>
                setManualForm({ ...manualForm, guestPhone: e.target.value })
              }
            />
          </div>

          {manualError && <Alert variant="error">{manualError}</Alert>}

          <div className="flex flex-col-reverse gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsManualModalOpen(false);
                setManualError(null);
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={isSaving}>
              Agendar turno
            </Button>
          </div>
        </form>
      </Modal>

      {hoveredAppointment && !selectedAppointment && (
        <AppointmentTooltip
          apt={hoveredAppointment.apt}
          left={hoveredAppointment.left}
          top={hoveredAppointment.top}
          below={hoveredAppointment.below}
        />
      )}

      {selectedAppointment && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-[60]"
            onClick={closeAppointmentDetail}
          />
          <AppointmentTooltip
            apt={selectedAppointment.apt}
            left={selectedAppointment.left}
            top={selectedAppointment.top}
            below={selectedAppointment.below}
            onClose={closeAppointmentDetail}
          />
        </>
      )}

      {appointmentMenu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setAppointmentMenu(null)}
            aria-hidden
          />
          <div
            role="menu"
            className="fixed z-[70] w-56 overflow-hidden rounded-xl border border-hairline bg-paper py-1 shadow-sm-2"
            style={{ left: appointmentMenu.left, top: appointmentMenu.top }}
          >
            <p className="truncate px-4 py-2 text-caption text-slate-gray">
              {appointmentMenu.apt.service.name} ·{" "}
              {formatTimeRange(
                appointmentMenu.apt.startTime,
                appointmentMenu.apt.endTime,
              )}
            </p>
            <div className="border-t border-hairline" />
            <button
              type="button"
              role="menuitem"
              onClick={() => chooseAppointmentAction("complete")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-ink-navy transition-colors hover:bg-pebble"
            >
              <CheckCircleIcon
                className="h-4 w-4 text-success"
                weight="regular"
              />
              {APPOINTMENT_ACTIONS.complete.label}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => chooseAppointmentAction("no_show")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-ink-navy transition-colors hover:bg-pebble"
            >
              <ProhibitIcon className="h-4 w-4 text-danger" weight="regular" />
              {APPOINTMENT_ACTIONS.no_show.label}
            </button>
            <div className="my-1 border-t border-hairline" />
            <button
              type="button"
              role="menuitem"
              onClick={() => chooseAppointmentAction("cancel")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-danger transition-colors hover:bg-danger/5"
            >
              <XCircleIcon className="h-4 w-4" weight="regular" />
              {APPOINTMENT_ACTIONS.cancel.label}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        onClose={closeActionModal}
        title={
          pendingAction ? APPOINTMENT_ACTIONS[pendingAction.action].title : ""
        }
        cancelLabel="Volver"
        confirmLabel={
          pendingAction
            ? APPOINTMENT_ACTIONS[pendingAction.action].confirmLabel
            : ""
        }
        confirmVariant={
          pendingAction
            ? APPOINTMENT_ACTIONS[pendingAction.action].variant
            : "primary"
        }
        loading={isProcessingAction}
        onConfirm={handleAppointmentAction}
        body={
          pendingAction ? (
            <div className="mt-3">
              <p className="text-body-sm text-slate-gray">
                {APPOINTMENT_ACTIONS[pendingAction.action].description}
              </p>
              <p className="mt-3 text-body font-semibold text-ink-navy">
                {pendingAction.apt.service.name}
              </p>
              <p className="text-caption text-slate-gray">
                {formatTimeRange(
                  pendingAction.apt.startTime,
                  pendingAction.apt.endTime,
                )}{" "}
                hs · {clientDisplayName(pendingAction.apt.client)}
              </p>
            </div>
          ) : undefined
        }
      />
    </>
  );
}
