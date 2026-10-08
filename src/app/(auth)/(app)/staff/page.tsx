"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CrownIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { focusFirstError, type FieldErrors } from "@/lib/form";
import { capitalize } from "@/lib/strings";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { Avatar } from "@/components/ui/Avatar";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Modal } from "@/components/ui/Modal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import {
  StaffResponseDto,
  ServiceResponseDto,
  StaffCreateRequestDto,
  WorkspaceRole,
} from "@/types";

function deriveDefaultName(email: string): string {
  const prefix = email.split("@")[0] ?? "";
  if (!prefix) return "";
  return capitalize(prefix);
}

function ServiceChecklist({
  services,
  selectedIds,
  onToggle,
}: {
  services: ServiceResponseDto[];
  selectedIds: number[];
  onToggle: (serviceId: number, checked: boolean) => void;
}) {
  return (
    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-hairline bg-cloud p-2">
      {services.length === 0 ? (
        <p className="py-2 text-center text-body-sm text-slate-gray">
          No hay servicios creados en tu negocio.
        </p>
      ) : (
        services.map((service) => {
          const isAssigned = selectedIds.includes(service.id);
          return (
            <label
              key={service.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-pebble"
            >
              <input
                type="checkbox"
                checked={isAssigned}
                onChange={(e) => onToggle(service.id, e.target.checked)}
                className="h-4 w-4 rounded border-hairline accent-signal-blue"
              />
              <span className="text-body-sm text-ink-navy">{service.name}</span>
            </label>
          );
        })
      )}
    </div>
  );
}

export default function StaffPage() {
  const { activeWorkspace } = useBusiness();
  const { user } = useAuth();
  const toast = useToast();
  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const [staffList, setStaffList] = useState<StaffResponseDto[]>([]);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddMeModalOpen, setIsAddMeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingMe, setIsAddingMe] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [addMeError, setAddMeError] = useState<string | null>(null);

  const [editingStaff, setEditingStaff] = useState<StaffResponseDto | null>(
    null,
  );
  const [staffToDelete, setStaffToDelete] = useState<StaffResponseDto | null>(
    null,
  );

  const [formData, setFormData] = useState<StaffCreateRequestDto>({
    email: "",
    customName: "",
    serviceIds: [],
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [addMeName, setAddMeName] = useState("");
  const [addMeServiceIds, setAddMeServiceIds] = useState<number[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Solo el OWNER gestiona el equipo; se evita disparar endpoints owner-only antes
    // de que RoleGuard resuelva (el STAFF se redirige).
    if (!activeWorkspace || activeWorkspace.role !== WorkspaceRole.OWNER) return;

    const fetchBusinessData = async () => {
      setLoading(true);
      setPageError(null);
      try {
        const [staffRes, srvRes] = await Promise.all([
          api.get<StaffResponseDto[]>(
            `/businesses/${activeWorkspace.businessId}/staff`,
          ),
          api.get<ServiceResponseDto[]>(
            `/businesses/${activeWorkspace.businessId}/services`,
          ),
        ]);
        setStaffList(staffRes.data);
        setServices(srvRes.data);
      } catch (err) {
        setPageError(
          parseApiError(
            err,
            "No pudimos cargar la información del equipo. Intentá de nuevo.",
          ).message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [activeWorkspace, reloadKey]);

  const ownerIsStaff = useMemo(
    () =>
      !!ownerEmail &&
      staffList.some((s) => s.userEmail?.toLowerCase() === ownerEmail),
    [staffList, ownerEmail],
  );

  const pendingCount = staffList.filter((s) => !s.hasClaimedAccount).length;

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormError(null);
    setFieldErrors({});
    setFormData({ email: "", customName: "", serviceIds: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffResponseDto) => {
    setEditingStaff(staff);
    setFormError(null);
    setFieldErrors({});
    setFormData({
      email: staff.userEmail ?? "",
      customName: staff.customName,
      serviceIds: staff.services?.map((s) => s.id) || [],
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (staff: StaffResponseDto) => {
    setStaffToDelete(staff);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const openAddMeModal = () => {
    setAddMeError(null);
    setAddMeName(
      user?.name?.trim() || (user?.email ? deriveDefaultName(user.email) : ""),
    );
    setAddMeServiceIds([]);
    setIsAddMeModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setFormError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setStaffToDelete(null);
    setDeleteError(null);
  };

  const closeAddMeModal = () => {
    setIsAddMeModalOpen(false);
    setAddMeError(null);
  };

  const toggleService = (
    serviceId: number,
    checked: boolean,
    target: "form" | "addMe",
  ) => {
    const update = (ids: number[]) =>
      checked ? [...ids, serviceId] : ids.filter((id) => id !== serviceId);

    if (target === "form") {
      setFormData((prev) => ({
        ...prev,
        serviceIds: update(prev.serviceIds || []),
      }));
    } else {
      setAddMeServiceIds((prev) => update(prev));
    }
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setFormError(null);

    const errors: FieldErrors = {};
    if (!editingStaff) {
      if (!formData.email.trim()) {
        errors.email = "Ingresá el correo.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = "Ingresá un email válido.";
      }
    }
    if (!formData.customName.trim()) {
      errors.customName = "Ingresá un nombre o alias.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, ["email", "customName"]);
      return;
    }

    try {
      setIsSaving(true);
      if (editingStaff) {
        // El email no se puede cambiar: en la edición sólo van nombre y servicios.
        const res = await api.put<StaffResponseDto>(
          `/businesses/${activeWorkspace.businessId}/staff/${editingStaff.id}`,
          {
            customName: formData.customName.trim(),
            serviceIds: formData.serviceIds,
          },
        );
        setStaffList((prev) =>
          prev.map((s) => (s.id === editingStaff.id ? res.data : s)),
        );
      } else {
        const payload: StaffCreateRequestDto = {
          email: formData.email.trim(),
          customName: formData.customName.trim(),
          serviceIds: formData.serviceIds,
        };
        const res = await api.post<StaffResponseDto>(
          `/businesses/${activeWorkspace.businessId}/staff`,
          payload,
        );
        setStaffList((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch (err) {
      const parsed = parseApiError(
        err,
        "No pudimos guardar al profesional. Intentá de nuevo.",
      );
      setFieldErrors(parsed.fieldErrors);
      setFormError(
        Object.keys(parsed.fieldErrors).length > 0 ? null : parsed.message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspace || !user) return;
    setAddMeError(null);

    if (!addMeName.trim()) {
      setAddMeError("Ingresá un nombre o alias.");
      return;
    }

    try {
      setIsAddingMe(true);
      const res = await api.post<StaffResponseDto>(
        `/businesses/${activeWorkspace.businessId}/staff/me`,
        {
          email: user.email,
          customName: addMeName.trim(),
          serviceIds: addMeServiceIds,
        },
      );
      setStaffList((prev) => [...prev, res.data]);
      closeAddMeModal();
    } catch (err) {
      setAddMeError(
        parseApiError(err, "No pudimos agregarte al equipo. Intentá de nuevo.")
          .message,
      );
    } finally {
      setIsAddingMe(false);
    }
  };

  const handleDelete = async () => {
    if (!activeWorkspace || !staffToDelete) return;
    setDeleteError(null);

    try {
      setIsDeleting(true);
      await api.delete(
        `/businesses/${activeWorkspace.businessId}/staff/${staffToDelete.id}`,
      );
      setStaffList((prev) => prev.filter((s) => s.id !== staffToDelete.id));
      closeDeleteModal();
    } catch (err) {
      setDeleteError(
        parseApiError(err, "No pudimos eliminar al profesional.").message,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendInvitation = async (staff: StaffResponseDto) => {
    if (!activeWorkspace) return;

    try {
      setResendingId(staff.id);
      await api.post(
        `/businesses/${activeWorkspace.businessId}/staff/${staff.id}/resend-invitation`,
      );
      toast.success(
        "Invitación reenviada",
        `Le enviamos un nuevo correo a ${staff.userEmail ?? ""}.`,
      );
    } catch (err) {
      toast.error(
        "No pudimos reenviar la invitación",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
    } finally {
      setResendingId(null);
    }
  };

  return (
    <>
      <RoleGuard allowedRoles={[WorkspaceRole.OWNER]}>
            {loading ? (
              <PageSkeleton rows={4} />
            ) : pageError ? (
              <div className="mx-auto max-w-page">
                <ErrorState
                  title="No pudimos cargar los profesionales"
                  message={pageError}
                  onRetry={() => setReloadKey((key) => key + 1)}
                />
              </div>
            ) : (
              <div className="mx-auto max-w-page space-y-6">
                <PageHeader
                  section="Equipo"
                  title="Profesionales"
                  description="Gestioná a los profesionales de tu negocio y asigná los servicios que realizan."
                  action={
                    <Button onClick={openCreateModal}>
                      <PlusIcon className="h-4 w-4" weight="bold" />
                      Nuevo miembro
                    </Button>
                  }
                />

                {!ownerIsStaff && (
                  <InfoBanner
                    icon={<UserCircleIcon className="h-5 w-5" weight="regular" />}
                    title="¿Vos también atendés?"
                    text="Agregate al equipo para aparecer en la agenda y recibir turnos. Sin invitación ni confirmación."
                    action={
                      <Button onClick={openAddMeModal} variant="dark">
                        <UserPlusIcon className="h-4 w-4" weight="bold" />
                        Agregarme al equipo
                      </Button>
                    }
                  />
                )}

                {staffList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-body-sm text-slate-gray">
                    <span>
                      <strong className="font-semibold text-ink-navy">
                        {staffList.length}
                      </strong>{" "}
                      {staffList.length === 1 ? "profesional" : "profesionales"}
                    </span>
                    {pendingCount > 0 && (
                      <span>
                        <strong className="font-semibold text-ink-navy">
                          {pendingCount}
                        </strong>{" "}
                        sin cuenta reclamada
                      </span>
                    )}
                  </div>
                )}

                <Card padded={false} className="overflow-hidden">
                  <CardHeader
                    title="Equipo"
                    action={
                      <span className="text-caption text-slate-gray">
                        {staffList.length}{" "}
                        {staffList.length === 1
                          ? "profesional"
                          : "profesionales"}
                      </span>
                    }
                  />

                  {staffList.length === 0 ? (
                    <EmptyState
                      className="px-6"
                      icon={<UsersThreeIcon className="h-7 w-7" weight="regular" />}
                      title="Todavía no cargaste profesionales"
                      text="Sumá a tu equipo para asignar turnos por profesional."
                      action={
                        <Button variant="outline" onClick={openCreateModal}>
                          Agregar el primero
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="divide-y divide-hairline">
                      {staffList.map((staff) => {
                        const isOwnerRow =
                          !!ownerEmail &&
                          staff.userEmail?.toLowerCase() === ownerEmail;
                        return (
                          <ListRow key={staff.id} align="start">
                            <div className="flex min-w-0 items-start gap-3 sm:flex-1">
                            <Avatar name={staff.customName} size="lg" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-body font-semibold text-ink-navy">
                                  {staff.customName}
                                </p>
                                {isOwnerRow && (
                                  <Badge variant="primary">
                                    <CrownIcon className="h-3.5 w-3.5" weight="fill" />
                                    Dueño
                                  </Badge>
                                )}
                                {!staff.hasClaimedAccount && (
                                  <Badge variant="warning">
                                    Pendiente de registro
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-body-sm text-slate-gray">
                                {staff.userEmail}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {staff.services && staff.services.length > 0 ? (
                                  staff.services.map((srv) => (
                                    <Badge key={srv.id} variant="neutral">
                                      {srv.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-caption italic text-mist-gray">
                                    Sin servicios asignados
                                  </span>
                                )}
                              </div>
                            </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {!staff.hasClaimedAccount && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendInvitation(staff)}
                                  loading={resendingId === staff.id}
                                  className="w-full sm:w-auto"
                                >
                                  {resendingId !== staff.id && (
                                    <PaperPlaneTiltIcon
                                      className="h-4 w-4"
                                      weight="regular"
                                    />
                                  )}
                                  Reenviar invitación
                                </Button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditModal(staff)}
                                aria-label={`Editar ${staff.customName}`}
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy sm:h-9 sm:w-9"
                              >
                                <PencilSimpleIcon
                                  className="h-4 w-4"
                                  weight="regular"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(staff)}
                                aria-label={`Eliminar ${staff.customName}`}
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-danger-soft hover:text-danger sm:h-9 sm:w-9"
                              >
                                <TrashIcon className="h-4 w-4" weight="regular" />
                              </button>
                            </div>
                          </ListRow>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>
            )}
      </RoleGuard>

      {/* Modal crear / editar */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingStaff ? "Modificar miembro" : "Nuevo miembro del equipo"}
      >
        <form className="space-y-5" onSubmit={handleSave} noValidate>
          <TextField
            id="staff-email"
            label="Correo electrónico"
            hint="El profesional se vincula a este correo cuando crea su cuenta en Citero."
            type="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            disabled={!!editingStaff}
            error={fieldErrors.email}
            required
          />

          <TextField
            id="customName"
            label="Nombre o alias"
            hint="Nombre público que verán los clientes al reservar."
            placeholder="Ej. Marcos G."
            value={formData.customName}
            onChange={(e) => {
              setFormData({ ...formData, customName: e.target.value });
              setFieldErrors((prev) => ({ ...prev, customName: undefined }));
            }}
            error={fieldErrors.customName}
            required
          />

          <div>
            <p className="text-body-sm font-medium text-ink-navy">
              Servicios asignados
            </p>
            <ServiceChecklist
              services={services}
              selectedIds={formData.serviceIds || []}
              onToggle={(id, checked) => toggleService(id, checked, "form")}
            />
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="flex flex-col-reverse gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={isSaving}>
              {editingStaff ? "Guardar cambios" : "Agregar profesional"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal agregarme al equipo */}
      <Modal
        open={isAddMeModalOpen}
        onClose={closeAddMeModal}
        title="Agregarme al equipo"
      >
        <form className="space-y-5" onSubmit={handleAddMe} noValidate>
          <Alert variant="info">
            Vas a aparecer como profesional en tu negocio, sin invitación ni
            confirmación. Podés asignarte servicios ahora o más adelante.
          </Alert>

          <TextField
            id="own-email"
            label="Correo de tu cuenta"
            value={user?.email ?? ""}
            disabled
          />

          <TextField
            id="addMeName"
            label="Nombre o alias"
            hint="Nombre público que verán los clientes al reservar."
            placeholder="Ej. Marcos G."
            value={addMeName}
            onChange={(e) => {
              setAddMeName(e.target.value);
              setAddMeError(null);
            }}
            required
          />

          <div>
            <p className="text-body-sm font-medium text-ink-navy">
              Servicios que realizás
            </p>
            <ServiceChecklist
              services={services}
              selectedIds={addMeServiceIds}
              onToggle={(id, checked) => toggleService(id, checked, "addMe")}
            />
          </div>

          {addMeError && <Alert variant="error">{addMeError}</Alert>}

          <div className="flex flex-col-reverse gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={closeAddMeModal}
              disabled={isAddingMe}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={isAddingMe}>
              Agregarme al equipo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal eliminar */}
      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Eliminar profesional"
        size="sm"
      >
        {staffToDelete && (
          <div className="space-y-5">
            {deleteError && <Alert variant="error">{deleteError}</Alert>}
            <p className="text-body text-slate-gray">
              Estás a punto de eliminar a{" "}
              <strong className="text-ink-navy">
                &ldquo;{staffToDelete.customName}&rdquo;
              </strong>{" "}
              de tu equipo. Sus turnos pendientes podrían verse afectados.
            </p>
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
    </>
  );
}
