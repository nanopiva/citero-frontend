"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BellRingingIcon,
  CalendarXIcon,
  ClockIcon,
  LinkSimpleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  StorefrontIcon,
  TrashIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { compressImage } from "@/lib/image";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/components/ui/Toast";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DangerZone } from "@/components/ui/DangerZone";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/Input";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { Modal } from "@/components/ui/Modal";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import { Pagination } from "@/components/ui/Pagination";
import { PublicBookingLink } from "@/components/ui/PublicBookingLink";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { SelectField } from "@/components/ui/SelectField";
import { TextareaField } from "@/components/ui/TextareaField";
import { Spinner } from "@/components/ui/Spinner";

import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import {
  BusinessResponseDto,
  BusinessConfigResponseDto,
  BusinessScheduleResponseDto,
  BusinessClientResponseDto,
  BusinessUpdateDto,
  BusinessScheduleRequestDto,
  ScheduleExceptionResponseDto,
  SchedulePeriodDto,
  ReservationMode,
  DayOfWeek,
  WorkspaceRole,
  PageResponse,
} from "@/types";
import { parseYMDDate, DEFAULT_TIMEZONE } from "@/lib/datetime";
import { formatPeriodsLabel, weekdayKey } from "@/lib/schedule";
import { capitalize } from "@/lib/strings";
import { TIMEZONE_GROUPS, isKnownTimezone } from "@/lib/timezones";

const CLIENTS_PAGE_SIZE = 10;
// Se trae todo el conjunto y se filtra/pagina en el cliente (búsqueda sobre todos los registros).
const CLIENTS_FETCH_SIZE = 1000;

interface BusinessConfigRequestForm {
  reservationMode: ReservationMode;
  cancellationToleranceHours: string;
  staffCanViewFullAgenda: boolean;
  defaultOpeningTime: string;
  defaultClosingTime: string;
  enableReminders: boolean;
  reminder24hEnabled: boolean;
  reminder2hEnabled: boolean;
}

const TABS = [
  { id: "general", label: "General" },
  { id: "horarios", label: "Horarios" },
  { id: "excepciones", label: "Excepciones" },
  { id: "reglas", label: "Reglas de reserva" },
  { id: "clientes", label: "Clientes" },
] as const;

const DAYS_TRANSLATION: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Lunes",
  [DayOfWeek.TUESDAY]: "Martes",
  [DayOfWeek.WEDNESDAY]: "Miércoles",
  [DayOfWeek.THURSDAY]: "Jueves",
  [DayOfWeek.FRIDAY]: "Viernes",
  [DayOfWeek.SATURDAY]: "Sábado",
  [DayOfWeek.SUNDAY]: "Domingo",
};

const ORDERED_DAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** Formulario de excepción vacío (estado inicial y al descartar cambios). */
function emptyException() {
  return {
    date: "",
    isClosed: false,
    periods: [{ openTime: "09:00", closeTime: "18:00" }],
  };
}

function formatDateLabel(dateStr: string): string {
  const date = parseYMDDate(dateStr);
  const label = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return capitalize(label);
}

function SectionHeader({
  icon,
  title,
  description,
  hint,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-signal-blue">
        {icon}
      </span>
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-body font-semibold text-ink-navy">{title}</h2>
          {hint && <InfoTooltip text={hint} />}
        </div>
        {description && (
          <p className="mt-0.5 text-body-sm text-slate-gray">{description}</p>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-paper p-4 transition-colors hover:border-signal-blue/30 hover:bg-cloud sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pebble text-ink-navy">
          {icon}
        </span>
        <div>
          <p className="text-body-sm font-medium text-ink-navy">{title}</p>
          <p className="mt-0.5 text-body-sm text-slate-gray">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={title}
      />
    </div>
  );
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const { activeWorkspace, refreshWorkspaces } = useBusiness();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<string>("general");
  const [loading, setLoading] = useState(true);

  // Deep-link: /configuracion?tab=clientes abre directamente ese tab.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && TABS.some((item) => item.id === tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tab);
    }
  }, []);
  const [pageError, setPageError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [schedules, setSchedules] = useState<BusinessScheduleRequestDto[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleExceptionResponseDto[]>(
    [],
  );
  const [isSavingException, setIsSavingException] = useState(false);
  const [exceptionError, setExceptionError] = useState<string | null>(null);
  const [newException, setNewException] = useState<{
    date: string;
    isClosed: boolean;
    periods: SchedulePeriodDto[];
  }>(emptyException());
  const [clients, setClients] = useState<BusinessClientResponseDto[]>(
    [],
  );

  const [generalForm, setGeneralForm] = useState<BusinessUpdateDto>({
    name: "",
    description: "",
    logoUrl: "",
    address: "",
    phone: "",
    whatsappNumber: "",
    coverImageUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    twitterUrl: "",
    latitude: null,
    longitude: null,
    timezone: DEFAULT_TIMEZONE,
  });
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"logo" | "cover" | null>(
    null,
  );
  const [imageError, setImageError] = useState<string | null>(null);

  const [rulesForm, setRulesForm] = useState<BusinessConfigRequestForm>({
    reservationMode: ReservationMode.PUBLIC,
    cancellationToleranceHours: "24",
    staffCanViewFullAgenda: false,
    defaultOpeningTime: "09:00:00",
    defaultClosingTime: "18:00:00",
    enableReminders: true,
    reminder24hEnabled: true,
    reminder2hEnabled: true,
  });
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Baselines para detectar cambios sin guardar y poder revertirlos al cambiar de pestaña.
  const [generalBaseline, setGeneralBaseline] = useState<BusinessUpdateDto | null>(null);
  const [rulesBaseline, setRulesBaseline] = useState<BusinessConfigRequestForm | null>(null);
  const [schedulesBaseline, setSchedulesBaseline] = useState<
    BusinessScheduleRequestDto[] | null
  >(null);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isResolvingTab, setIsResolvingTab] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(0);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [clientReloadKey, setClientReloadKey] = useState(0);
  const [isProcessingClient, setIsProcessingClient] = useState<
    number | null
  >(null);
  const [clientModal, setClientModal] = useState<{
    clientId: number;
    clientEmail: string;
  } | null>(null);
  const [clientReason, setClientReason] = useState("");

  const [isDeleteBusinessModalOpen, setIsDeleteBusinessModalOpen] =
    useState(false);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);
  const [deleteBusinessConfirm, setDeleteBusinessConfirm] = useState("");
  const [deleteBusinessError, setDeleteBusinessError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    // Solo el OWNER gestiona la configuración; se evita disparar endpoints owner-only
    // antes de que RoleGuard resuelva (el STAFF se redirige).
    if (!activeWorkspace || activeWorkspace.role !== WorkspaceRole.OWNER) return;

    const fetchAllData = async () => {
      setLoading(true);
      setPageError(null);
      try {
        const currentBusinessId = activeWorkspace.businessId;
        const bizRes = await api.get<BusinessResponseDto[]>(
          "/businesses/my-businesses",
        );
        const currentBusiness = bizRes.data.find(
          (b) => b.id === currentBusinessId,
        );
        if (!currentBusiness) {
          throw new Error("Negocio no encontrado");
        }
        setBusiness(currentBusiness);
        const nextGeneral: BusinessUpdateDto = {
          name: currentBusiness.name,
          description: currentBusiness.description || "",
          logoUrl: currentBusiness.logoUrl || "",
          address: currentBusiness.address || "",
          phone: currentBusiness.phone || "",
          whatsappNumber: currentBusiness.whatsappNumber || "",
          coverImageUrl: currentBusiness.coverImageUrl || "",
          instagramUrl: currentBusiness.instagramUrl || "",
          facebookUrl: currentBusiness.facebookUrl || "",
          tiktokUrl: currentBusiness.tiktokUrl || "",
          twitterUrl: currentBusiness.twitterUrl || "",
          latitude: currentBusiness.latitude || null,
          longitude: currentBusiness.longitude || null,
          timezone: currentBusiness.timezone || DEFAULT_TIMEZONE,
        };
        setGeneralForm(nextGeneral);
        setGeneralBaseline(nextGeneral);

        const [configRes, schedulesRes, exceptionsRes] = await Promise.all([
          api.get<BusinessConfigResponseDto>(
            `/businesses/${currentBusinessId}/config`,
          ),
          api.get<BusinessScheduleResponseDto[]>(
            `/businesses/${currentBusinessId}/schedules`,
          ),
          api.get<ScheduleExceptionResponseDto[]>(
            `/businesses/${currentBusinessId}/schedule-exceptions`,
          ),
        ]);

        const nextRules: BusinessConfigRequestForm = {
          reservationMode: configRes.data.reservationMode as ReservationMode,
          cancellationToleranceHours: String(
            configRes.data.cancellationToleranceHours ?? 24,
          ),
          staffCanViewFullAgenda:
            configRes.data.staffCanViewFullAgenda ?? false,
          defaultOpeningTime: configRes.data.defaultOpeningTime || "09:00:00",
          defaultClosingTime: configRes.data.defaultClosingTime || "18:00:00",
          enableReminders: configRes.data.enableReminders ?? true,
          reminder24hEnabled: configRes.data.reminder24hEnabled ?? true,
          reminder2hEnabled: configRes.data.reminder2hEnabled ?? true,
        };
        setRulesForm(nextRules);
        setRulesBaseline(nextRules);

        const mappedSchedules = ORDERED_DAYS.map((day) => {
          const existing = schedulesRes.data.find((s) => s.dayOfWeek === day);
          const periods =
            existing && existing.periods && existing.periods.length > 0
              ? existing.periods.map((period) => ({
                  openTime: period.openTime.substring(0, 5),
                  closeTime: period.closeTime.substring(0, 5),
                }))
              : [{ openTime: "09:00", closeTime: "18:00" }];
          return {
            dayOfWeek: day,
            isClosed: existing ? existing.isClosed : false,
            periods,
          };
        });
        setSchedules(mappedSchedules);
        setSchedulesBaseline(mappedSchedules);
        setExceptions(exceptionsRes.data);
      } catch (err) {
        setPageError(
          parseApiError(
            err,
            "No pudimos cargar la configuración del negocio.",
          ).message,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [activeWorkspace, reloadKey]);

  useEffect(() => {
    if (!activeWorkspace || activeWorkspace.role !== WorkspaceRole.OWNER) return;
    let active = true;

    const fetchClients = async () => {
      setClientLoading(true);
      setClientError(null);
      try {
        const res = await api.get<PageResponse<BusinessClientResponseDto>>(
          `/businesses/${activeWorkspace.businessId}/clients`,
          { params: { page: 0, size: CLIENTS_FETCH_SIZE } },
        );
        if (!active) return;
        setClients(res.data.content);
      } catch (err) {
        if (!active) return;
        setClientError(
          parseApiError(err, "No pudimos cargar los clientes.").message,
        );
      } finally {
        if (active) setClientLoading(false);
      }
    };

    fetchClients();
    return () => {
      active = false;
    };
  }, [activeWorkspace, clientReloadKey]);

  const saveGeneral = async (): Promise<boolean> => {
    if (!activeWorkspace) return false;
    try {
      setIsSavingGeneral(true);
      const res = await api.put<BusinessResponseDto>(
        `/businesses/${activeWorkspace.businessId}`,
        generalForm,
      );
      // Actualiza el negocio en memoria (nombre del modal de borrado, etc.).
      setBusiness(res.data);
      const updated: BusinessUpdateDto = {
        ...generalForm,
        name: res.data.name,
        timezone: res.data.timezone || DEFAULT_TIMEZONE,
      };
      setGeneralForm(updated);
      setGeneralBaseline(updated);
      // Refresca el workspace activo para que el panel/agenda usen la nueva zona.
      await refreshWorkspaces();
      toast.success(
        "Datos guardados",
        "Tu perfil público se actualizó correctamente.",
      );
      return true;
    } catch (err) {
      toast.error(
        "No pudimos guardar los datos",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
      return false;
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleSaveGeneral = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveGeneral();
  };

  const handleImageUpload = async (
    type: "logo" | "cover",
    file: File | null,
  ) => {
    if (!file || !business) return;
    setImageError(null);
    setUploadingImage(type);
    try {
      const compressed = await compressImage(
        file,
        type === "logo"
          ? { maxWidth: 512, maxHeight: 512 }
          : { maxWidth: 1600, maxHeight: 1600 },
      );

      // Se valida el 2 MB sobre el archivo ya comprimido (el que se sube).
      if (compressed.size > 2 * 1024 * 1024) {
        setImageError("La imagen supera el máximo de 2 MB.");
        return;
      }

      const formData = new FormData();
      formData.append("file", compressed);

      const res = await api.post<BusinessResponseDto>(
        `/businesses/${business.id}/${type}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setBusiness(res.data);
      setGeneralForm((prev) => ({
        ...prev,
        ...(type === "logo"
          ? { logoUrl: res.data.logoUrl }
          : { coverImageUrl: res.data.coverImageUrl }),
      }));
      toast.success(type === "logo" ? "Logo actualizado" : "Portada actualizada");
    } catch (err) {
      setImageError(
        parseApiError(err, "No pudimos subir la imagen. Intentá nuevamente.")
          .message,
      );
    } finally {
      setUploadingImage(null);
    }
  };

  const normalizeTime = (value: string) =>
    value.length === 5 ? `${value}:00` : value;

  const updateDayPeriods = (
    day: DayOfWeek,
    updater: (periods: SchedulePeriodDto[]) => SchedulePeriodDto[],
  ) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === day ? { ...s, periods: updater(s.periods) } : s,
      ),
    );
  };

  const handlePeriodChange = (
    day: DayOfWeek,
    index: number,
    field: keyof SchedulePeriodDto,
    value: string,
  ) => {
    updateDayPeriods(day, (periods) =>
      periods.map((period, i) =>
        i === index ? { ...period, [field]: value } : period,
      ),
    );
  };

  const handleAddPeriod = (day: DayOfWeek) => {
    updateDayPeriods(day, (periods) => {
      const last = periods[periods.length - 1];
      return [
        ...periods,
        { openTime: last ? last.closeTime : "09:00", closeTime: "18:00" },
      ];
    });
  };

  const handleRemovePeriod = (day: DayOfWeek, index: number) => {
    updateDayPeriods(day, (periods) =>
      periods.length <= 1 ? periods : periods.filter((_, i) => i !== index),
    );
  };

  const handleToggleClosed = (day: DayOfWeek, isClosed: boolean) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, isClosed } : s)),
    );
  };

  const saveSchedules = async (): Promise<boolean> => {
    if (!activeWorkspace) return false;
    try {
      setIsSavingSchedules(true);
      const payload = schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        isClosed: s.isClosed,
        periods: s.isClosed
          ? []
          : s.periods.map((period) => ({
              openTime: normalizeTime(period.openTime),
              closeTime: normalizeTime(period.closeTime),
            })),
      }));
      await api.put(
        `/businesses/${activeWorkspace.businessId}/schedules`,
        payload,
      );
      setSchedulesBaseline(schedules);
      toast.success("Horarios actualizados", "Los cambios ya están activos.");
      return true;
    } catch (err) {
      toast.error(
        "No pudimos actualizar los horarios",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
      return false;
    } finally {
      setIsSavingSchedules(false);
    }
  };

  const handleSaveSchedules = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveSchedules();
  };

  const handleExceptionDateChange = (date: string) => {
    setExceptionError(null);
    setNewException((prev) => {
      if (!date) return { ...prev, date: "" };
      // Precarga el horario semanal de ese día para editar sobre una base conocida.
      const weekly = schedules.find((s) => s.dayOfWeek === weekdayKey(date));
      const periods =
        weekly && weekly.periods.length > 0
          ? weekly.periods.map((period) => ({ ...period }))
          : [{ openTime: "09:00", closeTime: "18:00" }];
      return { date, isClosed: weekly?.isClosed ?? false, periods };
    });
  };

  const handleExceptionPeriodChange = (
    index: number,
    field: keyof SchedulePeriodDto,
    value: string,
  ) => {
    setNewException((prev) => ({
      ...prev,
      periods: prev.periods.map((period, i) =>
        i === index ? { ...period, [field]: value } : period,
      ),
    }));
  };

  const handleAddExceptionPeriod = () => {
    setNewException((prev) => {
      const last = prev.periods[prev.periods.length - 1];
      return {
        ...prev,
        periods: [
          ...prev.periods,
          { openTime: last ? last.closeTime : "09:00", closeTime: "18:00" },
        ],
      };
    });
  };

  const handleRemoveExceptionPeriod = (index: number) => {
    setNewException((prev) => ({
      ...prev,
      periods:
        prev.periods.length <= 1
          ? prev.periods
          : prev.periods.filter((_, i) => i !== index),
    }));
  };

  const saveException = async (): Promise<boolean> => {
    if (!activeWorkspace) return false;
    setExceptionError(null);
    if (!newException.date) {
      setExceptionError("Elegí una fecha para la excepción.");
      return false;
    }
    try {
      setIsSavingException(true);
      const res = await api.put<ScheduleExceptionResponseDto>(
        `/businesses/${activeWorkspace.businessId}/schedule-exceptions`,
        {
          date: newException.date,
          isClosed: newException.isClosed,
          periods: newException.isClosed
            ? []
            : newException.periods.map((period) => ({
                openTime: normalizeTime(period.openTime),
                closeTime: normalizeTime(period.closeTime),
              })),
        },
      );
      setExceptions((prev) =>
        [...prev.filter((item) => item.date !== res.data.date), res.data].sort(
          (a, b) => a.date.localeCompare(b.date),
        ),
      );
      setNewException(emptyException());
      toast.success(
        "Excepción guardada",
        "El horario de esa fecha quedó actualizado.",
      );
      return true;
    } catch (err) {
      setExceptionError(
        parseApiError(err, "No pudimos guardar la excepción.").message,
      );
      return false;
    } finally {
      setIsSavingException(false);
    }
  };

  const handleSaveException = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveException();
  };

  const handleDeleteException = async (date: string) => {
    if (!activeWorkspace) return;
    try {
      await api.delete(
        `/businesses/${activeWorkspace.businessId}/schedule-exceptions/${date}`,
      );
      setExceptions((prev) => prev.filter((item) => item.date !== date));
      toast.success(
        "Excepción eliminada",
        "Esa fecha vuelve a usar el horario semanal.",
      );
    } catch (err) {
      toast.error(
        "No pudimos eliminar la excepción",
        parseApiError(err, "Intentá de nuevo.").message,
      );
    }
  };

  const saveRules = async (): Promise<boolean> => {
    if (!activeWorkspace) return false;

    // Validación en el cliente (el backend también la aplica): tolerancia 0–168 hs.
    const toleranceRaw = rulesForm.cancellationToleranceHours.trim();
    const tolerance = Number(toleranceRaw);
    if (
      toleranceRaw === "" ||
      !Number.isInteger(tolerance) ||
      tolerance < 0 ||
      tolerance > 168
    ) {
      toast.error(
        "Tolerancia inválida",
        "Ingresá un número de horas entre 0 y 168.",
      );
      return false;
    }

    try {
      setIsSavingRules(true);
      await api.put(`/businesses/${activeWorkspace.businessId}/config`, {
        ...rulesForm,
        cancellationToleranceHours: tolerance,
      });
      setRulesBaseline(rulesForm);
      toast.success("Reglas guardadas", "La configuración de reservas cambió.");
      return true;
    } catch (err) {
      toast.error(
        "No pudimos guardar las reglas",
        parseApiError(err, "Revisá los datos e intentá de nuevo.").message,
      );
      return false;
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleSaveRules = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveRules();
  };

  // --- Cambios sin guardar: detección, descarte (revertir) y guardado al cambiar de pestaña ---

  const generalComparable = (form: BusinessUpdateDto) =>
    JSON.stringify({ ...form, logoUrl: undefined, coverImageUrl: undefined });

  const dirtyGeneral =
    generalBaseline !== null &&
    generalComparable(generalForm) !== generalComparable(generalBaseline);
  const dirtyRules =
    rulesBaseline !== null &&
    JSON.stringify(rulesForm) !== JSON.stringify(rulesBaseline);
  const dirtySchedules =
    schedulesBaseline !== null &&
    JSON.stringify(schedules) !== JSON.stringify(schedulesBaseline);
  const dirtyException =
    JSON.stringify(newException) !== JSON.stringify(emptyException());

  const tabIsDirty: Record<string, boolean> = {
    general: dirtyGeneral,
    horarios: dirtySchedules,
    excepciones: dirtyException,
    reglas: dirtyRules,
  };
  const anyDirty =
    dirtyGeneral || dirtyRules || dirtySchedules || dirtyException;

  const tabSaves: Record<string, () => Promise<boolean>> = {
    general: saveGeneral,
    horarios: saveSchedules,
    excepciones: saveException,
    reglas: saveRules,
  };

  const discardGeneral = () => {
    if (!generalBaseline) return;
    // Logo/portada se guardan al subirse: se preservan al revertir el resto.
    setGeneralForm((prev) => ({
      ...generalBaseline,
      logoUrl: prev.logoUrl,
      coverImageUrl: prev.coverImageUrl,
    }));
  };
  const discardRules = () => {
    if (rulesBaseline) setRulesForm(rulesBaseline);
  };
  const discardSchedules = () => {
    if (schedulesBaseline) setSchedules(schedulesBaseline);
  };
  const discardException = () => {
    setExceptionError(null);
    setNewException(emptyException());
  };
  const tabDiscards: Record<string, () => void> = {
    general: discardGeneral,
    horarios: discardSchedules,
    excepciones: discardException,
    reglas: discardRules,
  };

  const requestTabChange = (nextTab: string) => {
    if (nextTab === activeTab) return;
    if (tabIsDirty[activeTab]) {
      setPendingTab(nextTab);
      return;
    }
    setActiveTab(nextTab);
  };

  const handleSaveAndLeaveTab = async () => {
    if (!pendingTab) return;
    const target = pendingTab;
    setIsResolvingTab(true);
    const save = Object.prototype.hasOwnProperty.call(tabSaves, activeTab)
      ? tabSaves[activeTab]
      : undefined;
    const ok = typeof save === "function" ? await save() : false;
    setIsResolvingTab(false);
    // Si no se pudo guardar, se queda en la pestaña para que el usuario corrija.
    if (ok) setActiveTab(target);
    setPendingTab(null);
  };

  const handleDiscardAndLeaveTab = () => {
    if (!pendingTab) return;
    const target = pendingTab;
    const discard = Object.prototype.hasOwnProperty.call(tabDiscards, activeTab)
      ? tabDiscards[activeTab]
      : undefined;
    if (typeof discard === "function") discard();
    setPendingTab(null);
    setActiveTab(target);
  };

  // Aviso nativo al recargar/cerrar con cambios sin guardar.
  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  type ClientAction = "unblock" | "block";

  const handleClientAction = async (
    clientId: number,
    action: ClientAction,
    reason?: string,
  ): Promise<boolean> => {
    if (!activeWorkspace) return false;
    try {
      setIsProcessingClient(clientId);
      const url = `/businesses/${activeWorkspace.businessId}/clients/${clientId}/${action}`;
      const res =
        action === "block"
          ? await api.post<BusinessClientResponseDto>(url, {
              reason: reason?.trim() || null,
            })
          : await api.put<BusinessClientResponseDto>(url);
      setClients((prev) =>
        prev.map((r) => (r.clientId === clientId ? res.data : r)),
      );
      toast.success(
        action === "block" ? "Cliente bloqueado" : "Cliente desbloqueado",
        res.data.clientEmail,
      );
      return true;
    } catch (err) {
      toast.error(
        "No pudimos actualizar el bloqueo",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
      return false;
    } finally {
      setIsProcessingClient(null);
    }
  };

  const openClientModal = (rep: BusinessClientResponseDto) => {
    setClientReason("");
    setClientModal({
      clientId: rep.clientId,
      clientEmail: rep.clientEmail,
    });
  };

  const closeClientModal = () => {
    setClientModal(null);
    setClientReason("");
  };

  const confirmClientAction = async () => {
    if (!clientModal) return;
    const ok = await handleClientAction(
      clientModal.clientId,
      "block",
      clientReason,
    );
    if (ok) closeClientModal();
  };

  const closeDeleteBusinessModal = () => {
    setIsDeleteBusinessModalOpen(false);
    setDeleteBusinessConfirm("");
    setDeleteBusinessError(null);
  };

  const handleDeleteBusiness = async () => {
    if (!business) return;
    setDeleteBusinessError(null);
    try {
      setIsDeletingBusiness(true);
      await api.delete(`/businesses/${business.id}`);
      await refreshWorkspaces();
      setIsDeleteBusinessModalOpen(false);
      setDeleteBusinessConfirm("");
      toast.success(
        "Negocio eliminado",
        "Se borraron todos sus servicios, equipo y turnos.",
      );
      router.push("/dashboard");
    } catch (err) {
      setDeleteBusinessError(
        parseApiError(err, "No pudimos eliminar el negocio. Intentá de nuevo.")
          .message,
      );
    } finally {
      setIsDeletingBusiness(false);
    }
  };

  const filteredClients = useMemo(
    () =>
      clients.filter((r) =>
        r.clientEmail
          .toLowerCase()
          .includes(clientSearch.trim().toLowerCase()),
      ),
    [clients, clientSearch],
  );
  const clientTotalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / CLIENTS_PAGE_SIZE),
  );
  const pagedClients = useMemo(
    () =>
      filteredClients.slice(
        clientPage * CLIENTS_PAGE_SIZE,
        (clientPage + 1) * CLIENTS_PAGE_SIZE,
      ),
    [filteredClients, clientPage],
  );

  useEffect(() => {
    if (clientPage > 0 && clientPage >= clientTotalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClientPage(clientTotalPages - 1);
    }
  }, [clientPage, clientTotalPages]);

  return (
    <>
      <RoleGuard allowedRoles={[WorkspaceRole.OWNER]}>
            {loading ? (
              <PageSkeleton rows={4} />
            ) : pageError ? (
              <div className="mx-auto max-w-page">
                <ErrorState
                  title="No pudimos cargar la configuración"
                  message={pageError}
                  onRetry={() => setReloadKey((key) => key + 1)}
                />
              </div>
            ) : (
              <div className="mx-auto max-w-page space-y-6">
                <PageHeader
                  section="Ajustes"
                  title="Configuración"
                  description="Administrá la información, reglas y horarios de tu negocio."
                />

                <Card padded={false} className="overflow-hidden">
                  <div
                    role="tablist"
                    className="flex gap-1 overflow-x-auto border-b border-hairline px-2 sm:px-4"
                  >
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => requestTabChange(tab.id)}
                        className={`relative whitespace-nowrap px-4 py-3.5 text-body-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? "text-ink-navy"
                            : "text-slate-gray hover:text-ink-navy"
                        }`}
                      >
                        {tab.label}
                        {tabIsDirty[tab.id] && (
                          <span
                            className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-warning align-middle"
                            aria-hidden
                          />
                        )}
                        {activeTab === tab.id && (
                          <motion.span
                            layoutId="config-tab-indicator"
                            className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-signal-blue"
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div role="tabpanel" className="p-5 sm:p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: EASE }}
                      >
                        {activeTab === "general" && business && (
                          <div className="space-y-8">
                          <form
                            key={business.id}
                            className="space-y-8"
                            onSubmit={handleSaveGeneral}
                          >
                            <section className="space-y-5">
                              <SectionHeader
                                icon={
                                  <StorefrontIcon
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Información básica"
                                description="Datos visibles en tu perfil público."
                              />

                              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField
                                  id="business-name"
                                  label="Nombre del negocio"
                                  hint="El nombre comercial público."
                                  value={generalForm.name ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      name: e.target.value,
                                    })
                                  }
                                  maxLength={100}
                                  required
                                />
                                <TextField
                                  id="business-slug"
                                  label="Slug (URL)"
                                  hint="URL amigable (no editable)."
                                  value={business.slug}
                                  disabled
                                />
                              </div>

                              <PublicBookingLink slug={business.slug} />

                              <TextareaField
                                id="business-description"
                                label="Descripción"
                                hint="Una breve descripción que verán tus clientes al reservar."
                                maxLength={1000}
                                value={generalForm.description ?? ""}
                                onChange={(e) =>
                                  setGeneralForm({
                                    ...generalForm,
                                    description: e.target.value,
                                  })
                                }
                              />

                              {imageError && (
                                <Alert variant="error">{imageError}</Alert>
                              )}

                              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <ImageUploader
                                  variant="logo"
                                  value={generalForm.logoUrl || null}
                                  label="Logo del negocio"
                                  hint="JPG, PNG o WebP. Cuadrado, se redimensiona a 512×512 (máx. 2 MB)."
                                  loading={uploadingImage === "logo"}
                                  onChange={(file) =>
                                    handleImageUpload("logo", file)
                                  }
                                />
                                <ImageUploader
                                  variant="cover"
                                  value={generalForm.coverImageUrl || null}
                                  label="Imagen de portada"
                                  hint="JPG, PNG o WebP. Horizontal, se redimensiona a 1600px (máx. 2 MB)."
                                  loading={uploadingImage === "cover"}
                                  onChange={(file) =>
                                    handleImageUpload("cover", file)
                                  }
                                />
                              </div>
                            </section>

                            <section className="space-y-5 border-t border-hairline pt-8">
                              <SectionHeader
                                icon={
                                  <MapPinIcon className="h-5 w-5" weight="regular" />
                                }
                                title="Ubicación y contacto"
                                description="Buscá tu dirección y guardamos las coordenadas automáticamente."
                              />

                              <LocationPicker
                                value={{
                                  address: generalForm.address ?? "",
                                  latitude: generalForm.latitude ?? null,
                                  longitude: generalForm.longitude ?? null,
                                }}
                                onChange={(location) =>
                                  setGeneralForm({
                                    ...generalForm,
                                    address: location.address,
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                  })
                                }
                              />

                              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField
                                  id="business-phone"
                                  label="Teléfono"
                                  hint="Teléfono de contacto del negocio."
                                  placeholder="+54 11 1234-5678"
                                  maxLength={30}
                                  value={generalForm.phone ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      phone: e.target.value,
                                    })
                                  }
                                />
                                <TextField
                                  id="business-whatsapp"
                                  label="WhatsApp"
                                  hint="WhatsApp con código de país."
                                  placeholder="+5491112345678"
                                  maxLength={30}
                                  value={generalForm.whatsappNumber ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      whatsappNumber: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <SelectField
                                id="business-timezone"
                                label="Zona horaria"
                                hint="Define en qué zona se muestran los turnos y horarios del negocio."
                                value={generalForm.timezone ?? DEFAULT_TIMEZONE}
                                onChange={(e) =>
                                  setGeneralForm({
                                    ...generalForm,
                                    timezone: e.target.value,
                                  })
                                }
                              >
                                {generalForm.timezone &&
                                  !isKnownTimezone(generalForm.timezone) && (
                                    <option value={generalForm.timezone}>
                                      {generalForm.timezone}
                                    </option>
                                  )}
                                {TIMEZONE_GROUPS.map((group) => (
                                  <optgroup
                                    key={group.region}
                                    label={group.region}
                                  >
                                    {group.zones.map((zone) => (
                                      <option
                                        key={zone.value}
                                        value={zone.value}
                                      >
                                        {zone.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </SelectField>
                            </section>

                            <section className="space-y-5 border-t border-hairline pt-8">
                              <SectionHeader
                                icon={
                                  <LinkSimpleIcon
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Redes sociales"
                                description="Enlaces para que los clientes puedan seguirte."
                              />

                              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField
                                  id="business-instagram"
                                  label="Instagram"
                                  placeholder="https://instagram.com/tunegocio"
                                  value={generalForm.instagramUrl ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      instagramUrl: e.target.value,
                                    })
                                  }
                                />
                                <TextField
                                  id="business-facebook"
                                  label="Facebook"
                                  placeholder="https://facebook.com/tunegocio"
                                  value={generalForm.facebookUrl ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      facebookUrl: e.target.value,
                                    })
                                  }
                                />
                                <TextField
                                  id="business-tiktok"
                                  label="TikTok"
                                  placeholder="https://tiktok.com/@tunegocio"
                                  value={generalForm.tiktokUrl ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      tiktokUrl: e.target.value,
                                    })
                                  }
                                />
                                <TextField
                                  id="business-twitter"
                                  label="Twitter / X"
                                  placeholder="https://twitter.com/tunegocio"
                                  value={generalForm.twitterUrl ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      twitterUrl: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </section>

                            <div className="flex justify-end border-t border-hairline pt-5">
                              <Button type="submit" loading={isSavingGeneral}>
                                Guardar cambios
                              </Button>
                            </div>
                          </form>

                          <DangerZone
                            title="Zona de peligro"
                            description="Eliminar el negocio borra sus servicios, equipo, turnos y clientes. Esta acción no se puede deshacer."
                            action={
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  setIsDeleteBusinessModalOpen(true)
                                }
                              >
                                <TrashIcon className="h-4 w-4" weight="bold" />
                                Eliminar negocio
                              </Button>
                            }
                          />
                          </div>
                        )}

                        {activeTab === "horarios" && (
                          <form
                            className="space-y-6"
                            onSubmit={handleSaveSchedules}
                          >
                            <SectionHeader
                              icon={<ClockIcon className="h-5 w-5" weight="regular" />}
                              title="Horarios de atención"
                              description="Cargá una o más franjas por día (por ejemplo, mañana y tarde). Los clientes solo verán turnos dentro de estas franjas."
                            />

                            <div className="space-y-3">
                              {schedules.map((day) => (
                                <div
                                  key={day.dayOfWeek}
                                  className="rounded-xl border border-hairline bg-paper p-4 transition-colors hover:border-signal-blue/30"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <p className="text-body-sm font-semibold text-ink-navy">
                                      {DAYS_TRANSLATION[day.dayOfWeek]}
                                    </p>
                                    <label className="flex cursor-pointer items-center gap-2">
                                      <span className="text-body-sm text-slate-gray">
                                        Cerrado
                                      </span>
                                      <Switch
                                        checked={day.isClosed}
                                        onChange={(value) =>
                                          handleToggleClosed(day.dayOfWeek, value)
                                        }
                                        label={`Cerrar ${DAYS_TRANSLATION[day.dayOfWeek]}`}
                                      />
                                    </label>
                                  </div>

                                  {!day.isClosed && (
                                    <div className="mt-3 space-y-2">
                                      {day.periods.map((period, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <Input
                                              type="time"
                                              className="min-w-0"
                                              aria-label={`Apertura ${DAYS_TRANSLATION[day.dayOfWeek]}`}
                                              value={period.openTime}
                                              onChange={(e) =>
                                                handlePeriodChange(
                                                  day.dayOfWeek,
                                                  index,
                                                  "openTime",
                                                  e.target.value,
                                                )
                                              }
                                              required
                                            />
                                          </div>
                                          <span className="text-body-sm text-slate-gray">
                                            a
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <Input
                                              type="time"
                                              className="min-w-0"
                                              aria-label={`Cierre ${DAYS_TRANSLATION[day.dayOfWeek]}`}
                                              value={period.closeTime}
                                              onChange={(e) =>
                                                handlePeriodChange(
                                                  day.dayOfWeek,
                                                  index,
                                                  "closeTime",
                                                  e.target.value,
                                                )
                                              }
                                              required
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemovePeriod(
                                                day.dayOfWeek,
                                                index,
                                              )
                                            }
                                            disabled={day.periods.length <= 1}
                                            aria-label={`Quitar franja de ${DAYS_TRANSLATION[day.dayOfWeek]}`}
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:w-9"
                                          >
                                            <TrashIcon
                                              className="h-4 w-4"
                                              weight="regular"
                                            />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => handleAddPeriod(day.dayOfWeek)}
                                        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-signal-blue transition-colors hover:text-deep-cobalt"
                                      >
                                        <PlusIcon className="h-4 w-4" weight="bold" />
                                        Agregar franja
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end border-t border-hairline pt-5">
                              <Button type="submit" loading={isSavingSchedules}>
                                Actualizar horarios
                              </Button>
                            </div>
                          </form>
                        )}

                        {activeTab === "excepciones" && (
                          <div className="space-y-8">
                            <SectionHeader
                              icon={
                                <CalendarXIcon className="h-5 w-5" weight="regular" />
                              }
                              title="Excepciones"
                              description="Cambiá el horario de una fecha puntual (un feriado, un corte de mediodía) sin tocar la regla semanal."
                              hint="Una excepción reemplaza el horario de ese día. Si la eliminás, esa fecha vuelve a usar el horario semanal."
                            />

                            <form
                              className="space-y-5 rounded-xl border border-hairline bg-paper p-5"
                              onSubmit={handleSaveException}
                            >
                              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField
                                  id="exception-date"
                                  label="Fecha"
                                  hint="La fecha de la excepción."
                                  type="date"
                                  value={newException.date}
                                  onChange={(e) =>
                                    handleExceptionDateChange(e.target.value)
                                  }
                                  required
                                />
                                <div className="flex items-end">
                                  <div className="w-full">
                                    <ToggleRow
                                      icon={
                                        <CalendarXIcon
                                          className="h-4 w-4"
                                          weight="regular"
                                        />
                                      }
                                      title="Cerrado todo el día"
                                      description="No se ofrecerán turnos esa fecha."
                                      checked={newException.isClosed}
                                      onChange={(value) =>
                                        setNewException((prev) => ({
                                          ...prev,
                                          isClosed: value,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              {!newException.isClosed && (
                                <div className="space-y-2">
                                  <p className="text-body-sm font-medium text-ink-navy">
                                Franjas de ese día
                              </p>
                                  {newException.periods.map((period, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <Input
                                          type="time"
                                          className="min-w-0"
                                          aria-label="Apertura de la excepción"
                                          value={period.openTime}
                                          onChange={(e) =>
                                            handleExceptionPeriodChange(
                                              index,
                                              "openTime",
                                              e.target.value,
                                            )
                                          }
                                          required
                                        />
                                      </div>
                                      <span className="text-body-sm text-slate-gray">
                                        a
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <Input
                                          type="time"
                                          className="min-w-0"
                                          aria-label="Cierre de la excepción"
                                          value={period.closeTime}
                                          onChange={(e) =>
                                            handleExceptionPeriodChange(
                                              index,
                                              "closeTime",
                                              e.target.value,
                                            )
                                          }
                                          required
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveExceptionPeriod(index)
                                        }
                                        disabled={
                                          newException.periods.length <= 1
                                        }
                                        aria-label="Quitar franja"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:w-9"
                                      >
                                        <TrashIcon
                                          className="h-4 w-4"
                                          weight="regular"
                                        />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={handleAddExceptionPeriod}
                                    className="inline-flex items-center gap-1.5 text-body-sm font-medium text-signal-blue transition-colors hover:text-deep-cobalt"
                                  >
                                    <PlusIcon className="h-4 w-4" weight="bold" />
                                    Agregar franja
                                  </button>
                                </div>
                              )}

                              {exceptionError && (
                                <Alert variant="error">{exceptionError}</Alert>
                              )}

                              <div className="flex justify-end border-t border-hairline pt-4">
                                <Button type="submit" loading={isSavingException}>
                                  Guardar excepción
                                </Button>
                              </div>
                            </form>

                            <div>
                              <h3 className="text-body font-semibold text-ink-navy">
                                Excepciones cargadas
                              </h3>
                              {exceptions.length === 0 ? (
                                <p className="mt-2 text-body-sm text-slate-gray">
                                  Sin excepciones. Agregá un horario distinto
                                  para una fecha puntual, por ejemplo un
                                  feriado o un corte de mediodía.
                                </p>
                              ) : (
                                <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
                                  {exceptions.map((exception) => (
                                    <li
                                      key={exception.id}
                                      className="flex items-center justify-between gap-4 px-5 py-3.5"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-body-sm font-semibold text-ink-navy">
                                          {formatDateLabel(exception.date)}
                                        </p>
                                        <p className="truncate text-caption text-slate-gray">
                                          {exception.isClosed
                                            ? "Cerrado"
                                            : formatPeriodsLabel(
                                                exception.periods,
                                              )}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteException(exception.date)
                                        }
                                        aria-label={`Eliminar excepción del ${exception.date}`}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-danger-soft hover:text-danger sm:h-9 sm:w-9"
                                      >
                                        <TrashIcon
                                          className="h-4 w-4"
                                          weight="regular"
                                        />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}

                        {activeTab === "reglas" && (
                          <form className="space-y-8" onSubmit={handleSaveRules}>
                            <SectionHeader
                              icon={
                                <SlidersHorizontalIcon
                                  className="h-5 w-5"
                                  weight="regular"
                                />
                              }
                              title="Reglas de reserva"
                              description="Configurá cómo los clientes interactúan con tu agenda."
                            />

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                              <SelectField
                                id="reservationMode"
                                label="Modo de reserva"
                                hint="Quiénes pueden reservar turnos."
                                value={rulesForm.reservationMode}
                                onChange={(e) =>
                                  setRulesForm({
                                    ...rulesForm,
                                    reservationMode: e.target
                                      .value as ReservationMode,
                                  })
                                }
                                required
                              >
                                <option value="PUBLIC">
                                  Público (cualquiera con email)
                                </option>
                                <option value="AUTHENTICATED">
                                  Verificado (email + código OTP)
                                </option>
                              </SelectField>
                              <TextField
                                id="cancellationToleranceHours"
                                label="Tolerancia de cancelación"
                                hint="Horas por debajo de las cuales una cancelación se marca como tardía (informativo)."
                                inputMode="numeric"
                                value={rulesForm.cancellationToleranceHours}
                                onChange={(e) =>
                                  setRulesForm({
                                    ...rulesForm,
                                    cancellationToleranceHours:
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 3),
                                  })
                                }
                                rightElement={
                                  <span className="text-body-sm text-slate-gray">
                                    hs
                                  </span>
                                }
                                required
                              />
                            </div>

                            <div className="border-t border-hairline pt-8">
                              <ToggleRow
                                icon={
                                  <UsersThreeIcon
                                    className="h-4 w-4"
                                    weight="regular"
                                  />
                                }
                                title="Los profesionales ven toda la agenda"
                                description="Si está activo, cada profesional ve los turnos de todos. Si no, solo ve los suyos."
                                checked={rulesForm.staffCanViewFullAgenda}
                                onChange={(value) =>
                                  setRulesForm({
                                    ...rulesForm,
                                    staffCanViewFullAgenda: value,
                                  })
                                }
                              />
                            </div>

                            <section className="space-y-4 border-t border-hairline pt-8">
                              <SectionHeader
                                icon={
                                  <BellRingingIcon
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Recordatorios automáticos"
                                description="Enviá recordatorios por email para reducir ausencias."
                              />

                              <ToggleRow
                                icon={
                                  <BellRingingIcon
                                    className="h-4 w-4"
                                    weight="regular"
                                  />
                                }
                                title="Habilitar recordatorios"
                                description="Interruptor general de recordatorios por email."
                                checked={rulesForm.enableReminders}
                                onChange={(value) =>
                                  setRulesForm({
                                    ...rulesForm,
                                    enableReminders: value,
                                  })
                                }
                              />

                              <div
                                className={`space-y-3 transition-opacity ${
                                  !rulesForm.enableReminders
                                    ? "pointer-events-none opacity-40"
                                    : ""
                                }`}
                              >
                                <ToggleRow
                                  icon={
                                    <ClockIcon
                                      className="h-4 w-4"
                                      weight="regular"
                                    />
                                  }
                                  title="Recordatorio 24 horas antes"
                                  description="Da tiempo al cliente para reprogramar o cancelar."
                                  checked={rulesForm.reminder24hEnabled}
                                  onChange={(value) =>
                                    setRulesForm({
                                      ...rulesForm,
                                      reminder24hEnabled: value,
                                    })
                                  }
                                  disabled={!rulesForm.enableReminders}
                                />
                                <ToggleRow
                                  icon={
                                    <ClockIcon
                                      className="h-4 w-4"
                                      weight="regular"
                                    />
                                  }
                                  title="Recordatorio 2 horas antes"
                                  description="Último aviso para clientes que puedan haber olvidado el turno."
                                  checked={rulesForm.reminder2hEnabled}
                                  onChange={(value) =>
                                    setRulesForm({
                                      ...rulesForm,
                                      reminder2hEnabled: value,
                                    })
                                  }
                                  disabled={!rulesForm.enableReminders}
                                />
                              </div>

                              <Alert variant="info">
                                Si desactivás el interruptor general, no se
                                enviará ningún recordatorio.
                              </Alert>
                            </section>

                            <div className="flex justify-end border-t border-hairline pt-5">
                              <Button type="submit" loading={isSavingRules}>
                                Guardar reglas
                              </Button>
                            </div>
                          </form>
                        )}

                        {activeTab === "clientes" && (
                          <div className="space-y-5">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                              <SectionHeader
                                icon={
                                  <ShieldCheckIcon
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Clientes bloqueados"
                                description="Bloqueá o desbloqueá clientes para que no puedan reservar."
                              />
                              <div className="w-full sm:w-64">
                                <Input
                                  placeholder="Buscar por email..."
                                  value={clientSearch}
                                  onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setClientPage(0);
                                  }}
                                  leftIcon={
                                    <MagnifyingGlassIcon
                                      className="h-4 w-4"
                                      weight="regular"
                                    />
                                  }
                                />
                              </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-hairline">
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px] border-collapse text-left">
                                  <thead className="border-b border-hairline bg-cloud">
                                    <tr>
                                      <th className="px-6 py-3 text-caption font-semibold uppercase tracking-wider text-slate-gray">
                                        Cliente
                                      </th>
                                      <th className="px-6 py-3 text-caption font-semibold uppercase tracking-wider text-slate-gray">
                                        Estado
                                      </th>
                                      <th className="px-6 py-3 text-right text-caption font-semibold uppercase tracking-wider text-slate-gray">
                                        Acciones
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-hairline">
                                    {clientError ? (
                                      <tr>
                                        <td
                                          colSpan={3}
                                          className="px-6 py-12 text-center"
                                        >
                                          <p className="text-body-sm text-slate-gray">
                                            {clientError}
                                          </p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() =>
                                              setClientReloadKey(
                                                (key) => key + 1,
                                              )
                                            }
                                          >
                                            Reintentar
                                          </Button>
                                        </td>
                                      </tr>
                                    ) : clientLoading ? (
                                      <tr>
                                        <td
                                          colSpan={3}
                                          className="px-6 py-12 text-center"
                                        >
                                          <Spinner className="mx-auto" />
                                        </td>
                                      </tr>
                                    ) : filteredClients.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={3}
                                          className="px-6 py-12 text-center text-body-sm text-slate-gray"
                                        >
                                          No hay clientes bloqueados o no
                                          coinciden con la búsqueda.
                                        </td>
                                      </tr>
                                    ) : (
                                      pagedClients.map((rep) => (
                                        <tr
                                          key={rep.id}
                                          className="transition-colors hover:bg-pebble/60"
                                        >
                                          <td className="px-6 py-4">
                                            <p className="text-body font-semibold text-ink-navy">
                                              {rep.clientEmail}
                                            </p>
                                            <p className="text-caption text-slate-gray">
                                              Cliente #{rep.clientId}
                                            </p>
                                          </td>
                                          <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                              {rep.isBlocked ? (
                                                <Badge variant="danger">
                                                  Bloqueado
                                                </Badge>
                                              ) : (
                                                <Badge variant="success">
                                                  Normal
                                                </Badge>
                                              )}
                                              {rep.isBlocked &&
                                                rep.blockReason && (
                                                  <span className="text-caption text-slate-gray">
                                                    {rep.blockReason}
                                                  </span>
                                                )}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4">
                                            <div className="flex flex-wrap justify-end gap-2">
                                              {rep.isBlocked ? (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleClientAction(
                                                      rep.clientId,
                                                      "unblock",
                                                    )
                                                  }
                                                  loading={
                                                    isProcessingClient ===
                                                    rep.clientId
                                                  }
                                                >
                                                  Desbloquear
                                                </Button>
                                              ) : (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    openClientModal(rep)
                                                  }
                                                  loading={
                                                    isProcessingClient ===
                                                    rep.clientId
                                                  }
                                                >
                                                  Bloquear
                                                </Button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <Pagination
                              page={clientPage}
                              totalPages={clientTotalPages}
                              onPageChange={setClientPage}
                            />
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </Card>
              </div>
            )}
      </RoleGuard>

      <Modal
        open={isDeleteBusinessModalOpen}
        onClose={closeDeleteBusinessModal}
        title="Eliminar negocio"
        size="sm"
      >
        {business && (
          <div className="space-y-5">
            <p className="text-body text-slate-gray">
              Vas a eliminar{" "}
              <strong className="text-ink-navy">{business.name}</strong> junto
              con sus servicios, equipo, turnos y bloqueos de clientes. Esta
              acción no se puede deshacer.
            </p>

            <TextField
              id="confirmBusinessName"
              label={`Escribí "${business.name}" para confirmar`}
              placeholder={business.name}
              value={deleteBusinessConfirm}
              onChange={(e) => {
                setDeleteBusinessConfirm(e.target.value);
                setDeleteBusinessError(null);
              }}
              autoComplete="off"
            />

            {deleteBusinessError && (
              <Alert variant="error">{deleteBusinessError}</Alert>
            )}

            <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={closeDeleteBusinessModal}
                disabled={isDeletingBusiness}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBusiness}
                loading={isDeletingBusiness}
                disabled={deleteBusinessConfirm.trim() !== business.name}
              >
                Eliminar negocio
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={clientModal !== null}
        onClose={closeClientModal}
        title="Bloquear cliente"
        size="sm"
      >
        {clientModal && (
          <div className="space-y-5">
            <div>
              <p className="text-body-sm text-slate-gray">
                El cliente no podrá reservar turnos en este negocio hasta que lo
                desbloquees.
              </p>
              <p className="mt-1 truncate text-body font-semibold text-ink-navy">
                {clientModal.clientEmail}
              </p>
            </div>

            <TextField
              id="clientReason"
              label="Motivo"
              value={clientReason}
              onChange={(e) => setClientReason(e.target.value)}
              placeholder="Ej. reiteradas ausencias"
              maxLength={255}
              autoComplete="off"
            />

            <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={closeClientModal}
                disabled={isProcessingClient !== null}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmClientAction}
                loading={isProcessingClient !== null}
              >
                Bloquear
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <UnsavedChangesDialog
        open={pendingTab !== null}
        sectionLabel={TABS.find((tab) => tab.id === activeTab)?.label}
        loading={isResolvingTab}
        onCancel={() => setPendingTab(null)}
        onDiscard={handleDiscardAndLeaveTab}
        onSave={handleSaveAndLeaveTab}
      />
    </>
  );
}
