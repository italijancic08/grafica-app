'use server'

import { createClient } from '@/lib/supabase/server'
import {
  materialSchema,
  materialEdicionSchema,
  movimientoSchema,
  type MaterialInput,
  type MaterialEdicionInput,
  type MovimientoInput,
} from '@/lib/validations/material'
import { registrarAuditoria } from '@/lib/services/auditoria'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'
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
  const sinPermiso = await errorSiNoEsAdministrador(
    'Solo un administrador puede crear materiales (incluyen costos).'
  )
  if (sinPermiso) return sinPermiso

  const parsed = materialSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('materiales')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: error.message }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'crear',
    entidad: 'material',
    entidadId: data.id,
    detalle: { nombre: data.nombre },
  })

  revalidatePath('/stock')
  return { data }
}

export async function editarMaterial(id: string, input: MaterialEdicionInput) {
  const sinPermiso = await errorSiNoEsAdministrador(
    'Solo un administrador puede editar materiales (incluyen costos).'
  )
  if (sinPermiso) return sinPermiso

  const parsed = materialEdicionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('materiales')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'editar',
    entidad: 'material',
    entidadId: id,
    detalle: { nombre: data.nombre },
  })

  revalidatePath('/stock')
  return { data }
}

export async function eliminarMaterial(id: string) {
  const sinPermiso = await errorSiNoEsAdministrador(
    'Solo un administrador puede eliminar materiales.'
  )
  if (sinPermiso) return sinPermiso

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: material } = await supabase
    .from('materiales')
    .select('nombre')
    .eq('id', id)
    .single()

  // El historial de movimientos referencia al material, así que se elimina primero.
  const { error: errorMovimientos } = await supabase
    .from('movimientos_stock')
    .delete()
    .eq('material_id', id)

  if (errorMovimientos) return { error: errorMovimientos.message }

  const { error } = await supabase.from('materiales').delete().eq('id', id)
  if (error) return { error: error.message }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'eliminar',
    entidad: 'material',
    entidadId: id,
    detalle: { nombre: material?.nombre },
  })

  revalidatePath('/stock')
  return { ok: true }
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

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'registrar_movimiento',
    entidad: 'material',
    entidadId: parsed.data.material_id,
    detalle: { tipo: parsed.data.tipo, cantidad: parsed.data.cantidad },
  })

  revalidatePath('/stock')
  return { data }
}