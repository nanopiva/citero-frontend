import type { ReactNode } from "react";

type SlugPreviewProps = {
  slug: string;
  baseUrl?: string;
  isValid?: boolean;
  rightElement?: ReactNode;
};

export function SlugPreview({
  slug,
  baseUrl = "citero.app/negocio/",
  isValid = true,
  rightElement,
}: SlugPreviewProps) {
  const isEmpty = !slug || slug.trim() === "";

  return (
    <div
      className={`flex h-11 min-w-0 items-center gap-2 rounded-lg border border-hairline bg-cloud px-4 text-body-sm ${
        isValid ? "text-slate-gray" : "text-danger"
      }`}
    >
      <svg
        className="h-4 w-4 shrink-0 text-slate-gray"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <span className="hidden shrink-0 text-slate-gray min-[400px]:inline">
        {baseUrl}
      </span>
      <span
        className={`min-w-0 truncate ${
          isEmpty ? "italic text-slate-gray" : "font-medium text-ink-navy"
        }`}
      >
        {isEmpty ? "tu-negocio" : slug}
      </span>
      {isValid && !isEmpty && (
        <svg
          className="ml-auto h-4 w-4 shrink-0 text-signal-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      {rightElement}
    </div>
  );
}
