"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

type ImageUploaderProps = {
  value?: string | null;
  onChange?: (file: File | null, preview: string | null) => void;
  variant?: "logo" | "cover";
  label?: string;
  hint?: string;
  loading?: boolean;
  error?: string | null;
};

export function ImageUploader({
  value,
  onChange,
  variant = "logo",
  label,
  hint,
  loading = false,
  error,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Durante la subida se muestra el archivo elegido; terminada (éxito o error) se
  // muestra la URL canónica, así un fallo no deja una imagen "fantasma".
  const displayUrl = loading ? (preview ?? value) : value;

  useEffect(
    () => () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    },
    [],
  );

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    const url = URL.createObjectURL(file);
    lastUrlRef.current = url;
    setPreview(url);
    setFileName(file.name);
    onChange?.(file, url);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (loading) return;
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const isLogo = variant === "logo";

  return (
    <div className={isLogo ? "flex flex-col items-start gap-2" : "space-y-2"}>
      {label && (
        <p className="text-body-sm font-medium text-ink-navy">{label}</p>
      )}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!loading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          "group relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed transition-colors",
          isLogo ? "h-32 w-32 rounded-2xl" : "aspect-[16/7] w-full rounded-xl",
          loading ? "pointer-events-none" : "",
          isDragging
            ? "border-signal-blue bg-[#e6f0ff]"
            : "border-hairline bg-pebble hover:border-signal-blue",
        ].join(" ")}
      >
        {displayUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={label ?? "Imagen"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-ink-navy/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-body-sm font-medium text-paper">
                Cambiar
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-gray transition-colors group-hover:text-signal-blue">
            <svg
              className={isLogo ? "h-7 w-7" : "h-8 w-8"}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-caption font-medium">Subir imagen</span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-navy/50">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInput}
          disabled={loading}
        />
      </label>
      {fileName && (
        <p className="max-w-full truncate text-caption text-slate-gray">
          {fileName}
        </p>
      )}
      {error && <p className="text-caption text-red-500">{error}</p>}
      {hint && !error && (
        <p className="text-caption text-slate-gray">{hint}</p>
      )}
    </div>
  );
}
