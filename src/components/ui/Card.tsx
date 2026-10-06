import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ padded = true, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-3xl border border-hairline bg-paper shadow-sm",
        padded ? "p-6" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
