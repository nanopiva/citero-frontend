"use client";

import { useEffect, useState, type FormEvent } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { useToast } from "@/components/ui/Toast";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { Skeleton } from "@/components/ui/Skeleton";

interface MfaStatus {
  enabled: boolean;
}

interface MfaSetup {
  secret: string;
  otpauthUri: string;
}

export function MfaSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enrolamiento en curso
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // Desactivación
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<MfaStatus>("/users/me/mfa");
        if (active) setEnabled(res.data.enabled);
      } catch {
        // silencioso: el usuario puede reintentar
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const beginSetup = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<MfaSetup>("/users/me/mfa/setup");
      setSetup(res.data);
      setCode("");
      setRecoveryCodes(null);
    } catch (err) {
      setError(parseApiError(err, "No pudimos iniciar la configuración.").message);
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!setup) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ recoveryCodes: string[] }>("/users/me/mfa/enable", {
        code: code.trim(),
      });
      setRecoveryCodes(res.data.recoveryCodes);
      setSetup(null);
      setEnabled(true);
      toast.success("MFA activado", "Guardá tus códigos de recuperación.");
    } catch (err) {
      setError(parseApiError(err, "El código es incorrecto.").message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/users/me/mfa/disable", {
        password: disablePassword,
        code: disableCode.trim(),
      });
      setEnabled(false);
      setDisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
      toast.success("MFA desactivado", "Tu cuenta vuelve a usar solo contraseña.");
    } catch (err) {
      setError(parseApiError(err, "No pudimos desactivar el MFA.").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-body font-semibold text-ink-navy">
            Verificación en dos pasos
          </h3>
          <p className="mt-0.5 text-body-sm text-slate-gray">
            Protegé tu cuenta con un código de tu app de autenticación (TOTP).
          </p>
        </div>
        {!loading && (
          <Badge variant={enabled ? "primary" : "neutral"}>
            {enabled ? "Activo" : "Inactivo"}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="mt-6">
          <Skeleton className="h-10 rounded-lg" />
        </div>
      ) : recoveryCodes ? (
        <div className="mt-6 space-y-4">
          <Alert variant="success" title="Guardá tus códigos de recuperación">
            Se muestran una única vez. Cada uno sirve para iniciar sesión si
            perdés el dispositivo.
          </Alert>
          <ul className="grid grid-cols-2 gap-2 rounded-xl bg-cloud p-4 font-mono text-body-sm text-ink-navy">
            {recoveryCodes.map((rc) => (
              <li key={rc}>{rc}</li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button onClick={() => setRecoveryCodes(null)} variant="outline">
              Ya los guardé
            </Button>
          </div>
        </div>
      ) : setup ? (
        <form onSubmit={confirmEnable} className="mt-6 space-y-4">
          <p className="text-body-sm text-slate-gray">
            En tu app de autenticación, agregá una cuenta nueva y usá este
            secreto (o el enlace):
          </p>
          <div className="break-all rounded-xl bg-cloud p-4 font-mono text-body-sm text-ink-navy">
            <p>Secreto: {setup.secret}</p>
            <p className="mt-2 text-caption text-slate-gray">{setup.otpauthUri}</p>
          </div>
          <TextField
            id="mfaCode"
            label="Código de la app"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSetup(null);
                setError(null);
              }}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={busy}>
              Activar
            </Button>
          </div>
        </form>
      ) : enabled ? (
        <div className="mt-6 space-y-4">
          {!disableOpen ? (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setDisableOpen(true)}>
                Desactivar MFA
              </Button>
            </div>
          ) : (
            <form onSubmit={confirmDisable} className="space-y-4">
              <p className="text-body-sm text-slate-gray">
                Para desactivarlo, confirmá tu contraseña y un código válido.
              </p>
              <PasswordField
                id="mfaDisablePassword"
                label="Contraseña actual"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
              />
              <TextField
                id="mfaDisableCode"
                label="Código (TOTP o recuperación)"
                placeholder="123456"
                maxLength={20}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                required
              />
              {error && <Alert variant="error">{error}</Alert>}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDisableOpen(false);
                    setError(null);
                  }}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" loading={busy}>
                  Desactivar
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-body-sm text-slate-gray">
            El MFA está desactivado. Activalo para requerir un código además de
            tu contraseña.
          </p>
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex justify-end">
            <Button onClick={beginSetup} loading={busy}>
              Activar MFA
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
