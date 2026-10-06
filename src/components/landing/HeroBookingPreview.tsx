import { CaretLeftIcon, CaretRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";

const STEPS: { label: string; value?: string }[] = [
  { label: "Servicio", value: "Consulta" },
  { label: "Profesional", value: "Cualquier profesional" },
  { label: "Fecha y hora" },
];

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const MORNING = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

export function HeroBookingPreview() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthDays: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const selectedDay = now.getDate();
  const monthLabel = now.toLocaleString("es-AR", {
    month: "long",
    year: "numeric",
  });
  const selectedDateLabel = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <figure className="relative">
      <div
        aria-hidden
        className="absolute -right-8 -top-10 h-64 w-64 rounded-full bg-sky-cyan/25 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-coral-magenta/20 blur-3xl"
      />

      <div
        aria-hidden
        className="relative rounded-2xl border border-hairline bg-paper p-5 shadow-sm-2 sm:p-6"
      >
        {/* Encabezado del wizard */}
        <div className="border-b border-hairline pb-4">
          <p className="text-body-sm font-semibold text-ink-navy">
            Reservá tu turno
          </p>
          <p className="mt-0.5 text-caption text-slate-gray">
            Elegí servicio, profesional y horario.
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mt-4 flex items-start">
          {STEPS.map((step, index) => {
            const isCompleted = index < 2;
            const isActive = index === 2;
            return (
              <div
                key={step.label}
                className="relative flex w-full flex-col items-center gap-1.5"
              >
                {index < STEPS.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-3 z-0 h-0.5 w-full ${
                      isCompleted ? "bg-signal-blue" : "bg-hairline"
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-caption font-semibold ${
                    isCompleted
                      ? "bg-signal-blue text-paper"
                      : isActive
                        ? "border-2 border-signal-blue bg-paper text-signal-blue"
                        : "border border-hairline bg-paper text-mist-gray"
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-3.5 w-3.5" weight="bold" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`w-full truncate px-0.5 text-center text-caption ${
                    isActive
                      ? "font-semibold text-signal-blue"
                      : isCompleted
                        ? "text-ink-navy"
                        : "text-slate-gray"
                  }`}
                >
                  {isCompleted ? step.value : step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Calendario */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-gray">
              <CaretLeftIcon className="h-4 w-4" weight="bold" />
            </span>
            <p className="text-body-sm font-semibold capitalize text-ink-navy">
              {monthLabel}
            </p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-gray">
              <CaretRightIcon className="h-4 w-4" weight="bold" />
            </span>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-caption font-medium text-slate-gray">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => (
              <span
                key={index}
                className={`flex aspect-square items-center justify-center rounded-lg text-body-sm ${
                  day === selectedDay
                    ? "bg-signal-blue font-semibold text-paper"
                    : "text-ink-navy"
                }`}
              >
                {day ?? ""}
              </span>
            ))}
          </div>
        </div>

        {/* Horarios disponibles */}
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="text-body-sm font-semibold capitalize text-ink-navy">
            {selectedDateLabel}
          </p>
          <p className="mt-3 text-caption font-semibold uppercase tracking-wider text-slate-gray">
            Mañana
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {MORNING.map((time) => (
              <span
                key={time}
                className={`flex h-9 items-center justify-center rounded-lg border text-body-sm font-medium ${
                  time === "10:00"
                  ? "border-signal-blue bg-signal-blue text-paper"
                  : "border-hairline bg-paper text-ink-navy"
                }`}
              >
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        Vista previa del flujo de reserva: elección de servicio, profesional,
        fecha y horario.
      </figcaption>
    </figure>
  );
}
