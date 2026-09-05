'use server'

import { createClient } from '@/lib/supabase/server'
import type { Alerta } from '@/lib/types/alerta'
import { formatearFecha } from '@/lib/utils/formato'

export async function obtenerAlertas() {
  const supabase = await createClient()

  const [stockBajo, trabajosDemorados, trabajosNoRetirados, tercerizacionesDemoradas] = await Promise.all([
    supabase.from('materiales_stock_bajo').select('id, nombre, cantidad_actual, unidad_medida, stock_minimo'),
    supabase.from('trabajos_demorados').select('id, numero, fecha_maxima'),
    supabase.from('trabajos_no_retirados').select('id, numero, fecha_maxima'),
    supabase.from('tercerizaciones_demoradas').select('id, trabajo_id, proveedor, fecha_estimada_vuelta, trabajos(numero)'),
  ])

  if (stockBajo.error) return { error: stockBajo.error.message }
  if (trabajosDemorados.error) return { error: trabajosDemorados.error.message }
  if (trabajosNoRetirados.error) return { error: trabajosNoRetirados.error.message }
  if (tercerizacionesDemoradas.error) return { error: tercerizacionesDemoradas.error.message }

  const alertas: Alerta[] = []

  for (const m of stockBajo.data ?? []) {
    alertas.push({
      tipo: 'STOCK_BAJO',
      mensaje: `${m.nombre}: quedan ${m.cantidad_actual} ${m.unidad_medida} (mínimo ${m.stock_minimo})`,
      fecha: null,
      urlDetalle: '/stock',
    })
  }

  for (const t of trabajosDemorados.data ?? []) {
    alertas.push({
      tipo: 'TRABAJO_DEMORADO',
      mensaje: `El trabajo ${t.numero} venció el ${formatearFecha(t.fecha_maxima)} y todavía sigue en producción`,
      fecha: t.fecha_maxima,
      urlDetalle: `/trabajos/${t.id}`,
    })
  }

  for (const t of trabajosNoRetirados.data ?? []) {
    alertas.push({
      tipo: 'TRABAJO_NO_RETIRADO',
      mensaje: `El trabajo ${t.numero} está listo desde el ${formatearFecha(t.fecha_maxima)} y el cliente todavía no lo retiró`,
      fecha: t.fecha_maxima,
      urlDetalle: `/trabajos/${t.id}`,
    })
  }

  for (const tz of tercerizacionesDemoradas.data ?? []) {
    const trabajoRel = Array.isArray(tz.trabajos) ? tz.trabajos[0] : tz.trabajos
    alertas.push({
      tipo: 'TERCERIZACION_DEMORADA',
      mensaje: `${tz.proveedor} debía devolver el trabajo ${trabajoRel?.numero ?? ''} el ${formatearFecha(tz.fecha_estimada_vuelta)}`,
      fecha: tz.fecha_estimada_vuelta,
      urlDetalle: `/trabajos/${tz.trabajo_id}`,
    })
  }

  // Las que tienen fecha de vencimiento van primero (más vencidas arriba);
  // el stock bajo (sin fecha) queda al final.
  alertas.sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0
    if (!a.fecha) return 1
    if (!b.fecha) return -1
    return a.fecha.localeCompare(b.fecha)
  })

  return { data: alertas }
}