/**
 * Utilidades de formato para El Caiquen.
 */

/** Formatea moneda en pesos argentinos */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Formatea fecha en español */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/** Formatea fecha y hora en español */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/** Formatea cantidad con su unidad */
export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString('es-AR')} ${unit}`
}

/** Estado de stock: retorna 'ok' | 'warning' | 'critical' */
export function getStockStatus(
  quantity: number,
  reorderPoint: number
): 'ok' | 'warning' | 'critical' {
  if (quantity <= reorderPoint) return 'critical'
  if (quantity <= reorderPoint * 1.3) return 'warning'
  return 'ok'
}
