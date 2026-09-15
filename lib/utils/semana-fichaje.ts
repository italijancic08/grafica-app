const ZONA_HORARIA = 'America/Argentina/Buenos_Aires'

/*
 * El ciclo laboral comienza el lunes y normalmente termina
 * el viernes.
 *
 * Cuando existe trabajo el sábado por la mañana, el ciclo
 * puede continuar hasta las 12:00 del sábado.
 */
export const HORA_LIMITE_SABADO = 12

function partesArgentina(fecha: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(fecha)

  const get = (tipo: string) =>
    Number(parts.find((p) => p.type === tipo)?.value ?? 0)

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

function fechaArgentinaComoUTC(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  /*
   * Argentina utiliza UTC-3.
   * Se trabaja con UTC internamente para evitar problemas
   * de horario local del servidor.
   */
  return new Date(
    Date.UTC(year, month - 1, day, hour + 3, minute, second)
  )
}

function restarDias(
  year: number,
  month: number,
  day: number,
  cantidad: number
) {
  const fecha = new Date(Date.UTC(year, month - 1, day))

  fecha.setUTCDate(fecha.getUTCDate() - cantidad)

  return {
    year: fecha.getUTCFullYear(),
    month: fecha.getUTCMonth() + 1,
    day: fecha.getUTCDate(),
  }
}

function sumarDias(
  year: number,
  month: number,
  day: number,
  cantidad: number
) {
  const fecha = new Date(Date.UTC(year, month - 1, day))

  fecha.setUTCDate(fecha.getUTCDate() + cantidad)

  return {
    year: fecha.getUTCFullYear(),
    month: fecha.getUTCMonth() + 1,
    day: fecha.getUTCDate(),
  }
}

export function obtenerSemanaActual() {
  const ahora = new Date()
  const partes = partesArgentina(ahora)

  /*
   * 0 = domingo
   * 1 = lunes
   * ...
   * 6 = sábado
   */
  const fechaActual = new Date(
    Date.UTC(partes.year, partes.month - 1, partes.day)
  )

  const diaSemana = fechaActual.getUTCDay()

  const diasDesdeLunes =
    diaSemana === 0 ? 6 : diaSemana - 1

  const lunes = restarDias(
    partes.year,
    partes.month,
    partes.day,
    diasDesdeLunes
  )

  const sabado = sumarDias(
    lunes.year,
    lunes.month,
    lunes.day,
    5
  )

  return {
    inicio: `${lunes.year}-${String(lunes.month).padStart(2, '0')}-${String(lunes.day).padStart(2, '0')}`,

    fin: `${sabado.year}-${String(sabado.month).padStart(2, '0')}-${String(sabado.day).padStart(2, '0')}`,

    inicioDate: fechaArgentinaComoUTC(
      lunes.year,
      lunes.month,
      lunes.day,
      0,
      0,
      0
    ),

    finDate: fechaArgentinaComoUTC(
      sabado.year,
      sabado.month,
      sabado.day,
      HORA_LIMITE_SABADO,
      0,
      0
    ),
  }
}

export function obtenerSemanaAnterior() {
  const actual = obtenerSemanaActual()

  const fechaInicio = new Date(actual.inicioDate)
  fechaInicio.setUTCDate(fechaInicio.getUTCDate() - 7)

  const fechaFin = new Date(actual.finDate)
  fechaFin.setUTCDate(fechaFin.getUTCDate() - 7)

  const inicioPartes = {
    year: fechaInicio.getUTCFullYear(),
    month: fechaInicio.getUTCMonth() + 1,
    day: fechaInicio.getUTCDate(),
  }

  const finPartes = {
    year: fechaFin.getUTCFullYear(),
    month: fechaFin.getUTCMonth() + 1,
    day: fechaFin.getUTCDate(),
  }

  return {
    inicio: `${inicioPartes.year}-${String(inicioPartes.month).padStart(2, '0')}-${String(inicioPartes.day).padStart(2, '0')}`,

    fin: `${finPartes.year}-${String(finPartes.month).padStart(2, '0')}-${String(finPartes.day).padStart(2, '0')}`,

    inicioDate: fechaInicio,

    finDate: fechaFin,
  }
}

export function fechaEsSabadoPorLaManana(fecha: Date) {
  const partes = partesArgentina(fecha)

  // Cambiado de "fecha" a "fechaDia" para evitar
  // duplicar el parámetro de la función.
  const fechaDia = new Date(
    Date.UTC(partes.year, partes.month - 1, partes.day)
  )

  return (
    fechaDia.getUTCDay() === 6 &&
    partes.hour < HORA_LIMITE_SABADO
  )
}

export function formatearFechaHoraArgentina(
  fecha: string | Date | null
) {
  if (!fecha) return '-'

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(fecha))
}

export function formatearFechaArgentina(
  fecha: string | Date
) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA,
    dateStyle: 'short',
  }).format(new Date(fecha))
}

export function calcularHoras(
  entrada: string | Date,
  salida: string | Date
) {
  const inicio = new Date(entrada).getTime()
  const fin = new Date(salida).getTime()

  const horas = (fin - inicio) / (1000 * 60 * 60)

  return Math.max(
    0,
    Math.round(horas * 100) / 100
  )
}

export function redondearHoras(horas: number) {
  return Math.round(horas * 100) / 100
}