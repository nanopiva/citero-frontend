import { normalizeUrl } from "@/lib/url";
import type { BusinessResponseDto } from "@/types";

export function BusinessHeader({
  business,
}: {
  business: BusinessResponseDto;
}) {
  const coverUrl = normalizeUrl(business.coverImageUrl);
  const logoUrl = normalizeUrl(business.logoUrl);
  const initials = business.name.slice(0, 2).toUpperCase();

  return (
    <header>
      <div className="relative h-40 w-full overflow-hidden bg-ink-navy sm:h-52">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Portada de ${business.name}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute -left-16 -top-12 h-64 w-64 rounded-full bg-sky-cyan/25 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-coral-magenta/20 blur-3xl"
            />
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-page px-6">
        <div className="relative z-10 flex flex-col gap-4 pt-3 pb-2 sm:flex-row sm:items-end sm:gap-6">
          <div className="-mt-14 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-paper bg-paper shadow-sm-2 sm:-mt-16 sm:h-28 sm:w-28">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-subheading font-bold text-ink-navy">
                {initials}
              </span>
            )}
          </div>

          <div className="pb-1 sm:pb-3">
            <h1 className="text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
              {business.name}
            </h1>
            {business.description && (
              <p className="mt-2 max-w-2xl text-body-sm text-slate-gray">
                {business.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
