'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
async function autorizar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Iniciá sesión para modificar sublimaciones.' }
  }

  return { supabase, user }
}
import { registrarAuditoria } from '@/lib/services/auditoria'

const campo = z.string().trim().max(500).nullable()
const esquema = z.object({
  articulo: z.string().trim().min(1, 'El artículo es obligatorio.').max(200),
  tela: campo,
  material: campo,
  temperatura: campo,
  tiempo: campo,
  presion: campo,
  nota: campo,
})

export type DatosSublimacion = z.infer<typeof esquema>
export type Sublimacion = DatosSublimacion & { id: string }

export async function listarSublimaciones(): Promise<{
  data?: Sublimacion[]
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lista_sublimaciones')
    .select('id, articulo, tela, material, temperatura, tiempo, presion, nota')
    .order('articulo', { ascending: true })
  if (error) return { error: error.message }
  return { data: (data ?? []) as Sublimacion[] }
}

async function autorizar() {
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return { error: sinPermiso.error }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no válida.' }
  return { supabase, user }
}

export async function guardarSublimacion(id: string | null, input: DatosSublimacion) {
  const permiso = await autorizar()
  if ('error' in permiso) return { error: permiso.error }
  const parsed = esquema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { supabase, user } = permiso
  let error: string | undefined

  if (id === null) {
    const resultado = await supabase.from('lista_sublimaciones').insert(parsed.data)
    error = resultado.error?.message
  } else {
    if (!z.uuid().safeParse(id).success) return { error: 'Identificador inválido.' }
    const resultado = await supabase.from('lista_sublimaciones')
      .update({ ...parsed.data, modificado_en: new Date().toISOString() })
      .eq('id', id).select('id').single()
    error = resultado.error?.message
  }

  if (error) return { error }
  await registrarAuditoria({
    usuarioId: user.id, accion: id ? 'editar' : 'crear',
    entidad: 'sublimaciones', entidadId: id ?? undefined,
    detalle: { articulo: parsed.data.articulo },
  })
  revalidatePath('/lista-precios')
  return { success: true }
}

export async function borrarSublimacion(id: string) {
  const permiso = await autorizar()
  if ('error' in permiso) return { error: permiso.error }
  if (!z.uuid().safeParse(id).success) return { error: 'Identificador inválido.' }
  const { supabase, user } = permiso
  const { error } = await supabase.from('lista_sublimaciones').delete().eq('id', id)
  if (error) return { error: error.message }
  await registrarAuditoria({
    usuarioId: user.id, accion: 'eliminar', entidad: 'sublimaciones', entidadId: id,
  })
  revalidatePath('/lista-precios')
  return { success: true }
}