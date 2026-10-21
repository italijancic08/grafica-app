
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'
import { registrarAuditoria } from '@/lib/services/auditoria'

export async function actualizarPermisoGratuito(
  tipo: 'cliente' | 'empresa',
  id: string,
  permitido: boolean
) {
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return sinPermiso

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    || typeof permitido !== 'boolean'
  ) {
    return { error: 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Sesión no válida.' }

  const tabla = tipo === 'cliente'
    ? 'clientes'
    : 'empresas_clientes'

  const { data: anterior, error: errorConsulta } = await supabase
    .from(tabla)
    .select('permite_trabajos_gratis')
    .eq('id', id)
    .single()

  if (errorConsulta || !anterior) {
    return { error: 'No se encontró el registro.' }
  }

  const { data: actualizado, error } = await supabase
    .from(tabla)
    .update({
      permite_trabajos_gratis: permitido,
      modificado_en: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error || !actualizado) {
    return { error: error?.message ?? 'No se pudo actualizar.' }
  }

  await registrarAuditoria({
    usuarioId: user.id,
    accion: 'editar',
    entidad: tipo === 'cliente' ? 'cliente' : 'empresa_cliente',
    entidadId: id,
    detalle: {
      campo: 'permite_trabajos_gratis',
      anterior: anterior.permite_trabajos_gratis,
      nuevo: permitido,
    },
  })

  revalidatePath(
    tipo === 'cliente'
      ? `/clientes/${id}`
      : `/clientes/empresas/${id}`
  )
  revalidatePath('/clientes')
  revalidatePath('/trabajos')
  revalidatePath('/presupuestos')

  return { success: true }
}
