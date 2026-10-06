"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/**
 * Diálogo para cambios sin guardar al cambiar de sección. Dos acciones nítidas y a ancho
 * completo: guardar (primaria) o descartar (revertir). Cerrar con la X o el fondo equivale a
 * cancelar (seguir editando), por eso no hay botón "Cancelar".
 */
export function UnsavedChangesDialog({
  open,
  sectionLabel,
  loading = false,
  onCancel,
  onDiscard,
  onSave,
}: {
  open: boolean;
  sectionLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Cambios sin guardar"
      size="sm"
    >
      <p className="text-body-sm leading-body-lg text-slate-gray">
        {sectionLabel ? (
          <>
            Tenés cambios sin guardar en{" "}
            <strong className="font-semibold text-ink-navy">
              {sectionLabel}
            </strong>
            .
          </>
        ) : (
          "Tenés cambios sin guardar."
        )}{" "}
        ¿Querés guardarlos antes de salir?
      </p>

      <div className="mt-6 flex flex-col gap-2 border-t border-hairline pt-5">
        <Button fullWidth onClick={onSave} loading={loading}>
          Guardar cambios
        </Button>
        <Button
          fullWidth
          variant="outline"
          onClick={onDiscard}
          disabled={loading}
        >
          Descartar cambios
        </Button>
      </div>
    </Modal>
  );
}
