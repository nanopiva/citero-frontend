import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseIcon,
  EnvelopeSimpleIcon,
  LinkedinLogoIcon,
} from "@phosphor-icons/react/dist/ssr";

const PRODUCT_LINKS = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Plataforma", href: "/#plataforma" },
  { label: "Recordatorios", href: "/#beneficios" },
  { label: "Preguntas frecuentes", href: "/#faq" },
];

const ACCOUNT_LINKS = [
  { label: "Iniciar sesión", href: "/login" },
  { label: "Crear cuenta", href: "/registro" },
  { label: "Recuperar contraseña", href: "/recuperar-contrasena" },
];

const CONTACT_LINKS = [
  {
    label: "Email: hola@citero.app",
    href: "mailto:hola@citero.app",
    external: false,
    icon: EnvelopeSimpleIcon,
  },
  {
    label: "LinkedIn: Mariano Piva",
    href: "https://www.linkedin.com/in/mariano-piva-551964307/",
    external: true,
    icon: LinkedinLogoIcon,
  },
  {
    label: "Portfolio: nanop.com.ar",
    href: "https://nanop.com.ar",
    external: true,
    icon: BriefcaseIcon,
  },
];

const LEGAL_LINKS = [
  { label: "Términos y condiciones", href: "/terminos" },
  { label: "Política de privacidad", href: "/privacidad" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-caption font-semibold uppercase tracking-wider text-slate-gray">
        {title}
      </p>
      <ul className="mt-3 space-y-2.5 text-body-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-medium text-ink-navy transition-colors hover:text-signal-blue"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-cloud">
      <div className="mx-auto max-w-page px-6 py-12 sm:py-16">
        <div className="flex flex-col gap-10 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              aria-label="Citero — Inicio"
              className="group inline-flex items-center"
            >
              <Image
                src="/logos/LogoCitero.webp"
                alt="Citero"
                width={1401}
                height={467}
                sizes="96px"
                className="h-8 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </Link>
            <p className="mt-4 max-w-xs text-body-sm text-slate-gray">
              La plataforma de reservas para negocios de servicios que cuidan
              su tiempo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:contents">
            <FooterColumn title="Producto" links={PRODUCT_LINKS} />
            <FooterColumn title="Cuenta" links={ACCOUNT_LINKS} />
            <div>
              <p className="text-caption font-semibold uppercase tracking-wider text-slate-gray">
                Contacto
              </p>
              <ul className="mt-3 flex items-center gap-2">
                {CONTACT_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noreferrer" : undefined}
                        aria-label={link.label}
                        title={link.label}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline bg-paper text-ink-navy transition-colors hover:border-signal-blue/40 hover:bg-pebble hover:text-signal-blue"
                      >
                        <Icon className="h-5 w-5" weight="regular" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-hairline pt-6 text-center sm:mt-12 sm:flex-row sm:justify-between sm:pt-8 sm:text-left">
          <p className="text-body-sm text-slate-gray">
            &copy; {new Date().getFullYear()} Citero. Todos los derechos
            reservados.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body-sm font-medium text-slate-gray transition-colors hover:text-ink-navy"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
