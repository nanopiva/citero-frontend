"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StorefrontIcon } from "@phosphor-icons/react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { BusinessHeader } from "@/components/booking/BusinessHeader";
import { BusinessInfo } from "@/components/booking/BusinessInfo";
import { BookingWizard } from "@/components/booking/BookingWizard";
import {
  ReservationMode,
  type BusinessResponseDto,
  type ServiceResponseDto,
  type StaffResponseDto,
} from "@/types";

export default function BusinessPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [staffList, setStaffList] = useState<StaffResponseDto[]>([]);
  const [reservationMode, setReservationMode] = useState<ReservationMode>(
    ReservationMode.PUBLIC,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"notFound" | "network" | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const bizRes = await api.get<BusinessResponseDto>(
          `/businesses/${slug}`,
        );
        if (!active) return;
        setBusiness(bizRes.data);

        const [servicesRes, staffRes, configRes] = await Promise.all([
          api.get<ServiceResponseDto[]>(
            `/businesses/${bizRes.data.id}/services`,
          ),
          api.get<StaffResponseDto[]>(`/businesses/${bizRes.data.id}/staff`),
          api
            .get<{ reservationMode: ReservationMode }>(
              `/businesses/${bizRes.data.id}/config`,
            )
            .catch(() => ({
              data: { reservationMode: ReservationMode.PUBLIC },
            })),
        ]);
        if (!active) return;
        setServices(servicesRes.data);
        setStaffList(staffRes.data);
        setReservationMode(configRes.data.reservationMode);
      } catch (err) {
        if (!active) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        setError(status === 404 ? "notFound" : "network");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [slug, reloadKey]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="h-40 w-full animate-pulse bg-pebble sm:h-52" />
        <div className="mx-auto w-full max-w-page px-6">
          <div className="flex gap-5 pt-3">
            <div className="-mt-14 h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-pebble sm:-mt-16 sm:h-28 sm:w-28" />
            <div className="min-w-0 space-y-3 pb-3 pt-1">
              <div className="h-8 w-full max-w-56 animate-pulse rounded-lg bg-pebble" />
              <div className="h-4 w-full max-w-72 animate-pulse rounded bg-pebble" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="order-2 space-y-6 lg:order-1">
              <div className="h-56 animate-pulse rounded-2xl bg-pebble" />
              <div className="h-56 animate-pulse rounded-2xl bg-pebble" />
            </div>
            <div className="order-1 h-[520px] animate-pulse rounded-2xl bg-pebble lg:order-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error === "notFound" || (!error && !business)) {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="flex max-w-md flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
              <StorefrontIcon className="h-7 w-7" weight="regular" />
            </span>
            <h1 className="mt-5 text-subheading font-bold leading-subheading text-ink-navy">
              Negocio no encontrado
            </h1>
            <p className="mt-2 text-body leading-body-lg text-slate-gray">
              No pudimos encontrar el perfil que buscás. Es posible que el
              enlace sea incorrecto o que el negocio ya no esté disponible.
            </p>
            <ButtonLink href="/" variant="outline" className="mt-6">
              Volver al inicio
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  if (error === "network" || !business) {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <ErrorState
            title="No pudimos cargar el negocio"
            message="Revisá tu conexión e intentá de nuevo."
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cloud">
      <Navbar />

      <main className="flex-1">
        <BusinessHeader business={business} />

        <div className="mx-auto w-full max-w-page px-6">
          <div className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="order-2 lg:order-1">
              <BusinessInfo business={business} />
            </aside>

            <section className="relative order-1 lg:order-2">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-sky-cyan/15 blur-3xl"
              />
              <BookingWizard
                business={business}
                services={services}
                staffList={staffList}
                reservationMode={reservationMode}
                slug={slug}
              />
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-hairline bg-cloud">
        <div className="mx-auto flex max-w-page flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <p className="text-body-sm text-slate-gray">
            Reservas gestionadas con{" "}
            <span className="font-semibold text-ink-navy">Citero</span>
          </p>
          <Link
            href="/"
            className="text-body-sm font-medium text-ink-navy transition-colors hover:text-signal-blue"
          >
            Conocer Citero
          </Link>
        </div>
      </footer>
    </div>
  );
}
