"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BellRinging,
  Clock,
  LinkSimple,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Storefront,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { compressImage } from "@/lib/image";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/components/ui/Toast";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { TextField } from "@/components/ui/TextField";
import {
  BusinessResponseDto,
  BusinessConfigResponseDto,
  BusinessScheduleResponseDto,
  ClientReputationResponseDto,
  BusinessUpdateDto,
  BusinessScheduleRequestDto,
  ReservationMode,
  DayOfWeek,
  WorkspaceRole,
  PageResponse,
} from "@/types";

const REPUTATION_PAGE_SIZE = 10;

interface BusinessConfigRequestForm {
  reservationMode: ReservationMode;
  cancellationToleranceHours: string;
  enablePenalties: boolean;
  maxStrikes: string;
  defaultOpeningTime: string;
  defaultClosingTime: string;
  enableReminders: boolean;
  reminder24hEnabled: boolean;
  reminder2hEnabled: boolean;
}

const TABS = [
  { id: "general", label: "General" },
  { id: "horarios", label: "Horarios" },
  { id: "reglas", label: "Reglas de reserva" },
  { id: "reputacion", label: "Reputación" },
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

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f0ff] text-signal-blue">
        {icon}
      </span>
      <div>
        <h2 className="text-body font-semibold text-ink-navy">{title}</h2>
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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-paper p-4 transition-colors hover:border-signal-blue/30 hover:bg-cloud">
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
  const [pageError, setPageError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [schedules, setSchedules] = useState<BusinessScheduleRequestDto[]>([]);
  const [reputations, setReputations] = useState<ClientReputationResponseDto[]>(
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
    enablePenalties: true,
    maxStrikes: "3",
    defaultOpeningTime: "09:00:00",
    defaultClosingTime: "18:00:00",
    enableReminders: true,
    reminder24hEnabled: true,
    reminder2hEnabled: true,
  });
  const [isSavingRules, setIsSavingRules] = useState(false);

  const [reputationSearch, setReputationSearch] = useState("");
  const [reputationPage, setReputationPage] = useState(0);
  const [reputationTotalPages, setReputationTotalPages] = useState(1);
  const [reputationLoading, setReputationLoading] = useState(false);
  const [isProcessingReputation, setIsProcessingReputation] = useState<
    number | null
  >(null);

  const [isDeleteBusinessModalOpen, setIsDeleteBusinessModalOpen] =
    useState(false);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);
  const [deleteBusinessConfirm, setDeleteBusinessConfirm] = useState("");
  const [deleteBusinessError, setDeleteBusinessError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!activeWorkspace) return;

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
        setGeneralForm({
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
        });

        const [configRes, schedulesRes] = await Promise.all([
          api.get<BusinessConfigResponseDto>(
            `/businesses/${currentBusinessId}/config`,
          ),
          api.get<BusinessScheduleResponseDto[]>(
            `/businesses/${currentBusinessId}/schedules`,
          ),
        ]);

        setRulesForm({
          reservationMode: configRes.data.reservationMode as ReservationMode,
          cancellationToleranceHours: String(
            configRes.data.cancellationToleranceHours ?? 24,
          ),
          enablePenalties: configRes.data.enablePenalties ?? true,
          maxStrikes: String(configRes.data.maxStrikes || 3),
          defaultOpeningTime: configRes.data.defaultOpeningTime || "09:00:00",
          defaultClosingTime: configRes.data.defaultClosingTime || "18:00:00",
          enableReminders: configRes.data.enableReminders ?? true,
          reminder24hEnabled: configRes.data.reminder24hEnabled ?? true,
          reminder2hEnabled: configRes.data.reminder2hEnabled ?? true,
        });

        const mappedSchedules = ORDERED_DAYS.map((day) => {
          const existing = schedulesRes.data.find((s) => s.dayOfWeek === day);
          return {
            dayOfWeek: day,
            openTime: existing ? existing.openTime.substring(0, 5) : "09:00",
            closeTime: existing ? existing.closeTime.substring(0, 5) : "18:00",
            isClosed: existing ? existing.isClosed : false,
          };
        });
        setSchedules(mappedSchedules);
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
  }, [activeWorkspace]);

  useEffect(() => {
    if (!activeWorkspace) return;
    let active = true;

    const fetchReputations = async () => {
      setReputationLoading(true);
      try {
        const res = await api.get<PageResponse<ClientReputationResponseDto>>(
          `/businesses/${activeWorkspace.businessId}/reputation`,
          { params: { page: reputationPage, size: REPUTATION_PAGE_SIZE } },
        );
        if (!active) return;
        setReputations(res.data.content);
        setReputationTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Error al cargar reputaciones:", err);
      } finally {
        if (active) setReputationLoading(false);
      }
    };

    fetchReputations();
    return () => {
      active = false;
    };
  }, [activeWorkspace, reputationPage]);

  const handleSaveGeneral = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      setIsSavingGeneral(true);
      await api.put(`/businesses/${activeWorkspace.businessId}`, generalForm);
      toast.success(
        "Datos guardados",
        "Tu perfil público se actualizó correctamente.",
      );
    } catch (err) {
      toast.error(
        "No pudimos guardar los datos",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
    } finally {
      setIsSavingGeneral(false);
    }
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

  const handleScheduleChange = (
    day: DayOfWeek,
    field: keyof BusinessScheduleRequestDto,
    value: unknown,
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)),
    );
  };

  const handleSaveSchedules = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      setIsSavingSchedules(true);
      const formattedSchedules = schedules.map((s) => ({
        ...s,
        openTime: s.openTime.length === 5 ? `${s.openTime}:00` : s.openTime,
        closeTime: s.closeTime.length === 5 ? `${s.closeTime}:00` : s.closeTime,
      }));
      await api.put(
        `/businesses/${activeWorkspace.businessId}/schedules`,
        formattedSchedules,
      );
      toast.success("Horarios actualizados", "Los cambios ya están activos.");
    } catch (err) {
      toast.error(
        "No pudimos actualizar los horarios",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
    } finally {
      setIsSavingSchedules(false);
    }
  };

  const handleSaveRules = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      setIsSavingRules(true);
      await api.put(`/businesses/${activeWorkspace.businessId}/config`, {
        ...rulesForm,
        cancellationToleranceHours: Number(
          rulesForm.cancellationToleranceHours || 0,
        ),
        maxStrikes: Number(rulesForm.maxStrikes || 1),
      });
      toast.success("Reglas guardadas", "La configuración de reservas cambió.");
    } catch (err) {
      toast.error(
        "No pudimos guardar las reglas",
        parseApiError(err, "Revisá los datos e intentá de nuevo.").message,
      );
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleReputationAction = async (
    clientId: number,
    action: "reset" | "unblock",
  ) => {
    if (!activeWorkspace) return;
    try {
      setIsProcessingReputation(clientId);
      const res = await api.put<ClientReputationResponseDto>(
        `/businesses/${activeWorkspace.businessId}/reputation/${clientId}/${action}`,
      );
      setReputations((prev) =>
        prev.map((r) => (r.clientId === clientId ? res.data : r)),
      );
      toast.success(
        action === "unblock" ? "Cliente desbloqueado" : "Strikes reiniciados",
        res.data.clientEmail,
      );
    } catch (err) {
      toast.error(
        "No pudimos actualizar la reputación",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
    } finally {
      setIsProcessingReputation(null);
    }
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

  const filteredReputations = reputations.filter((r) =>
    r.clientEmail.toLowerCase().includes(reputationSearch.toLowerCase()),
  );

  return (
    <div className="min-h-dvh bg-cloud">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
          <RoleGuard allowedRoles={[WorkspaceRole.OWNER]}>
            {loading ? (
              <div className="mx-auto flex min-h-[480px] max-w-page items-center justify-center">
                <span className="h-8 w-8 animate-pulse rounded-full bg-pebble" />
              </div>
            ) : (
              <div className="mx-auto max-w-page space-y-6">
                {pageError && <Alert variant="error">{pageError}</Alert>}

                <header>
                  <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
                    Ajustes
                  </p>
                  <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
                    Configuración
                  </h1>
                  <p className="mt-2 text-body-sm text-slate-gray">
                    Administrá la información, reglas y horarios de tu negocio.
                  </p>
                </header>

                <Card padded={false} className="overflow-hidden">
                  <div className="flex gap-1 overflow-x-auto border-b border-hairline px-2 sm:px-4">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative whitespace-nowrap px-4 py-3.5 text-body-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? "text-ink-navy"
                            : "text-slate-gray hover:text-ink-navy"
                        }`}
                      >
                        {tab.label}
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

                  <div className="p-5 sm:p-6">
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
                                  <Storefront
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Información básica"
                                description="Datos visibles en tu perfil público."
                              />

                              <div className="grid gap-5 sm:grid-cols-2">
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

                              <div>
                                <Label hint="Una breve descripción que verán tus clientes al reservar.">
                                  Descripción
                                </Label>
                                <Textarea
                                  className="mt-2"
                                  value={generalForm.description ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              {imageError && (
                                <Alert variant="error">{imageError}</Alert>
                              )}

                              <div className="grid gap-5 sm:grid-cols-2">
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
                                  <MapPin className="h-5 w-5" weight="regular" />
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

                              <div className="grid gap-5 sm:grid-cols-2">
                                <TextField
                                  id="business-phone"
                                  label="Teléfono"
                                  hint="Teléfono de contacto del negocio."
                                  placeholder="+54 11 1234-5678"
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
                                  value={generalForm.whatsappNumber ?? ""}
                                  onChange={(e) =>
                                    setGeneralForm({
                                      ...generalForm,
                                      whatsappNumber: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </section>

                            <section className="space-y-5 border-t border-hairline pt-8">
                              <SectionHeader
                                icon={
                                  <LinkSimple
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Redes sociales"
                                description="Enlaces para que los clientes puedan seguirte."
                              />

                              <div className="grid gap-5 sm:grid-cols-2">
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

                          <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                <WarningCircle
                                  className="h-5 w-5"
                                  weight="regular"
                                />
                              </span>
                              <div>
                                <h3 className="text-body font-semibold text-ink-navy">
                                  Zona de peligro
                                </h3>
                                <p className="mt-0.5 text-body-sm text-slate-gray">
                                  Eliminar el negocio borra sus servicios,
                                  equipo, turnos y clientes. Esta acción no se
                                  puede deshacer.
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              className="mt-4"
                              onClick={() => setIsDeleteBusinessModalOpen(true)}
                            >
                              <Trash className="h-4 w-4" weight="bold" />
                              Eliminar negocio
                            </Button>
                          </section>
                          </div>
                        )}

                        {activeTab === "horarios" && (
                          <form
                            className="space-y-6"
                            onSubmit={handleSaveSchedules}
                          >
                            <SectionHeader
                              icon={<Clock className="h-5 w-5" weight="regular" />}
                              title="Horarios de atención"
                              description="Definí los horarios en los que tu negocio está abierto. Los clientes solo verán turnos dentro de este rango."
                            />

                            <div className="space-y-3">
                              {schedules.map((day) => (
                                <div
                                  key={day.dayOfWeek}
                                  className="flex flex-col gap-4 rounded-xl border border-hairline bg-paper p-4 transition-colors hover:border-signal-blue/30 hover:bg-cloud sm:flex-row sm:items-center"
                                >
                                  <div className="sm:w-28">
                                    <p className="text-body-sm font-semibold text-ink-navy">
                                      {DAYS_TRANSLATION[day.dayOfWeek]}
                                    </p>
                                  </div>

                                  <div className="flex flex-1 items-center gap-3">
                                    <div className="flex-1">
                                      <Input
                                        type="time"
                                        value={day.openTime}
                                        disabled={day.isClosed}
                                        onChange={(e) =>
                                          handleScheduleChange(
                                            day.dayOfWeek,
                                            "openTime",
                                            e.target.value,
                                          )
                                        }
                                        required={!day.isClosed}
                                      />
                                    </div>
                                    <span className="text-body-sm text-slate-gray">
                                      a
                                    </span>
                                    <div className="flex-1">
                                      <Input
                                        type="time"
                                        value={day.closeTime}
                                        disabled={day.isClosed}
                                        onChange={(e) =>
                                          handleScheduleChange(
                                            day.dayOfWeek,
                                            "closeTime",
                                            e.target.value,
                                          )
                                        }
                                        required={!day.isClosed}
                                      />
                                    </div>
                                  </div>

                                  <label className="flex cursor-pointer items-center justify-between gap-2 sm:w-32 sm:justify-end">
                                    <span className="text-body-sm text-slate-gray">
                                      Cerrado
                                    </span>
                                    <Switch
                                      checked={day.isClosed}
                                      onChange={(value) =>
                                        handleScheduleChange(
                                          day.dayOfWeek,
                                          "isClosed",
                                          value,
                                        )
                                      }
                                      label={`Cerrar ${DAYS_TRANSLATION[day.dayOfWeek]}`}
                                    />
                                  </label>
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

                        {activeTab === "reglas" && (
                          <form className="space-y-8" onSubmit={handleSaveRules}>
                            <SectionHeader
                              icon={
                                <SlidersHorizontal
                                  className="h-5 w-5"
                                  weight="regular"
                                />
                              }
                              title="Reglas de reserva"
                              description="Configurá cómo los clientes interactúan con tu agenda."
                            />

                            <div className="grid gap-5 sm:grid-cols-2">
                              <div>
                                <Label
                                  required
                                  hint="Quiénes pueden reservar turnos."
                                >
                                  Modo de reserva
                                </Label>
                                <Select
                                  className="mt-2"
                                  value={rulesForm.reservationMode}
                                  onChange={(e) =>
                                    setRulesForm({
                                      ...rulesForm,
                                      reservationMode: e.target
                                        .value as ReservationMode,
                                    })
                                  }
                                >
                                  <option value="PUBLIC">
                                    Público (cualquiera con nombre y email)
                                  </option>
                                  <option value="AUTHENTICATED">
                                    Verificado (cuenta o validación OTP)
                                  </option>
                                </Select>
                              </div>
                              <TextField
                                id="cancellationToleranceHours"
                                label="Tolerancia de cancelación"
                                hint="Horas límite para cancelar sin penalización."
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

                            <section className="space-y-4 border-t border-hairline pt-8">
                              <SectionHeader
                                icon={
                                  <ShieldCheck
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Sistema de reputación"
                                description="Strikes automáticos por cancelaciones tardías o ausencias."
                              />

                              <ToggleRow
                                icon={
                                  <ShieldCheck
                                    className="h-4 w-4"
                                    weight="regular"
                                  />
                                }
                                title="Habilitar penalizaciones"
                                description="Suma strikes automáticamente por cancelaciones tardías o ausencias."
                                checked={rulesForm.enablePenalties}
                                onChange={(value) =>
                                  setRulesForm({
                                    ...rulesForm,
                                    enablePenalties: value,
                                  })
                                }
                              />

                              <div
                                className={`max-w-xs transition-opacity ${
                                  !rulesForm.enablePenalties
                                    ? "pointer-events-none opacity-40"
                                    : ""
                                }`}
                              >
                                <TextField
                                  id="maxStrikes"
                                  label="Máximo de strikes permitidos"
                                  hint="Límite antes de bloquear al cliente."
                                  inputMode="numeric"
                                  value={rulesForm.maxStrikes}
                                  onChange={(e) =>
                                    setRulesForm({
                                      ...rulesForm,
                                      maxStrikes: e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 2),
                                    })
                                  }
                                  disabled={!rulesForm.enablePenalties}
                                  required
                                />
                              </div>
                            </section>

                            <section className="space-y-4 border-t border-hairline pt-8">
                              <SectionHeader
                                icon={
                                  <BellRinging
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Recordatorios automáticos"
                                description="Enviá recordatorios por email para reducir ausencias."
                              />

                              <ToggleRow
                                icon={
                                  <BellRinging
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
                                    <Clock
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
                                    <Clock
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

                        {activeTab === "reputacion" && (
                          <div className="space-y-5">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                              <SectionHeader
                                icon={
                                  <ShieldCheck
                                    className="h-5 w-5"
                                    weight="regular"
                                  />
                                }
                                title="Reputación de clientes"
                                description="Gestioná los bloqueos y strikes de tus clientes."
                              />
                              <div className="w-full sm:w-64">
                                <Input
                                  placeholder="Buscar por email..."
                                  value={reputationSearch}
                                  onChange={(e) =>
                                    setReputationSearch(e.target.value)
                                  }
                                  leftIcon={
                                    <MagnifyingGlass
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
                                      <th className="px-6 py-3 text-center text-caption font-semibold uppercase tracking-wider text-slate-gray">
                                        Strikes
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
                                    {reputationLoading ? (
                                      <tr>
                                        <td
                                          colSpan={4}
                                          className="px-6 py-12 text-center"
                                        >
                                          <Spinner className="mx-auto" />
                                        </td>
                                      </tr>
                                    ) : filteredReputations.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={4}
                                          className="px-6 py-12 text-center text-body-sm text-slate-gray"
                                        >
                                          No hay registros de reputación o no
                                          coinciden con la búsqueda.
                                        </td>
                                      </tr>
                                    ) : (
                                      filteredReputations.map((rep) => (
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
                                          <td className="px-6 py-4 text-center">
                                            <span
                                              className={`text-body-lg font-semibold ${
                                                rep.strikeCount > 0
                                                  ? "text-red-500"
                                                  : "text-emerald-600"
                                              }`}
                                            >
                                              {rep.strikeCount}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4">
                                            {rep.isBlocked ? (
                                              <Badge variant="danger">
                                                Bloqueado
                                              </Badge>
                                            ) : (
                                              <Badge variant="success">
                                                Normal
                                              </Badge>
                                            )}
                                          </td>
                                          <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                              {rep.isBlocked ? (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleReputationAction(
                                                      rep.clientId,
                                                      "unblock",
                                                    )
                                                  }
                                                  loading={
                                                    isProcessingReputation ===
                                                    rep.clientId
                                                  }
                                                >
                                                  Desbloquear
                                                </Button>
                                              ) : rep.strikeCount > 0 ? (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleReputationAction(
                                                      rep.clientId,
                                                      "reset",
                                                    )
                                                  }
                                                  loading={
                                                    isProcessingReputation ===
                                                    rep.clientId
                                                  }
                                                >
                                                  Perdonar strikes
                                                </Button>
                                              ) : (
                                                <span className="text-caption text-mist-gray">
                                                  Sin acciones
                                                </span>
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
                              page={reputationPage}
                              totalPages={reputationTotalPages}
                              onPageChange={setReputationPage}
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
        </main>
      </div>

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
              con sus servicios, equipo, turnos y reputaciones de clientes. Esta
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
    </div>
  );
}
