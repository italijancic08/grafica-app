'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'
import { registrarAuditoria } from '@/lib/services/auditoria'

const esquema = z.object({
  numero: z.number().int().positive().max(9999),
  nota: z.string().trim().max(500),
  fotos: z.array(z.string().trim().regex(/^\/categorias\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i, 'Usá una ruta de imagen válida de /public/categorias.')).max(40),
})
export type DatosCategoria = z.infer<typeof esquema>
export type CategoriaDB = DatosCategoria

export async function listarCategorias(): Promise<{ data?: CategoriaDB[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('categorias_vehiculos').select('numero, nota, fotos').order('numero')
  if (error) return { error: error.message }
  return { data: (data ?? []).map(c => ({ numero: Number(c.numero), nota: c.nota ?? '', fotos: c.fotos ?? [] })) }
}

export async function guardarCategoria(anterior: number | null, input: DatosCategoria) {
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return sinPermiso
  const parsed = esquema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  const supabase = await createClient()
  const datos = parsed.data
  const respuesta = anterior === null
    ? await supabase.from('categorias_vehiculos').insert(datos)
    : await supabase.from('categorias_vehiculos').update(datos).eq('numero', anterior).select('numero').single()
  if (respuesta.error) return { error: respuesta.error.message }
  const { data: { user } } = await supabase.auth.getUser()
  await registrarAuditoria({ usuarioId: user?.id, accion: anterior === null ? 'crear' : 'editar', entidad: 'categorias_vehiculos', detalle: { numero: datos.numero, anterior } })
  revalidatePath('/lista-precios')
  return { success: true }
}

export async function borrarCategoria(numero: number) {
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return sinPermiso
  if (!Number.isInteger(numero) || numero <= 0) return { error: 'Categoría inválida.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('categorias_vehiculos').delete().eq('numero', numero).select('numero').single()
  if (error) return { error: error.message }
  if (!data) return { error: 'Categoría no encontrada.' }
  const { data: { user } } = await supabase.auth.getUser()
  await registrarAuditoria({ usuarioId: user?.id, accion: 'eliminar', entidad: 'categorias_vehiculos', detalle: { numero } })
  revalidatePath('/lista-precios')
  return { success: true }
}
