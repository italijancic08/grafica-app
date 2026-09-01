'use server'

import { createClient } from '@/lib/supabase/server'
import { movimientoCajaSchema, type MovimientoCajaInput } from '@/lib/validations/caja'
import { revalidatePath } from 'next/cache'
import { mesActualArgentina } from '@/lib/utils/formato'

function rangoDelMes(mes: string) {
  const [anio, mesNum] = mes.split('-').map(Number)
  const inicio = `${mes}-01`
  const finExclusive =
    mesNum === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mesNum + 1).padStart(2, '0')}-01`
  return { inicio, finExclusive }
}

export async function listarMovimientosDelMes(mes?: string) {
  const supabase = await createClient()
  const mesFiltro = mes ?? mesActualArgentina()
  const { inicio, finExclusive } = rangoDelMes(mesFiltro)

  const { data, error } = await supabase
    .from('caja_movimientos')
    .select('*, trabajos(numero)')
    .gte('fecha', `${inicio}T00:00:00`)
    .lt('fecha', `${finExclusive}T00:00:00`)
    .order('fecha', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

export async function registrarMovimientoManual(input: MovimientoCajaInput) {
  const parsed = movimientoCajaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('caja_movimientos')
    .insert({ ...parsed.data, usuario_id: user?.id })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'registrar_movimiento_caja',
    entidad: 'caja',
    entidad_id: data.id,
    detalle: { tipo: parsed.data.tipo, monto: parsed.data.monto, concepto: parsed.data.concepto, rubro: parsed.data.rubro },
  })

  revalidatePath('/caja')
  return { data }
}

export async function actualizarMovimientoCaja(id: string, input: MovimientoCajaInput) {
  const parsed = movimientoCajaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('caja_movimientos')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'editar_movimiento_caja',
    entidad: 'caja',
    entidad_id: id,
    detalle: { tipo: parsed.data.tipo, monto: parsed.data.monto, concepto: parsed.data.concepto, rubro: parsed.data.rubro },
  })

  revalidatePath('/caja')
  return { success: true }
}