"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Clock,
  CurrencyDollar,
  PencilSimple,
  Plus,
  Scissors,
  Trash,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { focusFirstError, type FieldErrors } from "@/lib/form";
import { useBusiness } from "@/context/BusinessContext";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { ServiceResponseDto, WorkspaceRole } from "@/types";

const DURATION_PRESETS = [15, 30, 45, 60, 90];

function formatPrice(digits: string): string {
  if (!digits) return "";
  return Number(digits).toLocaleString("es-AR");
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

export default function ServicesPage() {
  const { activeWorkspace } = useBusiness();
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingService, setEditingService] =
    useState<ServiceResponseDto | null>(null);
  const [serviceToDelete, setServiceToDelete] =
    useState<ServiceResponseDto | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    durationMinutes: "30",
    price: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const srvRes = await api.get<ServiceResponseDto[]>(
          `/businesses/${activeWorkspace.businessId}/services`,
        );
        setServices(srvRes.data);
      } catch (err) {
        setError(
          parseApiError(
            err,
            "No pudimos cargar los servicios. Intentá de nuevo.",
          ).message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [activeWorkspace]);

  const summary = useMemo(() => {
    if (services.length === 0) return null;
    const avgDuration =
      services.reduce((acc, s) => acc + s.durationMinutes, 0) / services.length;
    const avgPrice =
      services.reduce((acc, s) => acc + Number(s.price), 0) / services.length;
    return { avgDuration: Math.round(avgDuration), avgPrice };
  }, [services]);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ name: "", durationMinutes: "30", price: "" });
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceResponseDto) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      durationMinutes: String(service.durationMinutes),
      price: String(Math.round(Number(service.price))),
    });
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (service: ServiceResponseDto) => {
    setServiceToDelete(service);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setServiceToDelete(null);
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setFormError(null);

    const errors: FieldErrors = {};
    if (!formData.name.trim()) errors.name = "Ingresá un nombre.";
    const duration = Number(formData.durationMinutes);
    if (!duration || duration < 5) {
      errors.durationMinutes = "La duración mínima es 5 minutos.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, ["name", "durationMinutes", "price"]);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      durationMinutes: duration,
      price: Number(formData.price || 0),
    };

    try {
      setIsSaving(true);
      if (editingService) {
        const res = await api.put<ServiceResponseDto>(
          `/businesses/${activeWorkspace.businessId}/services/${editingService.id}`,
          payload,
        );
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? res.data : s)),
        );
      } else {
        const res = await api.post<ServiceResponseDto>(
          `/businesses/${activeWorkspace.businessId}/services`,
          payload,
        );
        setServices((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch (err) {
      setFormError(
        parseApiError(err, "No pudimos guardar el servicio. Intentá de nuevo.")
          .message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeWorkspace || !serviceToDelete) return;
    setDeleteError(null);

    try {
      setIsDeleting(true);
      await api.delete(
        `/businesses/${activeWorkspace.businessId}/services/${serviceToDelete.id}`,
      );
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      closeDeleteModal();
    } catch (err) {
      setDeleteError(
        parseApiError(err, "No pudimos eliminar el servicio.").message,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-cloud">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
          <RoleGuard allowedRoles={[WorkspaceRole.OWNER]}>
            {loading ? (
              <PageSkeleton rows={4} />
            ) : (
              <div className="mx-auto max-w-page space-y-6">
                {error && <Alert variant="error">{error}</Alert>}

                <header className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
                      Catálogo
                    </p>
                    <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
                      Servicios
                    </h1>
                    <p className="mt-2 text-body-sm text-slate-gray">
                      Gestioná el catálogo, los precios y las duraciones de tu
                      negocio.
                    </p>
                  </div>

                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" weight="bold" />
                    Nuevo servicio
                  </Button>
                </header>

                {summary && (
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-body-sm text-slate-gray">
                    <span>
                      <strong className="font-semibold text-ink-navy">
                        {services.length}
                      </strong>{" "}
                      {services.length === 1 ? "servicio" : "servicios"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock
                        className="h-4 w-4 text-signal-blue"
                        weight="regular"
                      />
                      Duración promedio{" "}
                      <strong className="font-semibold text-ink-navy">
                        {summary.avgDuration} min
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CurrencyDollar
                        className="h-4 w-4 text-signal-blue"
                        weight="regular"
                      />
                      Precio promedio{" "}
                      <strong className="font-semibold text-ink-navy">
                        {formatCurrency(summary.avgPrice)}
                      </strong>
                    </span>
                  </div>
                )}

                <Card padded={false} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3.5">
                    <h2 className="text-body font-semibold text-ink-navy">
                      Catálogo de servicios
                    </h2>
                    <span className="text-caption text-slate-gray">
                      {services.length}{" "}
                      {services.length === 1 ? "servicio" : "servicios"}
                    </span>
                  </div>

                  {services.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
                        <Scissors className="h-7 w-7" weight="regular" />
                      </span>
                      <div>
                        <p className="text-body font-semibold text-ink-navy">
                          Todavía no tenés servicios
                        </p>
                        <p className="mt-1 max-w-sm text-body-sm text-slate-gray">
                          Creá tu primer servicio para empezar a recibir
                          reservas.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={openCreateModal}
                      >
                        Crear el primero
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-hairline">
                      {services.map((srv) => (
                        <li
                          key={srv.id}
                          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
                        >
                          <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pebble text-signal-blue">
                              <Scissors className="h-5 w-5" weight="regular" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-body font-semibold text-ink-navy">
                                {srv.name}
                              </p>
                              <p className="mt-0.5 inline-flex items-center gap-1.5 text-body-sm text-slate-gray">
                                <Clock className="h-3.5 w-3.5" weight="regular" />
                                {srv.durationMinutes} min
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
                            <p className="text-body font-semibold text-ink-navy">
                              {formatCurrency(Number(srv.price))}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(srv)}
                                aria-label={`Editar ${srv.name}`}
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy sm:h-9 sm:w-9"
                              >
                                <PencilSimple
                                  className="h-4 w-4"
                                  weight="regular"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(srv)}
                                aria-label={`Eliminar ${srv.name}`}
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-red-50 hover:text-red-500 sm:h-9 sm:w-9"
                              >
                                <Trash className="h-4 w-4" weight="regular" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}
          </RoleGuard>
        </main>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingService ? "Modificar servicio" : "Nuevo servicio"}
      >
        <form className="space-y-5" onSubmit={handleSave} noValidate>
          <TextField
            id="name"
            label="Nombre del servicio"
            placeholder="Ej. Consulta inicial"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={fieldErrors.name}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <TextField
                id="durationMinutes"
                label="Duración (minutos)"
                placeholder="30"
                inputMode="numeric"
                value={formData.durationMinutes}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    durationMinutes: e.target.value.replace(/\D/g, "").slice(0, 3),
                  });
                  setFieldErrors((prev) => ({
                    ...prev,
                    durationMinutes: undefined,
                  }));
                }}
                error={fieldErrors.durationMinutes}
                rightElement={
                  <span className="text-body-sm text-slate-gray">min</span>
                }
                required
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        durationMinutes: String(preset),
                      })
                    }
                    className={`rounded-badges border px-2.5 py-1 text-caption font-medium transition-colors ${
                      formData.durationMinutes === String(preset)
                        ? "border-signal-blue bg-[#e6f0ff] text-deep-cobalt"
                        : "border-hairline text-slate-gray hover:bg-pebble"
                    }`}
                  >
                    {preset} min
                  </button>
                ))}
              </div>
            </div>

            <TextField
              id="price"
              label="Precio final"
              placeholder="5.000"
              inputMode="numeric"
              leftIcon={<span className="text-slate-gray">$</span>}
              value={formatPrice(formData.price)}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  price: e.target.value.replace(/\D/g, "").slice(0, 9),
                });
                setFieldErrors((prev) => ({ ...prev, price: undefined }));
              }}
              error={fieldErrors.price}
            />
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="flex justify-end gap-3 border-t border-hairline pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingService ? "Guardar cambios" : "Guardar servicio"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Eliminar servicio"
        size="sm"
      >
        {serviceToDelete && (
          <div className="space-y-5">
            <p className="text-body text-slate-gray">
              Estás a punto de eliminar{" "}
              <strong className="text-ink-navy">
                &ldquo;{serviceToDelete.name}&rdquo;
              </strong>
              . Esta acción no se puede deshacer.
            </p>

            {deleteError && <Alert variant="error">{deleteError}</Alert>}

            <div className="flex justify-end gap-3 border-t border-hairline pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                loading={isDeleting}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
