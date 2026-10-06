import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <CircleNotchIcon
      aria-hidden
      weight="bold"
      className={`h-8 w-8 animate-spin text-signal-blue ${className}`}
    />
  );
}
