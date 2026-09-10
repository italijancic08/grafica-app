'use server'

import { createClient } from '@/lib/supabase/server'

// Registro secundario: si falla, se loguea pero nunca interrumpe
// el flujo principal de la operación que la llamó.
export async function registrarAuditoria(params: {
  usuarioId: string | undefined
  accion: string
  entidad: string
  entidadId?: string
  detalle?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('auditoria').insert({
    usuario_id: params.usuarioId,
    accion: params.accion,
    entidad: params.entidad,
    entidad_id: params.entidadId,
    detalle: params.detalle,
  })

  if (error) console.error('Error registrando auditoría:', error.message)
}

export interface FiltrosAuditoria {
  usuarioId?: string
  accion?: string
  entidad?: string
  desde?: string
  hasta?: string
}

export async function listarAuditoria(filtros: FiltrosAuditoria = {}) {
  const supabase = await createClient()

  let query = supabase
    .from('auditoria')
    .select('*, usuarios(nombre)')
    .order('fecha', { ascending: false })
    .limit(200)

  if (filtros.usuarioId) query = query.eq('usuario_id', filtros.usuarioId)
  if (filtros.accion) query = query.eq('accion', filtros.accion)
  if (filtros.entidad) query = query.eq('entidad', filtros.entidad)
  if (filtros.desde) query = query.gte('fecha', `${filtros.desde}T00:00:00`)
  if (filtros.hasta) query = query.lte('fecha', `${filtros.hasta}T23:59:59`)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

// Usa el cliente admin implícito de la sesión actual: si quien llama
// no es administrador, RLS filtra el resultado (ver es_administrador()
// en la migración 0002). Se usa para el chequeo de acceso a /auditoria.
export async function obtenerRolActual() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  return data?.rol ?? null
}