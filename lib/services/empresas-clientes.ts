'use server'

import { createClient } from '@/lib/supabase/server'
import {
  empresaClienteSchema,
  type EmpresaClienteInput,
} from '@/lib/validations/empresa-cliente'
import { registrarAuditoria } from '@/lib/services/auditoria'
import { revalidatePath } from 'next/cache'

// Los campos vacíos se guardan como null (no como texto vacío)
function limpiarVacios(datos: EmpresaClienteInput) {
  return Object.fromEntries(
    Object.entries(datos).map(([clave, valor]) => [
      clave,
      typeof valor === 'string' && valor.trim() === '' ? null : valor,
    ])
  )
}

export async function listarEmpresasClientes(busqueda?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('empresas_clientes')
    .select('*, clientes(count)')
    .order('nombre', { ascending: true })

  if (busqueda) {
    query = query.or(
      `nombre.ilike.%${busqueda}%,cuit.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`
    )
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export async function obtenerEmpresaCliente(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('empresas_clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function crearEmpresaCliente(input: EmpresaClienteInput) {
  const parsed = empresaClienteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('empresas_clientes')
    .insert(limpiarVacios(parsed.data))
    .select()
    .single()

  if (error) return { error: error.message }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'crear',
    entidad: 'empresa_cliente',
    entidadId: data.id,
    detalle: { nombre: data.nombre },
  })

  revalidatePath('/clientes/empresas')
  return { data }
}

export async function actualizarEmpresaCliente(id: string, input: EmpresaClienteInput) {
  const parsed = empresaClienteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: anterior } = await supabase
    .from('empresas_clientes')
    .select('nombre, telefono, cuit')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('empresas_clientes')
    .update({ ...limpiarVacios(parsed.data), modificado_en: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'editar',
    entidad: 'empresa_cliente',
    entidadId: id,
    detalle: { antes: anterior, despues: parsed.data },
  })

  revalidatePath('/clientes/empresas')
  revalidatePath(`/clientes/empresas/${id}`)
  return { success: true }
}

// Clientes (dueños, contactos) que pertenecen a una empresa
export async function listarClientesDeEmpresa(empresaId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_cliente_id', empresaId)
    .order('nombre_razon_social', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

// Trabajos que ingresaron por parte de la empresa
export async function obtenerTrabajosDeEmpresa(empresaId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social)')
    .eq('empresa_cliente_id', empresaId)
    .order('creado_en', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
