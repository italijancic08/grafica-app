'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'
import { registrarAuditoria } from '@/lib/services/auditoria'
import { LISTA_PRECIOS, type ItemPrecio } from '@/lib/data/lista-precios'

const campo = z.string().trim().max(500).nullable()
const esquema = z.object({
  rubro: z.string().trim().min(1).max(150),
  nombre: z.string().trim().min(1).max(500),
  medida: campo,
  material: campo,
  cantidad: campo,
  precio: z.number().nonnegative().finite().nullable(),
  precioTexto: campo,
  minimo: z.number().nonnegative().finite().nullable(),
  minimoTexto: campo,
  nota: campo,
})

export type DatosPrecio = z.infer<typeof esquema>
export type ItemEditable = ItemPrecio & { clave: string }

type FilaCambio = ItemPrecio & {
  id: string
  indice_original: number | null
  eliminado: boolean
}

export async function listarListaPrecios(): Promise<{
  data?: ItemEditable[]
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lista_precios_cambios')
    .select('*')
    .order('modificado_en', { ascending: true })
  if (error) return { error: error.message }

  const items = LISTA_PRECIOS.map((item, i) => ({
    ...item,
    clave: `original:${i}`,
  }))
  const nuevos: ItemEditable[] = []
  const eliminados = new Set<number>()

  for (const fila of (data ?? []) as FilaCambio[]) {
    const { id, indice_original, eliminado, ...resto } = fila
    const item = { ...resto, clave: `bd:${id}` }
    if (indice_original !== null) {
      if (indice_original < 0 || indice_original >= items.length) continue
      if (eliminado) eliminados.add(indice_original)
      else items[indice_original] = item
    } else if (!eliminado) {
      nuevos.push(item)
    }
  }
  return {
    data: [...items.filter((_, indice) => !eliminados.has(indice)), ...nuevos],
  }
}

async function autorizar() {
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return { error: sinPermiso.error }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no válida.' }
  return { supabase, user }
}

export async function guardarPrecio(clave: string | null, input: DatosPrecio) {
  const permiso = await autorizar()
  if ('error' in permiso) return { error: permiso.error }
  const parsed = esquema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { supabase, user } = permiso
  let error: string | undefined

  if (clave === null) {
    const resultado = await supabase.from('lista_precios_cambios')
      .insert(parsed.data)
    error = resultado.error?.message
  } else if (clave.startsWith('original:')) {
    const indice = Number(clave.slice(9))
    if (!Number.isInteger(indice) || indice < 0 || indice >= LISTA_PRECIOS.length)
      return { error: 'Artículo original inválido.' }
    const resultado = await supabase.from('lista_precios_cambios')
      .upsert({ ...parsed.data, indice_original: indice, eliminado: false,
        modificado_en: new Date().toISOString() }, { onConflict: 'indice_original' })
    error = resultado.error?.message
  } else if (clave.startsWith('bd:')) {
    const id = clave.slice(3)
    if (!z.uuid().safeParse(id).success) return { error: 'Identificador inválido.' }
    const resultado = await supabase.from('lista_precios_cambios')
      .update({ ...parsed.data, modificado_en: new Date().toISOString() })
      .eq('id', id).select('id').single()
    error = resultado.error?.message
  } else return { error: 'Identificador inválido.' }

  if (error) return { error }
  await registrarAuditoria({ usuarioId: user.id, accion: clave ? 'editar' : 'crear',
    entidad: 'lista_precios', detalle: { clave, nombre: parsed.data.nombre } })
  revalidatePath('/lista-precios')
  return { success: true }
}

export async function borrarPrecio(clave: string) {
  const permiso = await autorizar()
  if ('error' in permiso) return { error: permiso.error }
  const { supabase, user } = permiso
  let error: string | undefined
  if (clave.startsWith('original:')) {
    const indice = Number(clave.slice(9))
    if (!Number.isInteger(indice) || indice < 0 || indice >= LISTA_PRECIOS.length)
      return { error: 'Artículo original inválido.' }
    const resultado = await supabase.from('lista_precios_cambios').upsert({
      ...LISTA_PRECIOS[indice], indice_original: indice, eliminado: true,
      modificado_en: new Date().toISOString(),
    }, { onConflict: 'indice_original' })
    error = resultado.error?.message
  } else if (clave.startsWith('bd:')) {
    const id = clave.slice(3)
    if (!z.uuid().safeParse(id).success) return { error: 'Identificador inválido.' }
    const resultado = await supabase.from('lista_precios_cambios')
      .update({ eliminado: true, modificado_en: new Date().toISOString() })
      .eq('id', id).select('id').single()
    error = resultado.error?.message
  } else return { error: 'Identificador inválido.' }

  if (error) return { error }
  await registrarAuditoria({ usuarioId: user.id, accion: 'eliminar',
    entidad: 'lista_precios', detalle: { clave } })
  revalidatePath('/lista-precios')
  return { success: true }
}
