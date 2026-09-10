'use server'

import { createClient } from '@/lib/supabase/server'

export interface FiltrosReporte {
  desde: string // YYYY-MM-DD
  hasta: string // YYYY-MM-DD
}

// Facturado = suma de precio_final de trabajos ingresados en el período
// (independientemente de si ya se cobraron o no). Cobrado = suma de los
// pagos efectivamente registrados en el período (pueden corresponder a
// trabajos ingresados antes). Son dos números distintos a propósito.
export async function obtenerResumenPeriodo({ desde, hasta }: FiltrosReporte) {
  const supabase = await createClient()

  const [trabajosRes, pagosRes] = await Promise.all([
    supabase
      .from('trabajos')
      .select('precio_final')
      .gte('fecha_entrada', desde)
      .lte('fecha_entrada', hasta)
      .neq('estado_operativo', 'CANCELADO'),
    supabase.from('pagos').select('importe').gte('fecha', desde).lte('fecha', hasta),
  ])

  if (trabajosRes.error) return { error: trabajosRes.error.message }
  if (pagosRes.error) return { error: pagosRes.error.message }

  return {
    data: {
      totalFacturado: trabajosRes.data?.reduce((acc, t) => acc + t.precio_final, 0) ?? 0,
      totalCobrado: pagosRes.data?.reduce((acc, p) => acc + p.importe, 0) ?? 0,
      cantidadTrabajos: trabajosRes.data?.length ?? 0,
    },
  }
}

export async function obtenerVentasPorRubro({ desde, hasta }: FiltrosReporte) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajos')
    .select('rubro, precio_final')
    .gte('fecha_entrada', desde)
    .lte('fecha_entrada', hasta)
    .neq('estado_operativo', 'CANCELADO')

  if (error) return { error: error.message }

  const porRubro = new Map<string, { cantidad: number; total: number }>()
  for (const t of data ?? []) {
    const actual = porRubro.get(t.rubro) ?? { cantidad: 0, total: 0 }
    actual.cantidad += 1
    actual.total += t.precio_final
    porRubro.set(t.rubro, actual)
  }

  const filas = Array.from(porRubro.entries())
    .map(([rubro, valores]) => ({ rubro, ...valores }))
    .sort((a, b) => b.total - a.total)

  return { data: filas }
}

export async function obtenerRankingClientes({ desde, hasta }: FiltrosReporte, limite = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajos')
    .select('cliente_id, precio_final, clientes(nombre_razon_social)')
    .gte('fecha_entrada', desde)
    .lte('fecha_entrada', hasta)
    .neq('estado_operativo', 'CANCELADO')

  if (error) return { error: error.message }

  const porCliente = new Map<string, { nombre: string; cantidad: number; total: number }>()
  for (const t of data ?? []) {
    const cliente = Array.isArray(t.clientes) ? t.clientes[0] : t.clientes
    const actual = porCliente.get(t.cliente_id) ?? { nombre: cliente?.nombre_razon_social ?? '—', cantidad: 0, total: 0 }
    actual.cantidad += 1
    actual.total += t.precio_final
    porCliente.set(t.cliente_id, actual)
  }

  const filas = Array.from(porCliente.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limite)

  return { data: filas }
}

// Productividad: de los trabajos retirados en el período (con fecha
// máxima cargada), cuántos se entregaron a tiempo vs demorados, y el
// promedio de días de demora de los demorados. La fecha de referencia
// es fecha_finalizacion si existe (cuando terminó producción), si no
// fecha_retiro.
export async function obtenerProductividad({ desde, hasta }: FiltrosReporte) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajos')
    .select('fecha_maxima, fecha_retiro, fecha_finalizacion')
    .eq('estado_operativo', 'RETIRADO')
    .gte('fecha_retiro', desde)
    .lte('fecha_retiro', hasta)
    .not('fecha_maxima', 'is', null)

  if (error) return { error: error.message }

  let aTiempo = 0
  let demorados = 0
  let sumaDiasDemora = 0

  for (const t of data ?? []) {
    const referencia = t.fecha_finalizacion ?? t.fecha_retiro
    if (!referencia || !t.fecha_maxima) continue

    const dias = Math.round(
      (new Date(referencia).getTime() - new Date(t.fecha_maxima).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (dias > 0) {
      demorados += 1
      sumaDiasDemora += dias
    } else {
      aTiempo += 1
    }
  }

  const total = aTiempo + demorados
  return {
    data: {
      total,
      aTiempo,
      demorados,
      porcentajeATiempo: total > 0 ? Math.round((aTiempo / total) * 100) : 0,
      promedioDiasDemora: demorados > 0 ? Math.round(sumaDiasDemora / demorados) : 0,
    },
  }
}