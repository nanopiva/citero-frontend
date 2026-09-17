"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Storefront } from "@phosphor-icons/react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { ButtonLink } from "@/components/ui/Button";
import { BusinessHeader } from "@/components/booking/BusinessHeader";
import { BusinessInfo } from "@/components/booking/BusinessInfo";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type {
  BusinessResponseDto,
  ServiceResponseDto,
  StaffResponseDto,
} from "@/types";

export default function BusinessPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [staffList, setStaffList] = useState<StaffResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const load = async () => {
      try {
        const bizRes = await api.get<BusinessResponseDto>(
          `/businesses/${slug}`,
        );
        if (!active) return;
        setBusiness(bizRes.data);

        const [servicesRes, staffRes] = await Promise.all([
          api.get<ServiceResponseDto[]>(
            `/businesses/${bizRes.data.id}/services`,
          ),
          api.get<StaffResponseDto[]>(`/businesses/${bizRes.data.id}/staff`),
        ]);
        if (!active) return;
        setServices(servicesRes.data);
        setStaffList(staffRes.data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="h-40 w-full animate-pulse bg-pebble sm:h-52" />
        <div className="mx-auto w-full max-w-page px-6">
          <div className="flex gap-5 pt-3">
            <div className="-mt-14 h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-pebble sm:-mt-16 sm:h-28 sm:w-28" />
            <div className="space-y-3 pb-3 pt-1">
              <div className="h-8 w-56 animate-pulse rounded-lg bg-pebble" />
              <div className="h-4 w-72 animate-pulse rounded bg-pebble" />
            </div>
          </div>
          <div className="grid gap-8 py-10 lg:grid-cols-[340px_minmax(0,1fr)]">
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

  if (error || !business) {
    return (
      <div className="flex min-h-dvh flex-col bg-cloud">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="flex max-w-md flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
              <Storefront className="h-7 w-7" weight="regular" />
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

  return (
    <div className="flex min-h-dvh flex-col bg-cloud">
      <Navbar />

      <main className="flex-1">
        <BusinessHeader business={business} />

        <div className="mx-auto w-full max-w-page px-6">
          <div className="grid gap-8 py-10 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="order-2 lg:order-1">
              <BusinessInfo business={business} />
            </aside>

            <section className="order-1 lg:order-2">
              <BookingWizard
                business={business}
                services={services}
                staffList={staffList}
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
