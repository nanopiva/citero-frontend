import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";

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
    <Card padded={false} className={`flex flex-col ${className}`}>
      <CardHeader title={title} icon={icon} action={action} />
      <div className={`flex-1 p-5 ${bodyClassName}`}>{children}</div>
    </Card>
  );
}
