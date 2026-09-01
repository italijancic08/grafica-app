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

// Devuelve la fecha de HOY en formato "YYYY-MM-DD", en horario de
// Argentina — evita el corrimiento de un día que da toISOString(),
// que primero convierte a UTC antes de cortar la fecha.
export function fechaHoyArgentina(): string {
  const ahora = new Date()
  const fechaArgentina = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
  return fechaArgentina // en-CA da directamente el formato YYYY-MM-DD
}

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Devuelve el mes actual en formato "YYYY-MM", en horario de Argentina
export function mesActualArgentina(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())

  const anio = partes.find((p) => p.type === 'year')?.value
  const mes = partes.find((p) => p.type === 'month')?.value
  return `${anio}-${mes}`
}

// Convierte "YYYY-MM" a "Agosto 2026"
export function nombreMesAnio(mes: string): string {
  const [anio, mesNum] = mes.split('-').map(Number)
  return `${NOMBRES_MES[mesNum - 1]} ${anio}`
}

// Convierte una fecha/timestamp a solo el número de día del mes, en horario de Argentina
export function diaDelMes(fecha: string): number {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    day: '2-digit',
  }).formatToParts(new Date(fecha))
  return Number(partes.find((p) => p.type === 'day')?.value)
}