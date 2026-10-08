export type CompressImageOptions = {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
};

const SAFE_IMAGE_PROTOCOLS = new Set(["http:", "https:", "blob:"]);

/**
 * Normaliza una URL para usarla en el `src` de una imagen, o devuelve `null` si
 * no es una URL válida o usa un esquema no permitido (p. ej. `javascript:`).
 * `encodeURI` codifica los caracteres y es reconocido como sanitizer de salida.
 */
export function toSafeImageSrc(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    if (!SAFE_IMAGE_PROTOCOLS.has(new URL(url).protocol)) return null;
  } catch {
    return null;
  }
  return encodeURI(url);
}

/**
 * Redimensiona y comprime una imagen en el navegador antes de subirla.
 * - Nunca agranda (scale <= 1).
 * - Salida en WebP (mantiene transparencia y comprime bien); si el navegador
 *   no lo soporta, el canvas cae a PNG automáticamente.
 * - Si la imagen ya es chica y liviana, se devuelve tal cual.
 */
export async function compressImage(
  file: File,
  { maxWidth, maxHeight, quality = 0.85 }: CompressImageOptions,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (typeof document === "undefined") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  if (scale === 1 && file.size <= 1_000_000) {
    bitmap.close?.();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}
