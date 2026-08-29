'use server'

import { createClient } from '@/lib/supabase/server'
import { trabajoSchema, type TrabajoInput } from '@/lib/validations/trabajo'
import { revalidatePath } from 'next/cache'
import type { EstadoOperativo } from '@/lib/types/trabajo'

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
      ...parsed.data,
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
      medio_pago: 'efectivo',
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