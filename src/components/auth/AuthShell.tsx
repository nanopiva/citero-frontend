import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import { AuthAside } from "./AuthAside";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-cloud font-hanken text-ink-navy">
      <Header />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-16 h-[26rem] w-[26rem] rounded-full bg-sky-cyan/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-coral-magenta/10 blur-3xl"
      />

      <section className="relative mx-auto flex min-h-dvh max-w-page items-center px-4 pb-16 pt-28 sm:px-6">
        <div className="grid grid-cols-1 w-full items-center gap-16 lg:grid-cols-[1fr_minmax(0,440px)]">
          <AuthAside className="hidden lg:block" />
          <div className="mx-auto w-full max-w-[440px]">{children}</div>
        </div>
      </section>
    </main>
  );
}
