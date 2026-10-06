/** Iniciales a partir de un nombre o email (ej. "Ana Gómez" -> "AG", "a@x.com" -> "A"). */
function getInitials(value: string): string {
  const base = value.split("@")[0] ?? "";
  const parts = base.split(/[._\s-]+/).filter(Boolean);
  const raw =
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : base.slice(0, 2);
  return raw.toUpperCase() || "?";
}

type AvatarSize = "sm" | "md" | "lg";
type AvatarTone = "neutral" | "primary";

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-caption",
  md: "h-9 w-9 text-body-sm",
  lg: "h-10 w-10 text-body-sm",
};

const toneStyles: Record<AvatarTone, string> = {
  neutral: "bg-pebble text-ink-navy",
  primary: "bg-signal-blue text-paper",
};

/** Avatar circular: imagen si hay `src`, si no las iniciales de `name`. */
export function Avatar({
  name,
  src,
  size = "md",
  tone = "neutral",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-full object-cover ${sizeStyles[size]} ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeStyles[size]} ${toneStyles[tone]} ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
