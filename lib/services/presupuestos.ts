'use server'

import { createClient } from '@/lib/supabase/server'
import { presupuestoSchema, type PresupuestoInput } from '@/lib/validations/presupuesto'
import { revalidatePath } from 'next/cache'
import type { EstadoPresupuesto } from '@/lib/types/presupuesto'
import type { RubroTrabajo } from '@/lib/types/trabajo'

export async function listarPresupuestos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*, clientes(nombre_razon_social, telefono)')
    .order('fecha', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function crearPresupuesto(input: PresupuestoInput) {
  const parsed = presupuestoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('presupuestos')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/presupuestos')
  return { data }
}

export async function cambiarEstadoPresupuesto(id: string, estado: EstadoPresupuesto) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('presupuestos')
    .update({ estado })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/presupuestos')
  return { success: true }
}

export async function convertirEnTrabajo(presupuestoId: string, rubro: RubroTrabajo) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: presupuesto, error: errorPresupuesto } = await supabase
    .from('presupuestos')
    .select('*')
    .eq('id', presupuestoId)
    .single()

  if (errorPresupuesto || !presupuesto) {
    return { error: 'No se encontró el presupuesto' }
  }

  if (presupuesto.trabajo_id) {
    return { error: 'Este presupuesto ya fue convertido en un trabajo' }
  }

  if (presupuesto.estado !== 'APROBADO') {
    return { error: 'Solo se pueden convertir presupuestos aprobados' }
  }

  const { data: trabajo, error: errorTrabajo } = await supabase
    .from('trabajos')
    .insert({
      cliente_id: presupuesto.cliente_id,
      descripcion: presupuesto.descripcion,
      rubro,
      precio_final: presupuesto.monto,
      sena: 0,
      usuario_carga_id: user?.id,
    })
    .select()
    .single()

  if (errorTrabajo) return { error: errorTrabajo.message }

  const { error: errorUpdate } = await supabase
    .from('presupuestos')
    .update({ trabajo_id: trabajo.id })
    .eq('id', presupuestoId)

  if (errorUpdate) return { error: errorUpdate.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'convertir_presupuesto',
    entidad: 'trabajo',
    entidad_id: trabajo.id,
    detalle: { presupuesto_id: presupuestoId, numero: trabajo.numero },
  })

  revalidatePath('/presupuestos')
  revalidatePath('/trabajos')
  return { data: trabajo }
}