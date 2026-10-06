import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

/**
 * Chrome compartido del panel autenticado: topbar + sidebar + contenido.
 * Cada página solo renderiza su contenido (con su propio contenedor de ancho).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cloud">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
