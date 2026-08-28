'use server'

import { createClient } from '@/lib/supabase/server'
import { clienteSchema, type ClienteInput } from '@/lib/validations/cliente'
import { revalidatePath } from 'next/cache'

export async function listarClientes(busqueda?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('clientes')
    .select('*')
    .order('nombre_razon_social', { ascending: true })

  if (busqueda) {
    query = query.or(
      `nombre_razon_social.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,cuit_cuil.ilike.%${busqueda}%`
    )
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export async function obtenerCliente(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function crearCliente(input: ClienteInput) {
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  return { data }
}

export async function actualizarCliente(id: string, input: ClienteInput) {
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('clientes')
    .update({ ...parsed.data, modificado_en: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

// Trabajos de un cliente (lo vamos a usar en la ficha de detalle)
export async function obtenerTrabajosDeCliente(clienteId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajos_con_saldo')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}