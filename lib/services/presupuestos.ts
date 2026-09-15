'use server'

import { createClient } from '@/lib/supabase/server'
import {
  presupuestoSchema,
  type PresupuestoInput,
} from '@/lib/validations/presupuesto'
import { registrarAuditoria } from '@/lib/services/auditoria'
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('presupuestos')
    .insert({
      ...parsed.data,
      monto: parsed.data.monto ?? null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'crear',
    entidad: 'presupuesto',
    entidadId: data.id,
    detalle: {
      monto: data.monto,
    },
  })

  revalidatePath('/presupuestos')

  return { data }
}

export async function cambiarEstadoPresupuesto(
  id: string,
  estado: EstadoPresupuesto
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ---------------------------------------------------------
  // Si se intenta aprobar, el precio es obligatorio.
  // ---------------------------------------------------------

  if (estado === 'APROBADO') {
    const { data: presupuesto, error: errorPresupuesto } = await supabase
      .from('presupuestos')
      .select('monto')
      .eq('id', id)
      .single()

    if (errorPresupuesto || !presupuesto) {
      return {
        error: 'No se encontró el presupuesto.',
      }
    }

    if (
      presupuesto.monto === null ||
      presupuesto.monto === undefined ||
      Number.isNaN(Number(presupuesto.monto)) ||
      Number(presupuesto.monto) <= 0
    ) {
      return {
        error: 'No se puede aprobar el presupuesto sin cargar un precio mayor a $0.',
      }
    }
  }

  const { error } = await supabase
    .from('presupuestos')
    .update({ estado })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'cambiar_estado',
    entidad: 'presupuesto',
    entidadId: id,
    detalle: {
      a: estado,
    },
  })

  revalidatePath('/presupuestos')

  return { success: true }
}

export async function convertirEnTrabajo(
  presupuestoId: string,
  rubro: RubroTrabajo
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: presupuesto, error: errorPresupuesto } = await supabase
    .from('presupuestos')
    .select('*')
    .eq('id', presupuestoId)
    .single()

  if (errorPresupuesto || !presupuesto) {
    return { error: 'No se encontró el presupuesto' }
  }

  if (presupuesto.trabajo_id) {
    return {
      error: 'Este presupuesto ya fue convertido en un trabajo',
    }
  }

  if (presupuesto.estado !== 'APROBADO') {
    return {
      error: 'Solo se pueden convertir presupuestos aprobados',
    }
  }

  // ---------------------------------------------------------
  // Seguridad adicional:
  // un presupuesto aprobado siempre debe tener precio.
  // ---------------------------------------------------------

  if (
    presupuesto.monto === null ||
    presupuesto.monto === undefined ||
    Number.isNaN(Number(presupuesto.monto)) ||
    Number(presupuesto.monto) <= 0
  ) {
    return {
      error: 'El presupuesto aprobado no tiene un precio válido.',
    }
  }

  const { data: trabajo, error: errorTrabajo } = await supabase
    .from('trabajos')
    .insert({
      cliente_id: presupuesto.cliente_id,
      descripcion: presupuesto.descripcion,
      rubro,
      precio_final: presupuesto.monto,
      sena: 0,
      ancho_cm: presupuesto.ancho_cm,
      largo_cm: presupuesto.largo_cm,
      usuario_carga_id: user?.id,
    })
    .select()
    .single()

  if (errorTrabajo) {
    return { error: errorTrabajo.message }
  }

  const { error: errorUpdate } = await supabase
    .from('presupuestos')
    .update({
      trabajo_id: trabajo.id,
    })
    .eq('id', presupuestoId)

  if (errorUpdate) {
    return { error: errorUpdate.message }
  }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'convertir_presupuesto',
    entidad: 'trabajo',
    entidadId: trabajo.id,
    detalle: {
      presupuesto_id: presupuestoId,
      numero: trabajo.numero,
    },
  })

  revalidatePath('/presupuestos')
  revalidatePath('/trabajos')

  return { data: trabajo }
}