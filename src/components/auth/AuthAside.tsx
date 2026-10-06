import {
  BellRingingIcon,
  CalendarDotsIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

const ITEMS = [
  {
    icon: ShieldCheckIcon,
    title: "Verificación de clientes",
    text: "El cliente confirma su correo con un código antes del turno.",
  },
  {
    icon: CalendarDotsIcon,
    title: "Disponibilidad real",
    text: "La agenda se calcula sola, sin superposiciones.",
  },
  {
    icon: BellRingingIcon,
    title: "Recordatorios automáticos",
    text: "Menos olvidos y menos turnos perdidos.",
  },
];

export function AuthAside({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <h2 className="max-w-md text-balance text-heading-sm font-bold leading-heading-sm text-ink-navy md:text-heading md:leading-heading">
        Turnos y reservas para tu negocio
      </h2>
      <p className="mt-6 max-w-md text-body-lg leading-body-lg text-slate-gray">
        Citero toma reservas 24/7, verifica a tus clientes y reduce las
        ausencias. Sin llamados, sin señas, sin planillas.
      </p>

      <ul className="mt-8 space-y-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-signal-blue shadow-sm">
                <Icon className="h-5 w-5" weight="regular" />
              </span>
              <div>
                <p className="text-body font-semibold text-ink-navy">
                  {item.title}
                </p>
                <p className="text-body-sm text-slate-gray">{item.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
