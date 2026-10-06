import type { ReactNode } from "react";

/** Fila de lista estandarizada (shell de `<li>`), con alineación e hover opcionales. */
export function ListRow({
  children,
  align = "center",
  hover = false,
  className = "",
}: {
  children: ReactNode;
  align?: "center" | "start";
  hover?: boolean;
  className?: string;
}) {
  return (
    <li
      className={[
        "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:gap-4",
        align === "start" ? "sm:items-start" : "sm:items-center",
        hover ? "transition-colors hover:bg-cloud" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </li>
  );
}
