import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <CircleNotch
      aria-hidden
      weight="bold"
      className={`h-8 w-8 animate-spin text-signal-blue ${className}`}
    />
  );
}
