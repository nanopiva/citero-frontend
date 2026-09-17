import Link from "next/link";
import { ArrowLeft, Compass } from "@phosphor-icons/react/dist/ssr";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-cloud font-hanken text-ink-navy">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 pb-20 pt-28 md:pt-36">
        <div className="relative w-full max-w-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 rounded-full bg-sky-cyan/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-coral-magenta/20 blur-3xl"
          />

          <div className="relative rounded-3xl border border-hairline bg-paper px-6 py-14 text-center shadow-sm-2 sm:px-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f0ff] text-signal-blue">
              <Compass className="h-7 w-7" weight="regular" />
            </span>

            <p className="mt-6 text-display font-bold leading-none text-signal-blue">
              404
            </p>

            <h1 className="mt-4 text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
              Página no encontrada
            </h1>

            <p className="mx-auto mt-4 max-w-md text-body-lg leading-body-lg text-slate-gray">
              La página que buscás no existe o cambió de dirección. Revisá el
              enlace o volvé al inicio para seguir donde estabas.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-signal-blue px-6 py-3 text-button font-semibold leading-button text-paper transition-all hover:brightness-95 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" weight="bold" />
                Volver al inicio
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-ink-navy px-6 py-3 text-button font-semibold leading-button text-paper transition-colors hover:bg-ink-navy/90"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
