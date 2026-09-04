'use server'

import { createClient } from '@/lib/supabase/server'
import { pagoSchema, pagoEditSchema, type PagoInput, type PagoEditInput } from '@/lib/validations/pago'
import { revalidatePath } from 'next/cache'

export async function listarPagosDeTrabajo(trabajoId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('trabajo_id', trabajoId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function registrarPago(input: PagoInput) {
  const parsed = pagoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar que el pago no exceda el saldo pendiente (evita pagos de más por error)
  const { data: trabajo } = await supabase
    .from('trabajos_con_saldo')
    .select('saldo, numero')
    .eq('id', parsed.data.trabajo_id)
    .single()

  if (trabajo && parsed.data.importe > trabajo.saldo) {
    return {
      error: `El importe ($${parsed.data.importe}) supera el saldo pendiente ($${trabajo.saldo}) del trabajo ${trabajo.numero}.`,
    }
  }

  const { data, error } = await supabase
    .from('pagos')
    .insert({ ...parsed.data, usuario_id: user?.id })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'registrar_pago',
    entidad: 'pago',
    entidad_id: data.id,
    detalle: { trabajo_id: parsed.data.trabajo_id, importe: parsed.data.importe },
  })

  revalidatePath(`/trabajos/${parsed.data.trabajo_id}`)
  return { data }
}

export async function actualizarPago(pagoId: string, input: PagoEditInput) {
  const parsed = pagoEditSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pagoActual, error: errorPago } = await supabase
    .from('pagos')
    .select('*, trabajos(numero)')
    .eq('id', pagoId)
    .single()

  if (errorPago || !pagoActual) {
    return { error: 'No se encontró el pago' }
  }

  // Bloquear la edición si el mes de caja correspondiente a la fecha
  // del pago ya fue cerrado (mismo criterio que ya usa el módulo de Caja)
  const [anio, mes] = pagoActual.fecha.split('-').map(Number)
  const { data: cierre } = await supabase
    .from('caja_mensual')
    .select('cerrado')
    .eq('mes', mes)
    .eq('anio', anio)
    .maybeSingle()

  if (cierre?.cerrado) {
    return { error: 'No se puede editar: el mes de caja de este pago ya está cerrado.' }
  }

  // El saldo del trabajo (vista trabajos_con_saldo) ya descuenta el importe
  // ACTUAL de este pago, así que el máximo permitido para el nuevo importe
  // es ese saldo más lo que este pago ya aportaba.
  const { data: trabajo } = await supabase
    .from('trabajos_con_saldo')
    .select('saldo, numero')
    .eq('id', pagoActual.trabajo_id)
    .single()

  const maximoPermitido = (trabajo?.saldo ?? 0) + pagoActual.importe
  if (parsed.data.importe > maximoPermitido) {
    return {
      error: `El importe ($${parsed.data.importe}) supera el máximo permitido ($${maximoPermitido}) para no exceder el precio del trabajo ${trabajo?.numero ?? pagoActual.trabajos?.numero}.`,
    }
  }

  const { error } = await supabase
    .from('pagos')
    .update(parsed.data)
    .eq('id', pagoId)

  if (error) return { error: error.message }

  // Mantener sincronizado el movimiento de caja que este pago generó
  // automáticamente (vinculado por pago_id, migración 0011)
  const { error: errorCaja } = await supabase
    .from('caja_movimientos')
    .update({
      monto: parsed.data.importe,
      medio_pago: parsed.data.medio_pago,
    })
    .eq('pago_id', pagoId)

  if (errorCaja) {
    return { error: `El pago se actualizó pero falló la sincronización con caja: ${errorCaja.message}` }
  }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'editar_pago',
    entidad: 'pago',
    entidad_id: pagoId,
    detalle: {
      antes: { importe: pagoActual.importe, medio_pago: pagoActual.medio_pago, detalle_medio_pago: pagoActual.detalle_medio_pago },
      despues: parsed.data,
    },
  })

  revalidatePath(`/trabajos/${pagoActual.trabajo_id}`)
  revalidatePath('/caja')
  return { success: true }
}