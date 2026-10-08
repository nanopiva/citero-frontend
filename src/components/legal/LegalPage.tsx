import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/** Slug estable a partir del título, para anclas de las secciones legales. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function LegalPage({
  title,
  updatedAt,
  toc,
  children,
}: {
  title: string;
  updatedAt: string;
  toc?: string[];
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

          {toc && toc.length > 0 && (
            <nav
              aria-label="Contenido"
              className="mt-8 rounded-2xl border border-hairline bg-paper p-5"
            >
              <p className="text-caption font-semibold uppercase tracking-wider text-slate-gray">
                Contenido
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {toc.map((item) => (
                  <li key={item}>
                    <a
                      href={`#${slugify(item)}`}
                      className="text-body-sm text-ink-navy transition-colors hover:text-signal-blue"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

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
    <section id={slugify(title)} className="scroll-mt-28 space-y-3">
      <h2 className="text-subheading font-semibold text-ink-navy">{title}</h2>
      <div className="space-y-3 text-body leading-body-lg text-slate-gray">
        {children}
      </div>
    </section>
  );
}
