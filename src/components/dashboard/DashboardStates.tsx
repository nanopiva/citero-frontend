import { ErrorState } from "@/components/ui/ErrorState";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-pebble" />
        <div className="h-8 w-64 animate-pulse rounded-lg bg-pebble sm:w-72" />
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse bg-pebble" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-96 animate-pulse rounded-2xl bg-pebble" />
        <div className="space-y-6">
          <div className="h-44 animate-pulse rounded-2xl bg-pebble" />
          <div className="h-44 animate-pulse rounded-2xl bg-pebble" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <ErrorState
      title="No pudimos cargar el panel"
      message={message}
      onRetry={onRetry}
    />
  );
}
