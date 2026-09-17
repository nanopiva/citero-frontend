import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-cloud font-hanken text-ink-navy">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-28 md:pt-36">
          <h1 className="text-balance text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
            {title}
          </h1>
          <p className="mt-3 text-body-sm text-slate-gray">
            Última actualización: {updatedAt}
          </p>
          <div className="mt-10 space-y-8">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-body-lg font-semibold text-ink-navy">{title}</h2>
      <div className="space-y-3 text-body leading-body-lg text-slate-gray">
        {children}
      </div>
    </section>
  );
}
