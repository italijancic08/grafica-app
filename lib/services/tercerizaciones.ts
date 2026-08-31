'use server'

import { createClient } from '@/lib/supabase/server'
import { tercerizacionSchema, type TercerizacionInput } from '@/lib/validations/tercerizacion'
import { revalidatePath } from 'next/cache'
import { fechaHoyArgentina } from '@/lib/utils/formato'

export async function listarTercerizaciones() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tercerizaciones')
    .select('*, trabajos(numero, descripcion, cliente_id, clientes(nombre_razon_social))')
    .order('fecha_envio', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function listarTercerizacionesDeTrabajo(trabajoId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tercerizaciones')
    .select('*')
    .eq('trabajo_id', trabajoId)
    .order('fecha_envio', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function crearTercerizacion(input: TercerizacionInput) {
  const parsed = tercerizacionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('tercerizaciones')
    .insert({
      ...parsed.data,
      fecha_estimada_vuelta: parsed.data.fecha_estimada_vuelta || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Al enviar a tercerizar, el trabajo pasa automáticamente a estado TERCERIZADO
  await supabase
    .from('trabajos')
    .update({ estado_operativo: 'TERCERIZADO', modificado_en: new Date().toISOString() })
    .eq('id', parsed.data.trabajo_id)

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'crear',
    entidad: 'tercerizacion',
    entidad_id: data.id,
    detalle: { trabajo_id: parsed.data.trabajo_id, proveedor: parsed.data.proveedor },
  })

  revalidatePath('/tercerizados')
  revalidatePath(`/trabajos/${parsed.data.trabajo_id}`)
  return { data }
}

export async function marcarVuelta(tercerizacionId: string, trabajoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tercerizaciones')
    .update({
      estado: 'VUELTO',
      fecha_real_vuelta: fechaHoyArgentina(),
    })
    .eq('id', tercerizacionId)

  if (error) return { error: error.message }

  await supabase
    .from('trabajos')
    .update({ estado_operativo: 'EN_PRODUCCION', modificado_en: new Date().toISOString() })
    .eq('id', trabajoId)

  revalidatePath('/tercerizados')
  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}