import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  BellRingingIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  CheckCircleIcon,
  ClockIcon,
  FirstAidIcon,
  FlowerLotusIcon,
  InfoIcon,
  PaintBrushIcon,
  ScissorsIcon,
  SlidersHorizontalIcon,
  StethoscopeIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/dist/ssr";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthenticatedRedirect } from "@/components/auth/AuthenticatedRedirect";
import { HeroBookingPreview } from "@/components/landing/HeroBookingPreview";
import {
  Reveal,
  Stagger,
  StaggerItem,
  HoverLift,
} from "@/components/landing/Reveal";
import { FaqItem } from "@/components/landing/FaqItem";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

function ReminderRow({
  icon,
  title,
  desc,
  checked,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  checked: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="text-signal-blue">{icon}</span>
        <div className="min-w-0">
          <p className="text-body-sm font-medium text-ink-navy">{title}</p>
          <p className="text-caption text-slate-gray">{desc}</p>
        </div>
      </div>
      <span
        aria-hidden
        className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${
          checked ? "bg-signal-blue" : "bg-pebble"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-paper ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </div>
  );
}

const CATEGORIES = [
  { label: "Barberías", icon: ScissorsIcon },
  { label: "Clínicas", icon: FirstAidIcon },
  { label: "Salones", icon: PaintBrushIcon },
  { label: "Spas", icon: FlowerLotusIcon },
  { label: "Consultorios", icon: StethoscopeIcon },
  { label: "Estudios", icon: StorefrontIcon },
];

const STEPS = [
  {
    title: "Elegí el servicio",
    text: "Duración y precio a la vista antes de reservar.",
  },
  {
    title: "Elegí profesional",
    text: "Cualquier integrante del equipo o uno en particular.",
  },
  {
    title: "Elegí fecha y hora",
    text: "Solo se muestran los horarios realmente libres.",
  },
];

const FAQS = [
  {
    q: "¿Qué recordatorios envía Citero?",
    a: "Además de la confirmación al cliente, al dueño y al profesional, podés activar recordatorios automáticos 24 horas y 2 horas antes del turno. Se configuran por negocio y se envían por email.",
  },
  {
    q: "¿Puedo bloquear a un cliente problemático?",
    a: "Sí. Desde la configuración de tu negocio podés bloquear a un cliente (por ejemplo, por ausencias reiteradas) para que no vuelva a reservar, y desbloquearlo cuando quieras.",
  },
  {
    q: "¿Necesito cobrar una seña por adelantado?",
    a: "No. Citero reduce el ausentismo con recordatorios automáticos y verificación de identidad opcional, sin fricción de pagos anticipados. El cobro se resuelve en el local, como siempre.",
  },
  {
    q: "¿Quién puede reservar en mi agenda?",
    a: "Vos elegís entre dos modos: público (cualquiera que deje su correo) o verificado (la persona confirma su correo con un código antes del turno). Lo cambiás cuando quieras desde la configuración de tu negocio.",
  },
  {
    q: "¿Puedo gestionar varios empleados y sus horarios?",
    a: "Sí. Cargá tu equipo, asigná qué servicios realiza cada persona y definí horarios de apertura y cierre por día. La disponibilidad se calcula sola.",
  },
];

const TEAM_FEATURES = [
  {
    title: "Multi-empleado",
    text: "Una agenda por profesional, sin superposiciones.",
  },
  {
    title: "Horarios flexibles",
    text: "Apertura y cierre por día de la semana.",
  },
  {
    title: "Perfil público",
    text: "Tu negocio con dirección, redes y servicios.",
  },
];

const AGENDA_STAFF = [
  { name: "Martín", initial: "M" },
  { name: "Sofía", initial: "S" },
  { name: "Nicolás", initial: "N" },
];

type AgendaCell = { time: string; label: string; active: boolean } | null;

const AGENDA_ROWS: { hour: string; cells: AgendaCell[] }[] = [
  {
    hour: "09:00",
    cells: [
      { time: "09:00", label: "Consulta", active: false },
      { time: "09:00", label: "Sesión", active: false },
      null,
    ],
  },
  {
    hour: "10:00",
    cells: [
      { time: "10:00", label: "Consulta + control", active: true },
      null,
      { time: "10:00", label: "Asesoría", active: false },
    ],
  },
  {
    hour: "11:00",
    cells: [
      null,
      { time: "11:00", label: "Sesión", active: true },
      { time: "11:00", label: "Consulta", active: false },
    ],
  },
  {
    hour: "12:00",
    cells: [
      { time: "12:00", label: "Control", active: false },
      null,
      { time: "12:00", label: "Sesión", active: true },
    ],
  },
  {
    hour: "13:00",
    cells: [
      null,
      { time: "13:00", label: "Seguimiento", active: false },
      null,
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-cloud font-hanken text-ink-navy">
      <AuthenticatedRedirect />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 -top-24 h-[28rem] w-[28rem] rounded-full bg-sky-cyan/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 top-40 h-[24rem] w-[24rem] rounded-full bg-coral-magenta/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-page px-6 pb-16 pt-24 md:pb-24 md:pt-28">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h1 className="text-balance text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
                  Turnos y reservas para tu negocio
                </h1>

                <p className="mt-6 max-w-xl text-body-lg leading-body-lg text-slate-gray">
                  Citero toma reservas 24/7, verifica a tus clientes y reduce
                  las ausencias. Sin llamados, sin señas, sin planillas.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink
                    href="/registro"
                    size="lg"
                    rightIcon={<ArrowRightIcon className="h-4 w-4" weight="bold" />}
                  >
                    Crear cuenta gratis
                  </ButtonLink>
                  <ButtonLink href="#como-funciona" variant="outline" size="lg">
                    Ver cómo funciona
                  </ButtonLink>
                </div>
              </div>

              <HeroBookingPreview />
            </div>
          </div>
        </section>

        {/* Tipos de negocio */}
        <section className="border-y border-hairline bg-paper/60">
          <Reveal className="mx-auto max-w-page px-6 py-10">
            <p className="text-center text-body-sm text-slate-gray">
              Una plataforma para negocios que viven de su agenda
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <span
                    key={category.label}
                    className="inline-flex items-center gap-2 text-body-lg font-medium text-slate-gray"
                  >
                    <Icon className="h-6 w-6" weight="regular" />
                    {category.label}
                  </span>
                );
              })}
            </div>
          </Reveal>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-24">
          <div className="mx-auto max-w-page px-6 py-20 md:py-24">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
                Reservá en tres pasos
              </h2>
              <p className="mt-4 text-body-lg leading-body-lg text-slate-gray">
                El cliente elige, Citero calcula la disponibilidad real y todos
                reciben la confirmación.
              </p>
            </Reveal>

            <div className="relative mt-16">
              <div
                aria-hidden
                className="absolute left-0 right-0 top-6 hidden h-px bg-hairline lg:block"
              />
              <Stagger
                as="ol"
                stagger={0.1}
                className="grid grid-cols-1 gap-10 sm:grid-cols-3"
              >
                {STEPS.map((step, index) => (
                  <StaggerItem
                    as="li"
                    key={step.title}
                    className="flex flex-col items-start"
                  >
                    <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-paper text-body-lg font-bold text-signal-blue shadow-sm">
                      {index + 1}
                    </span>
                    <h3 className="mt-5 text-body-lg font-semibold text-ink-navy">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-body-sm text-slate-gray">
                      {step.text}
                    </p>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </section>

        {/* Modos de reserva */}
        <section
          id="plataforma"
          className="scroll-mt-24 border-t border-hairline"
        >
          <div className="mx-auto grid grid-cols-1 max-w-page items-center gap-16 px-6 py-20 md:py-24 lg:grid-cols-2">
            <Reveal>
              <h2 className="text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
                Cada negocio decide cómo recibe reservas
              </h2>
              <p className="mt-5 max-w-xl text-body-lg leading-body-lg text-slate-gray">
                Elegí cómo recibe reservas cada negocio: modo público (la persona
                deja su correo) o modo verificado (confirma su correo con un
                código antes del turno).
              </p>
            </Reveal>

            <Reveal delay={0.1} className="relative">
              <HoverLift>
                <div
                  aria-hidden
                  className="absolute -right-6 -top-8 h-56 w-56 rounded-full bg-coral-magenta/20 blur-3xl"
                />
                <div className="relative rounded-2xl border border-hairline bg-paper p-6 shadow-sm-2">
                  <div className="flex items-center gap-3 border-b border-hairline pb-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-signal-blue">
                      <SlidersHorizontalIcon className="h-5 w-5" weight="regular" />
                    </span>
                    <div>
                      <p className="text-body-sm font-semibold text-ink-navy">
                        Reglas de reserva
                      </p>
                      <p className="text-caption text-slate-gray">
                        Definí quién puede reservar y con cuánta anticipación
                        pueden cancelar.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-caption font-medium text-slate-gray">
                        ¿Quién puede reservar?
                      </p>
                      <div className="mt-2 flex h-11 items-center justify-between gap-2 rounded-lg border border-hairline bg-paper px-3 text-body-sm text-ink-navy">
                        <span className="truncate">
                          Confirmar correo con código
                        </span>
                        <CaretDownIcon
                          className="h-4 w-4 shrink-0 text-slate-gray"
                          weight="bold"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-caption font-medium text-slate-gray">
                        Plazo para cancelar
                      </p>
                      <div className="mt-2 flex h-11 items-center rounded-lg border border-hairline bg-paper px-3 text-body-sm text-ink-navy">
                        <span>24 hs antes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </HoverLift>
            </Reveal>
          </div>
        </section>

        {/* Recordatorios por email */}
        <section
          id="beneficios"
          className="scroll-mt-24 border-t border-hairline"
        >
          <div className="mx-auto grid grid-cols-1 max-w-page items-center gap-16 px-6 py-20 md:py-24 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <HoverLift className="relative">
                <div
                  aria-hidden
                  className="absolute -bottom-8 -left-6 h-56 w-56 rounded-full bg-sky-cyan/20 blur-3xl"
                />
                <div className="relative rounded-2xl border border-hairline bg-paper p-6 shadow-sm-2">
                  <div className="flex items-center gap-3 border-b border-hairline pb-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-signal-blue">
                      <BellRingingIcon className="h-5 w-5" weight="regular" />
                    </span>
                    <div>
                      <p className="text-body-sm font-semibold text-ink-navy">
                        Recordatorios automáticos
                      </p>
                      <p className="text-caption text-slate-gray">
                        Enviá recordatorios por email para reducir ausencias.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <ReminderRow
                      icon={
                        <BellRingingIcon className="h-4 w-4" weight="regular" />
                      }
                      title="Habilitar recordatorios"
                      desc="Interruptor general de recordatorios por email."
                      checked
                    />
                    <ReminderRow
                      icon={<ClockIcon className="h-4 w-4" weight="regular" />}
                      title="Recordatorio 24 horas antes"
                      desc="Da tiempo al cliente para reprogramar o cancelar."
                      checked
                    />
                    <ReminderRow
                      icon={<ClockIcon className="h-4 w-4" weight="regular" />}
                      title="Recordatorio 2 horas antes"
                      desc="Último aviso para clientes que puedan haber olvidado el turno."
                      checked
                    />
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-pebble px-4 py-3">
                    <InfoIcon
                      className="mt-0.5 h-4 w-4 shrink-0 text-deep-cobalt"
                      weight="fill"
                    />
                    <p className="text-caption text-deep-cobalt">
                      Si desactivás el interruptor general, no se enviará ningún
                      recordatorio.
                    </p>
                  </div>
                </div>
              </HoverLift>
            </Reveal>

            <Reveal delay={0.1} className="order-1 lg:order-2">
              <h2 className="text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
                Recordatorios que reducen las ausencias
              </h2>
              <p className="mt-5 max-w-xl text-body-lg leading-body-lg text-slate-gray">
                Citero avisa por email al cliente, al dueño y al profesional en
                cada reserva, y envía recordatorios automáticos antes del turno.
                Menos olvidos, menos ausencias.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Confirmación por email al cliente, al dueño y al profesional",
                  "Recordatorio 24 horas antes y último aviso 2 horas antes",
                  "Se activa por negocio, con interruptor general y por franja",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircleIcon
                      className="mt-0.5 h-5 w-5 shrink-0 text-signal-blue"
                      weight="fill"
                    />
                    <span className="text-body text-slate-gray">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="#faq"
                className="mt-8 inline-flex items-center gap-2 text-body font-semibold text-ink-navy transition-colors hover:text-signal-blue"
              >
                ¿Qué emails envía Citero?
                <ArrowRightIcon className="h-4 w-4" weight="bold" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* Gestión de equipo */}
        <section className="border-t border-hairline">
          <div className="mx-auto max-w-page px-6 py-20 md:py-24">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
                Toda tu agenda, en una sola pantalla
              </h2>
              <p className="mt-4 text-body-lg leading-body-lg text-slate-gray">
                Cargá a tu equipo, asigná qué servicios realiza cada persona y
                definí horarios por día. La disponibilidad se calcula sola.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="relative mx-auto mt-14 max-w-4xl">
              <HoverLift>
                <div
                  aria-hidden
                  className="absolute -right-8 -bottom-8 h-56 w-56 rounded-full bg-coral-magenta/20 blur-3xl"
                />
                <div className="relative rounded-2xl border border-hairline bg-paper p-6 shadow-sm-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm font-semibold text-ink-navy">
                    Agenda · Jueves 15
                  </p>
                  <Badge variant="primary">
                    <CalendarDotsIcon className="h-3.5 w-3.5" weight="bold" />
                    8 turnos
                  </Badge>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <div className="min-w-[420px]">
                    <div className="grid grid-cols-[3rem_repeat(3,minmax(0,1fr))] border-b border-hairline">
                      <div />
                      {AGENDA_STAFF.map((staff) => (
                        <div
                          key={staff.name}
                          className="flex items-center gap-2 border-l border-hairline px-3 pb-2"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pebble text-caption font-semibold text-ink-navy">
                            {staff.initial}
                          </span>
                          <span className="text-caption font-medium text-ink-navy">
                            {staff.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {AGENDA_ROWS.map((row) => (
                      <div
                        key={row.hour}
                        className="grid grid-cols-[3rem_repeat(3,minmax(0,1fr))] border-b border-hairline last:border-b-0"
                      >
                        <div className="py-2 pr-2 text-right text-caption text-slate-gray">
                          {row.hour}
                        </div>
                        {row.cells.map((cell, index) => (
                          <div
                            key={index}
                            className="min-h-12 border-l border-hairline p-1"
                          >
                            {cell && (
                              <div
                                className={`h-full rounded-lg border px-2 py-1.5 ${
                                  cell.active
                                    ? "border-signal-blue bg-signal-blue"
                                    : "border-hairline bg-paper"
                                }`}
                              >
                                <p
                                  className={`text-caption ${
                                    cell.active
                                      ? "text-paper"
                                      : "text-slate-gray"
                                  }`}
                                >
                                  {cell.time}
                                </p>
                                <p
                                  className={`text-caption font-medium ${
                                    cell.active
                                      ? "text-paper"
                                      : "text-ink-navy"
                                  }`}
                                >
                                  {cell.label}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </HoverLift>
            </Reveal>
            <Stagger
              as="dl"
              className="mx-auto mt-14 grid grid-cols-1 max-w-4xl gap-8 border-t border-hairline pt-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-hairline"
            >
              {TEAM_FEATURES.map((feature) => (
                <StaggerItem
                  key={feature.title}
                  className="md:px-8 md:first:pl-0 md:last:pr-0"
                >
                  <dt className="text-body font-semibold text-ink-navy">
                    {feature.title}
                  </dt>
                  <dd className="mt-1 text-body-sm text-slate-gray">
                    {feature.text}
                  </dd>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section id="faq" className="scroll-mt-24 border-t border-hairline">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <Reveal className="text-center">
              <h2 className="text-heading-sm font-bold leading-heading-sm md:text-heading md:leading-heading">
                Preguntas frecuentes
              </h2>
              <p className="mt-4 text-body-lg leading-body-lg text-slate-gray">
                Todo lo que necesitás saber antes de empezar.
              </p>
            </Reveal>

            <Reveal
              delay={0.1}
              className="mt-12 divide-y divide-hairline border-y border-hairline"
            >
              {FAQS.map((faq) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </Reveal>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-page px-6 pb-20 md:pb-24">
          <Reveal className="relative overflow-hidden rounded-3xl bg-ink-navy px-6 py-16 text-center sm:px-16">
              <div
                aria-hidden
                className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-signal-blue/30 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-coral-magenta/20 blur-3xl"
              />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-heading-sm font-bold leading-heading-sm text-paper md:text-heading md:leading-heading">
                  ¿Listo para ordenar tu agenda?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-body-lg leading-body-lg text-mist-gray">
                  Creá tu cuenta, cargá tus servicios y compartí el link de
                  reservas hoy mismo.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <ButtonLink href="/registro" size="lg">
                    Crear cuenta gratis
                  </ButtonLink>
                  <ButtonLink href="/login" variant="light" size="lg">
                    Iniciar sesión
                  </ButtonLink>
                </div>
              </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
