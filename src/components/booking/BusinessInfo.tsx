import type { ReactNode } from "react";
import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  MapPinIcon,
  NavigationArrowIcon,
  PhoneIcon,
  TiktokLogoIcon,
  WhatsappLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { BusinessMap } from "@/components/ui/BusinessMap";
import { normalizeUrl } from "@/lib/url";
import type { BusinessResponseDto } from "@/types";

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline text-slate-gray transition-colors hover:border-signal-blue hover:text-signal-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/30"
    >
      {children}
    </a>
  );
}

export function BusinessInfo({ business }: { business: BusinessResponseDto }) {
  const whatsappDigits = business.whatsappNumber?.replace(/\D/g, "");
  const instagramUrl = normalizeUrl(business.instagramUrl);
  const facebookUrl = normalizeUrl(business.facebookUrl);
  const tiktokUrl = normalizeUrl(business.tiktokUrl);
  const twitterUrl = normalizeUrl(business.twitterUrl);
  const hasCoords = business.latitude != null && business.longitude != null;
  const hasContact = business.address || business.phone || whatsappDigits;
  const hasSocial = instagramUrl || facebookUrl || tiktokUrl || twitterUrl;

  const mapLink = business.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        business.address,
      )}`
    : null;

  return (
    <div className="space-y-6">
      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-hairline px-5 py-3.5">
          <h2 className="text-body font-semibold text-ink-navy">Información</h2>
        </div>

        {hasContact ? (
          <ul className="divide-y divide-hairline">
            {business.address && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <MapPinIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-signal-blue"
                  weight="regular"
                />
                <div className="min-w-0">
                  <p className="text-caption text-slate-gray">Dirección</p>
                  <p className="text-body-sm text-ink-navy">
                    {business.address}
                  </p>
                </div>
              </li>
            )}
            {business.phone && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <PhoneIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-signal-blue"
                  weight="regular"
                />
                <div className="min-w-0">
                  <p className="text-caption text-slate-gray">Teléfono</p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-body-sm text-ink-navy transition-colors hover:text-signal-blue"
                  >
                    {business.phone}
                  </a>
                </div>
              </li>
            )}
            {business.whatsappNumber && whatsappDigits && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <WhatsappLogoIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-signal-blue"
                  weight="regular"
                />
                <div className="min-w-0">
                  <p className="text-caption text-slate-gray">WhatsApp</p>
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-body-sm text-ink-navy transition-colors hover:text-signal-blue"
                  >
                    {business.whatsappNumber}
                  </a>
                </div>
              </li>
            )}
          </ul>
        ) : (
          <p className="px-5 py-4 text-body-sm text-slate-gray">
            Este negocio todavía no cargó datos de contacto.
          </p>
        )}

        {hasSocial && (
          <div className="border-t border-hairline px-5 py-4">
            <p className="text-caption font-semibold uppercase tracking-wider text-slate-gray">
              Redes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {instagramUrl && (
                <SocialLink href={instagramUrl} label="Instagram">
                  <InstagramLogoIcon className="h-5 w-5" weight="regular" />
                </SocialLink>
              )}
              {facebookUrl && (
                <SocialLink href={facebookUrl} label="Facebook">
                  <FacebookLogoIcon className="h-5 w-5" weight="regular" />
                </SocialLink>
              )}
              {tiktokUrl && (
                <SocialLink href={tiktokUrl} label="TikTok">
                  <TiktokLogoIcon className="h-5 w-5" weight="regular" />
                </SocialLink>
              )}
              {twitterUrl && (
                <SocialLink href={twitterUrl} label="X">
                  <XLogoIcon className="h-5 w-5" weight="regular" />
                </SocialLink>
              )}
            </div>
          </div>
        )}
      </Card>

      {hasCoords ? (
        <Card padded={false} className="overflow-hidden">
          <BusinessMap
            latitude={business.latitude!}
            longitude={business.longitude!}
            className="h-56 w-full"
          />
          {mapLink && (
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 border-t border-hairline px-5 py-3.5 text-body-sm font-medium text-ink-navy transition-colors hover:bg-pebble"
            >
              <NavigationArrowIcon
                className="h-4 w-4 text-signal-blue"
                weight="fill"
              />
              Cómo llegar
            </a>
          )}
        </Card>
      ) : (
        mapLink && (
          <Card>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pebble text-slate-gray">
                <MapPinIcon className="h-5 w-5" weight="regular" />
              </span>
              <p className="text-body-sm text-slate-gray">
                Sin ubicación en el mapa
              </p>
              <a
                href={mapLink}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm font-medium text-signal-blue hover:underline"
              >
                Ver en Google Maps
              </a>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
