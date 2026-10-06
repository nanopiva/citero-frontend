"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, type ButtonVariant } from "@/components/ui/Button";

/** Diálogo de confirmación reutilizable (con variante destructiva y loading). */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  body,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  loading = false,
  confirmDisabled = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: Extract<ButtonVariant, "primary" | "destructive">;
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        {(description || body) && (
          <div>
            {description && (
              <p className="text-body text-slate-gray">{description}</p>
            )}
            {body}
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
