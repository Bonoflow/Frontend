/**
 * Formatea un valor monetario según la moneda especificada
 */
export function formatCurrency(amount: number, currency = "PEN"): string {
  const formatter = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  })

  return formatter.format(amount)
}

/**
 * Formatea un porcentaje
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Formatea una fecha
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}
