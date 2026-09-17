"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  EnvelopeSimple,
  LockKey,
  SignOut,
  Trash,
  UserCircle,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import type { UserResponseDto, UserUpdateDto } from "@/types";

const MIN_PASSWORD_LENGTH = 6;

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
  "bg-red-400",
  "bg-amber-400",
  "bg-signal-blue",
  "bg-emerald-500",
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
  const { deleteAccount } = useAuth();
  const { activeWorkspace, refreshWorkspaces } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{
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
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get<UserResponseDto>("/users/me");
        setEmail(res.data.email);
        setPhone(res.data.phone || "");
        setMemberSince(formatMemberSince(res.data.createdAt));
      } catch (err) {
        toast.error(
          "No pudimos cargar tu perfil",
          parseApiError(err, "Intentá recargar la página.").message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const payload: UserUpdateDto = { phone: phone.trim() || undefined };
      const res = await api.put<UserResponseDto>("/users/me", payload);
      setPhone(res.data.phone || "");
      toast.success(
        "Datos guardados",
        "Tu información de contacto se actualizó correctamente.",
      );
    } catch (err) {
      toast.error(
        "No pudimos guardar los cambios",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: { newPassword?: string; confirmPassword?: string } = {};
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsSavingPassword(true);
      await api.put<UserResponseDto>("/users/me", { password: newPassword });
      setNewPassword("");
      setConfirmPassword("");
      toast.success(
        "Contraseña actualizada",
        "Usá tu nueva contraseña la próxima vez que ingreses.",
      );
    } catch (err) {
      toast.error(
        "No pudimos actualizar la contraseña",
        parseApiError(err, "Intentá de nuevo en unos minutos.").message,
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const isStaff = activeWorkspace?.role === "STAFF";

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
    setDeleteAccountError(null);
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountError(null);
    try {
      setIsDeletingAccount(true);
      await deleteAccount();
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
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword;

  if (loading) {
    return (
      <div className="min-h-dvh bg-cloud">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="h-20 animate-pulse rounded-2xl bg-pebble" />
              <div className="h-56 animate-pulse rounded-2xl bg-pebble" />
              <div className="h-72 animate-pulse rounded-2xl bg-pebble" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cloud">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <header>
              <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
                Mi cuenta
              </p>
              <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
                Mi perfil
              </h1>
              <p className="mt-2 text-body-sm text-slate-gray">
                Gestioná tu información de contacto y la seguridad de tu
                cuenta.
              </p>
            </header>

            {memberSince && (
              <p className="text-caption text-slate-gray">
                Cuenta creada el {memberSince}.
              </p>
            )}

            {/* Información personal */}
            <Card>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f0ff] text-signal-blue">
                  <UserCircle className="h-5 w-5" weight="regular" />
                </span>
                <div>
                  <h2 className="text-body font-semibold text-ink-navy">
                    Información personal
                  </h2>
                  <p className="text-body-sm text-slate-gray">
                    Datos de contacto asociados a tu cuenta.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSaveProfile}>
                <TextField
                  id="email"
                  label="Correo electrónico"
                  hint="El correo no se puede cambiar: es tu identificador de acceso."
                  value={email}
                  leftIcon={
                    <EnvelopeSimple className="h-4 w-4" weight="regular" />
                  }
                  disabled
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
            </Card>

            {/* Seguridad */}
            <Card>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f0ff] text-signal-blue">
                  <LockKey className="h-5 w-5" weight="regular" />
                </span>
                <div>
                  <h2 className="text-body font-semibold text-ink-navy">
                    Contraseña
                  </h2>
                  <p className="text-body-sm text-slate-gray">
                    Cambiá tu contraseña para mantener tu cuenta segura.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSavePassword}>
                <div>
                  <PasswordField
                    id="newPassword"
                    label="Nueva contraseña"
                    hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
                    autoComplete="new-password"
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
            </Card>

            {isStaff && activeWorkspace && (
              <Card>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f0ff] text-signal-blue">
                    <UsersThree className="h-5 w-5" weight="regular" />
                  </span>
                  <div>
                    <h2 className="text-body font-semibold text-ink-navy">
                      Equipo
                    </h2>
                    <p className="text-body-sm text-slate-gray">
                      Formás parte del equipo de {activeWorkspace.businessName}.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end border-t border-hairline pt-5">
                  <Button
                    variant="outline"
                    onClick={() => setIsLeaveModalOpen(true)}
                  >
                    <SignOut className="h-4 w-4" weight="bold" />
                    Salir del equipo
                  </Button>
                </div>
              </Card>
            )}

            <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <WarningCircle className="h-5 w-5" weight="regular" />
                </span>
                <div>
                  <h3 className="text-body font-semibold text-ink-navy">
                    Zona de peligro
                  </h3>
                  <p className="mt-0.5 text-body-sm text-slate-gray">
                    Eliminar tu cuenta borra tu perfil, tus negocios, tu
                    membresía de equipo y tu historial de turnos. Esta acción no
                    se puede deshacer.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => setIsDeleteAccountModalOpen(true)}
              >
                <Trash className="h-4 w-4" weight="bold" />
                Eliminar mi cuenta
              </Button>
            </section>
          </div>
        </main>
      </div>

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
                email.toLowerCase()
              }
            >
              Eliminar mi cuenta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
