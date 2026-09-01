'use server'

import { createClient } from '@/lib/supabase/server'
import { trabajoSchema, type TrabajoInput } from '@/lib/validations/trabajo'
import { revalidatePath } from 'next/cache'
import type { EstadoOperativo } from '@/lib/types/trabajo'
import { fechaHoyArgentina } from '@/lib/utils/formato'

export async function listarTrabajos(estados?: EstadoOperativo[]) {
  const supabase = await createClient()

  let query = supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono)')
    .order('creado_en', { ascending: false })

  if (estados && estados.length > 0) {
    query = query.in('estado_operativo', estados)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export async function obtenerTrabajo(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono)')
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function crearTrabajo(input: TrabajoInput) {
  const parsed = trabajoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
    .from('trabajos')
    .insert({
      cliente_id: parsed.data.cliente_id,
      descripcion: parsed.data.descripcion,
      rubro: parsed.data.rubro,
      precio_final: parsed.data.precio_final,
      sena: parsed.data.sena,
      fecha_maxima: parsed.data.fecha_maxima || null,
      usuario_carga_id: user?.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Si se cargó una seña, generar el pago correspondiente
  // (el saldo y el estado financiero se calculan siempre a partir
  // de la tabla "pagos", nunca del campo "sena" directamente)
  if (parsed.data.sena > 0) {
    const { error: errorPago } = await supabase.from('pagos').insert({
      trabajo_id: data.id,
      cliente_id: parsed.data.cliente_id,
      importe: parsed.data.sena,
      medio_pago: parsed.data.medio_pago_sena,
      detalle_medio_pago: parsed.data.detalle_medio_pago_sena || null,
      usuario_id: user?.id,
      observacion: 'Seña inicial',
    })
    if (errorPago) return { error: errorPago.message }
  }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'crear',
    entidad: 'trabajo',
    entidad_id: data.id,
    detalle: { numero: data.numero, precio_final: data.precio_final },
  })

  revalidatePath('/trabajos')
  return { data }
}

export async function cambiarEstadoTrabajo(
  trabajoId: string,
  nuevoEstado: EstadoOperativo,
  confirmarRetiroConDeuda: boolean = false
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trabajoActual, error: errorActual } = await supabase
    .from('trabajos')
    .select('estado_operativo')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !trabajoActual) {
    return { error: 'No se encontró el trabajo' }
  }

  // Si se intenta retirar, verificar el saldo antes de aplicar el cambio
  if (nuevoEstado === 'RETIRADO') {
    const { data: conSaldo } = await supabase
      .from('trabajos_con_saldo')
      .select('saldo')
      .eq('id', trabajoId)
      .single()

    const saldo = conSaldo?.saldo ?? 0

    if (saldo > 0 && !confirmarRetiroConDeuda) {
      return { requiereConfirmacion: true, saldo }
    }
  }

  const camposExtra: Record<string, string> = {}
  if (nuevoEstado === 'TERMINADO') {
    camposExtra.fecha_finalizacion = fechaHoyArgentina()
  }
  if (nuevoEstado === 'RETIRADO') {
    camposExtra.fecha_retiro = fechaHoyArgentina()
  }

  const { error } = await supabase
    .from('trabajos')
    .update({
      estado_operativo: nuevoEstado,
      modificado_en: new Date().toISOString(),
      ...camposExtra,
    })
    .eq('id', trabajoId)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'cambiar_estado',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: {
      de: trabajoActual.estado_operativo,
      a: nuevoEstado,
      ...(nuevoEstado === 'RETIRADO' && confirmarRetiroConDeuda ? { retirado_con_deuda: true } : {}),
    },
  })

  revalidatePath('/trabajos')
  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}

export async function listarParaRetirar() {
  return listarTrabajos(['TERMINADO', 'PARA_RETIRAR'])
}

export async function listarConDeuda() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono, whatsapp)')
    .gt('saldo', 0)
    .neq('estado_operativo', 'CANCELADO')
    .order('saldo', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}