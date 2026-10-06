import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

/**
 * Estado de error reutilizable con acción de reintento. Se muestra cuando una
 * carga falla, para no confundir un fallo con un estado vacío.
 */
export function ErrorState({
  title = "No pudimos cargar la información",
  message,
  onRetry,
  retryLabel = "Reintentar",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-hairline bg-paper py-16 text-center shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <WarningCircleIcon className="h-6 w-6" weight="regular" />
      </span>
      <div>
        <p className="text-body font-semibold text-ink-navy">{title}</p>
        {message && (
          <p className="mt-1 max-w-sm text-body-sm text-slate-gray">{message}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
