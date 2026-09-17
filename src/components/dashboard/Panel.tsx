import type { ReactNode } from "react";

export function Panel({
  title,
  icon,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-hairline bg-paper shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-body font-semibold text-ink-navy">
          {icon && <span className="text-signal-blue">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      <div className={`flex-1 p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
