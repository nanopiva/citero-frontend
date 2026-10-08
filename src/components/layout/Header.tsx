"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Plataforma", href: "/#plataforma" },
  { label: "Recordatorios", href: "/#beneficios" },
  { label: "FAQ", href: "/#faq" },
];

function LogoMark() {
  return (
    <Link
      href="/"
      aria-label="Citero — Inicio"
      className="group -m-1.5 flex items-center rounded-xl p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/40"
    >
      <span className="relative block w-fit origin-left transition-[scale,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[scale,filter] group-hover:scale-[1.04] group-hover:drop-shadow-[0_8px_18px_rgba(0,107,255,0.22)] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        <Image
          src="/logos/LogoCitero.webp"
          alt="Citero"
          width={1401}
          height={467}
          sizes="(max-width: 640px) 84px, 96px"
          loading="eager"
          className="block h-7 w-auto object-contain sm:h-8"
        />
        {/* Brillo que recorre el logotipo en el hover, enmascarado a su forma */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-[length:250%_100%] bg-[position:-60%_0] bg-no-repeat opacity-0 transition-[background-position,opacity] duration-700 ease-out group-hover:bg-[position:160%_0] group-hover:opacity-100 motion-reduce:hidden"
            style={{
              backgroundImage:
                "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.9) 50%, transparent 62%)",
              maskImage: "url('/logos/LogoCitero.webp')",
              WebkitMaskImage: "url('/logos/LogoCitero.webp')",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          />
        </span>
      </span>
    </Link>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      if (media.matches) setIsMenuOpen(false);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <>
      {/* Mobile: barra fija con menú */}
      <div className="fixed inset-x-0 top-0 z-50 lg:hidden">
        <header
          className={`flex h-16 items-center justify-between border-b px-4 transition-colors duration-300 ${
            isScrolled || isMenuOpen
              ? "border-hairline bg-paper"
              : "border-transparent bg-cloud/80 backdrop-blur-md"
          }`}
        >
          <LogoMark />
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-navy transition-colors hover:bg-pebble"
          >
            {isMenuOpen ? (
              <XIcon className="h-5 w-5" weight="bold" />
            ) : (
              <ListIcon className="h-5 w-5" weight="bold" />
            )}
          </button>
        </header>

        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="border-b border-hairline bg-paper px-4 pb-5 pt-2 shadow-sm-2"
          >
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-body font-medium text-ink-navy transition-colors hover:bg-pebble hover:text-signal-blue"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-4">
              <ButtonLink
                href="/login"
                variant="dark"
                fullWidth
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar sesión
              </ButtonLink>
              <ButtonLink
                href="/registro"
                fullWidth
                onClick={() => setIsMenuOpen(false)}
              >
                Crear cuenta
              </ButtonLink>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: píldora flotante */}
      <div className="pointer-events-none fixed left-0 top-0 z-50 hidden w-full justify-center lg:flex">
        <header
          className={`pointer-events-auto flex items-center justify-between rounded-2xl border transition-all duration-500 ease-in-out ${
            isScrolled
              ? "mt-3 h-16 w-[95%] max-w-[960px] border-hairline bg-paper/90 px-5 shadow-sm-2 backdrop-blur-md"
              : "mt-4 h-20 w-[95%] max-w-page border-transparent bg-transparent px-4 shadow-none"
          }`}
        >
          <LogoMark />

          <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2 text-body-sm font-medium text-ink-navy transition-colors hover:bg-pebble hover:text-signal-blue"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ButtonLink
              href="/login"
              variant="dark"
              className="hidden lg:inline-flex"
            >
              Iniciar sesión
            </ButtonLink>
            <ButtonLink href="/registro">Crear cuenta</ButtonLink>
          </div>
        </header>
      </div>
    </>
  );
}
