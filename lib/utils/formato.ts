export function formatearMoneda(valor: number): string {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

export function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—'

  // Las columnas "date" de Postgres llegan como "YYYY-MM-DD" (sin hora).
  // Si las pasamos directo a `new Date(fecha)`, JavaScript las interpreta
  // como medianoche en UTC, y al mostrarlas en horario de Argentina
  // (UTC-3) retroceden un día. Por eso armamos la fecha con año/mes/día
  // locales, sin pasar por UTC en ningún momento.
  const [anio, mes, dia] = fecha.split('T')[0].split('-').map(Number)
  const d = new Date(anio, mes - 1, dia)
  return d.toLocaleDateString('es-AR')
}