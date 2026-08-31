'use server'

import { createClient } from '@/lib/supabase/server'
import { materialSchema, movimientoSchema, type MaterialInput, type MovimientoInput } from '@/lib/validations/material'
import { revalidatePath } from 'next/cache'

export async function listarMateriales() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materiales')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

export async function crearMaterial(input: MaterialInput) {
  const parsed = materialSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materiales')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/stock')
  return { data }
}

export async function listarMovimientosDeMaterial(materialId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movimientos_stock')
    .select('*')
    .eq('material_id', materialId)
    .order('fecha', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }
  return { data }
}

export async function registrarMovimiento(input: MovimientoInput) {
  const parsed = movimientoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('movimientos_stock')
    .insert({ ...parsed.data, usuario_id: user?.id })
    .select()
    .single()

  // El trigger de la base de datos (registrar_movimiento_stock) ya se encarga
  // de actualizar cantidad_actual y de rechazar egresos que dejarían el stock
  // negativo, lanzando la excepción "Stock insuficiente para este movimiento".
  if (error) {
    if (error.message.includes('Stock insuficiente')) {
      return { error: 'No hay stock suficiente para este egreso.' }
    }
    return { error: error.message }
  }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'registrar_movimiento',
    entidad: 'material',
    entidad_id: parsed.data.material_id,
    detalle: { tipo: parsed.data.tipo, cantidad: parsed.data.cantidad },
  })

  revalidatePath('/stock')
  return { data }
}