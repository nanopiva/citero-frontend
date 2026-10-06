"use client";

import { useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useBusiness } from "@/context/BusinessContext";
import type {
  BusinessCreateRequestDto,
  BusinessResponseDto,
} from "@/types";
import { ROUTES } from "@/types";
import { compressImage } from "@/lib/image";

import { TextField } from "@/components/ui/TextField";
import { TextareaField } from "@/components/ui/TextareaField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { SlugPreview } from "@/components/ui/SlugPreview";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshWorkspaces } = useBusiness();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setGeneralError(null);

    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
      setSlugError(null);
    }
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setSlug(normalized);
    setSlugManuallyEdited(true);
    setSlugError(null);
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleLogoChange = (file: File | null, preview: string | null) => {
    setLogoFile(file);
    setLogoPreview(preview);
  };

  const handleResetSlug = () => {
    setSlug(generateSlug(name));
    setSlugManuallyEdited(false);
    setSlugError(null);
  };

  const isNameValid = name.trim().length > 0 && name.length <= 100;
  const isSlugValid =
    slug.length >= 3 && slug.length <= 40 && SLUG_REGEX.test(slug);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setSlugError(null);

    if (!isNameValid || !isSlugValid) return;

    setIsSubmitting(true);

    const payload: BusinessCreateRequestDto = {
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
    };

    try {
      const { data } = await api.post<BusinessResponseDto>(
        "/businesses",
        payload,
      );

      // Subimos el logo si el usuario eligió uno (best-effort: no debe romper el alta).
      if (logoFile) {
        try {
          const compressedLogo = await compressImage(logoFile, {
            maxWidth: 512,
            maxHeight: 512,
          });
          const formData = new FormData();
          formData.append("file", compressedLogo);
          await api.post(`/businesses/${data.id}/logo`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (logoErr) {
          console.error("No se pudo subir el logo:", logoErr);
        }
      }

      localStorage.setItem("citero_active_business_id", data.id.toString());
      await refreshWorkspaces();
      router.replace(ROUTES.auth.dashboard);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number; data?: { message?: string } } })
          .response
      ) {
        const axiosErr = err as {
          response: { status?: number; data?: { message?: string } };
        };
        const status = axiosErr.response.status;
        const message = axiosErr.response.data?.message;

        if (status === 409) {
          setSlugError(
            "Este enlace ya está en uso. Probá con otro nombre o editá el slug manualmente.",
          );
        } else if (status === 400) {
          setGeneralError(
            message ??
              "Los datos ingresados no son válidos. Revisá el formulario.",
          );
        } else if (status === 401) {
          router.replace(ROUTES.public.login);
        } else {
          setGeneralError(
            message ??
              "Ocurrió un error al crear el negocio. Intentá de nuevo.",
          );
        }
      } else {
        setGeneralError(
          "No pudimos conectar con el servidor. Verificá tu conexión e intentá de nuevo.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cloud px-4 py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="flex justify-center">
            <Logo href="/" />
          </div>
          <h1 className="mt-6 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
            Creá tu primer negocio
          </h1>
          <p className="mx-auto mt-3 max-w-md text-body text-slate-gray">
            Configurá los datos básicos para comenzar a recibir reservas en
            Citero. Podrás personalizarlo más adelante.
          </p>
        </header>

        <Card className="sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col items-center">
              <ImageUploader
                variant="logo"
                value={logoPreview}
                onChange={handleLogoChange}
                label="Logo del negocio"
                hint="JPG, PNG o WebP (máx. 2 MB)."
              />
            </div>

            {generalError && <Alert variant="error">{generalError}</Alert>}

            <TextField
              id="business-name"
              label="Nombre del negocio"
              placeholder="Ej: Estudio Aurora"
              value={name}
              onChange={handleNameChange}
              maxLength={100}
              autoComplete="organization"
              required
            />

            <div className="space-y-2">
              <TextField
                id="business-slug"
                label="Enlace público (slug)"
                hint="Este será el enlace público para que tus clientes reserven."
                placeholder="tu-negocio"
                value={slug}
                onChange={handleSlugChange}
                maxLength={40}
                error={
                  slugError ||
                  (slug.length > 0 && !isSlugValid
                    ? "El slug debe tener entre 3 y 40 caracteres, y solo puede contener letras minúsculas, números y guiones."
                    : undefined)
                }
                leftIcon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                }
                rightElement={
                  slugManuallyEdited ? (
                    <button
                      type="button"
                      onClick={handleResetSlug}
                      className="whitespace-nowrap text-caption font-medium text-signal-blue hover:underline"
                    >
                      Auto
                    </button>
                  ) : null
                }
                required
              />
              <SlugPreview slug={slug} isValid={isSlugValid} />
            </div>

            <div className="space-y-2">
              <TextareaField
                id="business-description"
                label="Descripción"
                hint="Opcional · Máx 1000 caracteres"
                placeholder="Contale a tus clientes qué hace especial a tu negocio..."
                value={description}
                onChange={handleDescriptionChange}
                maxLength={1000}
                rows={3}
              />
              <p className="text-right text-caption text-slate-gray">
                {description.length}/1000
              </p>
            </div>

            <div className="border-t border-hairline" />

            <Alert variant="info">
              Podrás editar estos datos, configurar horarios y reglas de negocio
              más adelante desde <strong>Configuración</strong>.
            </Alert>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={!isNameValid || !isSlugValid || isSubmitting}
              rightIcon={
                !isSubmitting && (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )
              }
            >
              Crear mi negocio
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-caption text-slate-gray">
          ¿Necesitás ayuda?{" "}
          <a
            href="mailto:hola@citero.app"
            className="font-medium text-signal-blue underline-offset-2 hover:underline"
          >
            Contactá a soporte
          </a>
        </p>
      </div>
    </div>
  );
}
