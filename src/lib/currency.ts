/** Formatea un monto en pesos argentinos, sin decimales. */
export function formatCurrency(value: number | null | undefined): string {
  return `$${(value ?? 0).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })}`;
}
