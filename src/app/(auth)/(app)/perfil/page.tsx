"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { EnvelopeSimpleIcon, SignOutIcon, TrashIcon } from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { Alert } from "@/components/ui/Alert";
import { ErrorState } from "@/components/ui/ErrorState";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DangerZone } from "@/components/ui/DangerZone";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { MfaSettings } from "@/components/auth/MfaSettings";
import type { UserResponseDto, UserUpdateDto } from "@/types";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  validatePassword,
} from "@/lib/validation";

const EASE = [0.16, 1, 0.3, 1] as const;

const passwordStrength = (password: string) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"];
const STRENGTH_COLORS = [
  "bg-pebble",
  "bg-danger",
  "bg-warning",
  "bg-signal-blue",
  "bg-success",
];

function StrengthMeter({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 flex-1 rounded-full ${
              score >= segment ? STRENGTH_COLORS[score] : "bg-pebble"
            }`}
          />
        ))}
      </div>
      {score > 0 && (
        <span className="text-caption text-slate-gray">
          {STRENGTH_LABELS[score]}
        </span>
      )}
    </div>
  );
}

function formatMemberSince(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PerfilPage() {
  const toast = useToast();
  const router = useRouter();
  const { deleteAccount, logout } = useAuth();
  const { activeWorkspace, refreshWorkspaces } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState("cuenta");
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isResolvingTab, setIsResolvingTab] = useState(false);

  const [email, setEmail] = useState("");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileBaseline, setProfileBaseline] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await api.get<UserResponseDto>("/users/me");
        setEmail(res.data.email);
        setName(res.data.name || "");
        setPhone(res.data.phone || "");
        setProfileBaseline({
          name: res.data.name || "",
          phone: res.data.phone || "",
        });
        setMemberSince(formatMemberSince(res.data.createdAt));
      } catch (err) {
        setLoadError(
          parseApiError(err, "Intentá de nuevo en unos minutos.").message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reloadKey]);

  const saveProfile = async (): Promise<boolean> => {
    try {
      setIsSavingProfile(true);
      // Se envían tal cual (vacío = borrar); undefined lo ignoraría el backend.
      const payload: UserUpdateDto = { phone: phone.trim(), name: name.trim() };
      const res = await api.put<UserResponseDto>("/users/me", payload);
      const savedName = res.data.name || "";
      const savedPhone = res.data.phone || "";
      setName(savedName);
      setPhone(savedPhone);
      setProfileBaseline({ name: savedName, phone: savedPhone });
      toast.success(
        "Datos guardados",
        "Tu información de contacto se actualizó correctamente.",
      );
      return true;
    } catch (err) {
      toast.error(
        "No pudimos guardar los cambios",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveProfile();
  };

  const savePassword = async (): Promise<boolean> => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    if (!currentPassword) {
      errors.currentPassword = "Ingresá tu contraseña actual.";
    }
    // Misma validación que registro/reset (incluye la lista de contraseñas comunes).
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      errors.newPassword = passwordError;
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return false;

    try {
      setIsSavingPassword(true);
      await api.put<UserResponseDto>("/users/me", {
        currentPassword,
        password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(
        "Contraseña actualizada",
        "Por seguridad cerramos tu sesión. Iniciá sesión con tu nueva contraseña.",
      );
      // Por seguridad, el backend revoca todas las sesiones al cambiar la contraseña.
      await logout();
      return true;
    } catch (err) {
      toast.error(
        "No pudimos actualizar la contraseña",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
      return false;
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSavePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await savePassword();
  };

  const isStaff = activeWorkspace?.role === "STAFF";
  const displayName = name.trim() || email.split("@")[0] || email;

  const tabs = [
    { id: "cuenta", label: "Cuenta" },
    { id: "seguridad", label: "Seguridad" },
    ...(isStaff ? [{ id: "equipo", label: "Equipo" }] : []),
  ];

  // --- Cambios sin guardar ---

  const dirtyProfile =
    profileBaseline !== null &&
    (name !== profileBaseline.name || phone !== profileBaseline.phone);
  const dirtyPassword =
    currentPassword !== "" || newPassword !== "" || confirmPassword !== "";
  const tabIsDirty: Record<string, boolean> = {
    cuenta: dirtyProfile,
    seguridad: dirtyPassword,
    equipo: false,
  };
  const anyDirty = dirtyProfile || dirtyPassword;

  const discardProfile = () => {
    if (!profileBaseline) return;
    setName(profileBaseline.name);
    setPhone(profileBaseline.phone);
  };
  const discardPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };
  const tabSaves: Record<string, () => Promise<boolean>> = {
    cuenta: saveProfile,
    seguridad: savePassword,
  };
  const tabDiscards: Record<string, () => void> = {
    cuenta: discardProfile,
    seguridad: discardPassword,
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
    const ok = await tabSaves[activeTab]?.();
    setIsResolvingTab(false);
    if (ok) setActiveTab(target);
    setPendingTab(null);
  };

  const handleDiscardAndLeaveTab = () => {
    if (!pendingTab) return;
    const target = pendingTab;
    tabDiscards[activeTab]?.();
    setPendingTab(null);
    setActiveTab(target);
  };

  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  const closeLeaveModal = () => {
    setIsLeaveModalOpen(false);
    setLeaveError(null);
  };

  const handleLeaveTeam = async () => {
    if (!activeWorkspace) return;
    setLeaveError(null);
    const businessName = activeWorkspace.businessName;
    try {
      setIsLeaving(true);
      await api.delete(`/businesses/${activeWorkspace.businessId}/staff/me`);
      await refreshWorkspaces();
      setIsLeaveModalOpen(false);
      toast.success(
        "Saliste del equipo",
        `Ya no formás parte de ${businessName}.`,
      );
      router.push("/dashboard");
    } catch (err) {
      setLeaveError(
        parseApiError(err, "No pudimos quitarte del equipo. Intentá de nuevo.")
          .message,
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const closeDeleteAccountModal = () => {
    setIsDeleteAccountModalOpen(false);
    setDeleteAccountConfirm("");
    setDeleteAccountPassword("");
    setDeleteAccountError(null);
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountError(null);
    try {
      setIsDeletingAccount(true);
      await deleteAccount(deleteAccountPassword);
    } catch (err) {
      setDeleteAccountError(
        parseApiError(err, "No pudimos eliminar tu cuenta. Intentá de nuevo.")
          .message,
      );
      setIsDeletingAccount(false);
    }
  };

  const strength = passwordStrength(newPassword);
  const canSavePassword =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword.length <= MAX_PASSWORD_LENGTH &&
    newPassword === confirmPassword;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="No pudimos cargar tu perfil"
          message={loadError}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          section="Mi cuenta"
          title="Mi perfil"
          description="Gestioná tus datos, tu seguridad y tu equipo."
        />

        {/* Cabecera de identidad */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar name={displayName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-body-lg font-semibold text-ink-navy">
                {displayName}
              </p>
              <p className="truncate text-body-sm text-slate-gray">{email}</p>
              {memberSince && (
                <p className="mt-0.5 text-caption text-slate-gray">
                  Cuenta creada el {memberSince}.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Configuración de la cuenta (categorías) */}
        <Card padded={false} className="overflow-hidden">
          <div
            role="tablist"
            className="flex gap-1 overflow-x-auto border-b border-hairline px-2 sm:px-4"
          >
            {tabs.map((tab) => (
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
                    layoutId="perfil-tab-indicator"
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
                {activeTab === "cuenta" && (
                  <form className="space-y-5" onSubmit={handleSaveProfile}>
                    <div>
                      <h3 className="text-body font-semibold text-ink-navy">
                        Datos de la cuenta
                      </h3>
                      <p className="mt-0.5 text-body-sm text-slate-gray">
                        Tu nombre y datos de contacto.
                      </p>
                    </div>

                    <TextField
                      id="email"
                      label="Correo electrónico"
                      hint="El correo no se puede cambiar: es tu identificador de acceso."
                      value={email}
                      leftIcon={
                        <EnvelopeSimpleIcon className="h-4 w-4" weight="regular" />
                      }
                      disabled
                    />

                    <TextField
                      id="name"
                      label="Nombre"
                      hint="Opcional. Se muestra a los negocios en tus reservas."
                      placeholder="Tu nombre"
                      autoComplete="name"
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />

                    <TextField
                      id="phone"
                      label="Teléfono"
                      hint="Opcional. Se usa para validaciones o contacto rápido."
                      placeholder="+54 9 342 123-4567"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />

                    <div className="flex justify-end border-t border-hairline pt-5">
                      <Button type="submit" loading={isSavingProfile}>
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
                )}

                {activeTab === "seguridad" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-body font-semibold text-ink-navy">
                        Contraseña
                      </h3>
                      <p className="mt-0.5 text-body-sm text-slate-gray">
                        Cambiala para mantener tu cuenta segura.
                      </p>

                      <form
                        className="mt-5 space-y-5"
                        onSubmit={handleSavePassword}
                      >
                        <PasswordField
                          id="currentPassword"
                          label="Contraseña actual"
                          hint="Por seguridad, confirmá tu contraseña actual."
                          autoComplete="current-password"
                          maxLength={MAX_PASSWORD_LENGTH}
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPasswordErrors((prev) => ({
                              ...prev,
                              currentPassword: undefined,
                            }));
                          }}
                          error={passwordErrors.currentPassword}
                          required
                        />

                        <div>
                          <PasswordField
                            id="newPassword"
                            label="Nueva contraseña"
                            hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
                            autoComplete="new-password"
                            maxLength={MAX_PASSWORD_LENGTH}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              setPasswordErrors((prev) => ({
                                ...prev,
                                newPassword: undefined,
                              }));
                            }}
                            error={passwordErrors.newPassword}
                            required
                          />
                          <div className="mt-2">
                            <StrengthMeter score={strength} />
                          </div>
                        </div>

                        <PasswordField
                          id="confirmPassword"
                          label="Confirmar nueva contraseña"
                          autoComplete="new-password"
                          maxLength={MAX_PASSWORD_LENGTH}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setPasswordErrors((prev) => ({
                              ...prev,
                              confirmPassword: undefined,
                            }));
                          }}
                          error={passwordErrors.confirmPassword}
                          required
                        />

                        <div className="flex justify-end border-t border-hairline pt-5">
                          <Button
                            type="submit"
                            variant="dark"
                            loading={isSavingPassword}
                            disabled={!canSavePassword}
                          >
                            Actualizar contraseña
                          </Button>
                        </div>
                      </form>
                    </div>

                    <div className="border-t border-hairline pt-8">
                      <MfaSettings />
                    </div>
                  </div>
                )}

                {activeTab === "equipo" && isStaff && activeWorkspace && (
                  <div>
                    <h3 className="text-body font-semibold text-ink-navy">
                      Equipo
                    </h3>
                    <p className="mt-0.5 text-body-sm text-slate-gray">
                      Formás parte del equipo de{" "}
                      {activeWorkspace.businessName}.
                    </p>
                    <div className="mt-5 flex justify-end border-t border-hairline pt-5">
                      <Button
                        variant="outline"
                        onClick={() => setIsLeaveModalOpen(true)}
                      >
                        <SignOutIcon className="h-4 w-4" weight="bold" />
                        Salir del equipo
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>

        <DangerZone
          title="Zona de peligro"
          description="Eliminar tu cuenta borra tu perfil, tus negocios, tu membresía de equipo y tu historial de turnos. Esta acción no se puede deshacer."
          action={
            <Button
              variant="destructive"
              onClick={() => setIsDeleteAccountModalOpen(true)}
            >
              <TrashIcon className="h-4 w-4" weight="bold" />
              Eliminar mi cuenta
            </Button>
          }
        />
      </div>

      <UnsavedChangesDialog
        open={pendingTab !== null}
        sectionLabel={tabs.find((tab) => tab.id === activeTab)?.label}
        loading={isResolvingTab}
        onCancel={() => setPendingTab(null)}
        onDiscard={handleDiscardAndLeaveTab}
        onSave={handleSaveAndLeaveTab}
      />

      <Modal
        open={isLeaveModalOpen}
        onClose={closeLeaveModal}
        title="Salir del equipo"
        size="sm"
      >
        {activeWorkspace && (
          <div className="space-y-5">
            <p className="text-body text-slate-gray">
              Vas a dejar de formar parte del equipo de{" "}
              <strong className="text-ink-navy">
                {activeWorkspace.businessName}
              </strong>
              . Tus turnos asignados se eliminarán y ya no vas a aparecer como
              profesional.
            </p>
            {leaveError && <Alert variant="error">{leaveError}</Alert>}
            <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={closeLeaveModal}
                disabled={isLeaving}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveTeam}
                loading={isLeaving}
              >
                Salir del equipo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isDeleteAccountModalOpen}
        onClose={closeDeleteAccountModal}
        title="Eliminar mi cuenta"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-body text-slate-gray">
            Esta acción elimina tu cuenta y todos tus datos (negocios propios,
            membresías de equipo, turnos e historial). No se puede deshacer.
          </p>

          <TextField
            id="confirmDeleteAccount"
            label={`Escribí "${email}" para confirmar`}
            placeholder={email}
            value={deleteAccountConfirm}
            onChange={(e) => {
              setDeleteAccountConfirm(e.target.value);
              setDeleteAccountError(null);
            }}
            autoComplete="off"
          />

          <PasswordField
            id="deleteAccountPassword"
            label="Contraseña actual"
            hint="Por seguridad, confirmá tu contraseña."
            autoComplete="current-password"
            maxLength={MAX_PASSWORD_LENGTH}
            placeholder="••••••••"
            value={deleteAccountPassword}
            onChange={(e) => {
              setDeleteAccountPassword(e.target.value);
              setDeleteAccountError(null);
            }}
          />

          {deleteAccountError && (
            <Alert variant="error">{deleteAccountError}</Alert>
          )}

          <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={closeDeleteAccountModal}
              disabled={isDeletingAccount}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              loading={isDeletingAccount}
              disabled={
                deleteAccountConfirm.trim().toLowerCase() !==
                  email.toLowerCase() || !deleteAccountPassword
              }
            >
              Eliminar mi cuenta
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
