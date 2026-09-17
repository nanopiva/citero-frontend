import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-pebble" />
        <div className="h-8 w-72 animate-pulse rounded-lg bg-pebble" />
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse bg-pebble" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-96 animate-pulse rounded-2xl bg-pebble" />
        <div className="space-y-6">
          <div className="h-44 animate-pulse rounded-2xl bg-pebble" />
          <div className="h-44 animate-pulse rounded-2xl bg-pebble" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl bg-pebble" />
        <div className="h-56 animate-pulse rounded-2xl bg-pebble" />
        <div className="h-56 animate-pulse rounded-2xl bg-pebble" />
      </div>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-paper py-16 text-center shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <WarningCircle className="h-6 w-6" weight="regular" />
      </span>
      <div>
        <p className="text-body font-semibold text-ink-navy">
          No pudimos cargar el panel
        </p>
        <p className="mt-1 max-w-sm text-body-sm text-slate-gray">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
