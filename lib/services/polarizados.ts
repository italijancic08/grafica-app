
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'
import { registrarAuditoria } from '@/lib/services/auditoria'

const esquema = z.object({
  titulo: z.string().trim().min(1).max(200),
  vehiculo: z.string().trim().min(1).max(300),
  categoria: z.string().trim().max(100),
  efectivo: z.number().finite().min(0),
  recargoTarjeta: z.number().finite().min(0).max(5),
})

export type DatosPolarizado = z.infer<typeof esquema>
export type Polarizado = DatosPolarizado & {
  id: string
  categoria: string | null
}

export async function listarPolarizados() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lista_polarizados')
    .select('*')
    .order('titulo')
    .order('vehiculo')

  if (error) return { error: error.message }
  return { data: (data ?? []) as Polarizado[] }
}

export async function guardarPolarizado(
  id: string | null,
  input: DatosPolarizado
) {
  const permiso = await errorSiNoEsAdministrador()
  if (permiso) return permiso

  const parsed = esquema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const datos = {
    ...parsed.data,
    categoria: parsed.data.categoria || null,
    modificado_en: new Date().toISOString(),
  }

  if (id === null) {
    const { data, error } = await supabase
      .from('lista_polarizados')
      .insert(datos)
      .select('id')
      .single()

    if (error) return { error: error.message }

    await registrarAuditoria({
      accion: 'crear',
      entidad: 'polarizados',
      entidadId: data.id,
      detalle: { vehiculo: datos.vehiculo },
    })
  } else {
    if (!z.uuid().safeParse(id).success) {
      return { error: 'Identificador inválido.' }
    }

    const { error } = await supabase
      .from('lista_polarizados')
      .update(datos)
      .eq('id', id)

    if (error) return { error: error.message }

    await registrarAuditoria({
      accion: 'editar',
      entidad: 'polarizados',
      entidadId: id,
      detalle: { vehiculo: datos.vehiculo },
    })
  }

  revalidatePath('/lista-precios')
  return { success: true }
}

export async function borrarPolarizado(id: string) {
  const permiso = await errorSiNoEsAdministrador()
  if (permiso) return permiso

  if (!z.uuid().safeParse(id).success) {
    return { error: 'Identificador inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('lista_polarizados')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  await registrarAuditoria({
    accion: 'eliminar',
    entidad: 'polarizados',
    entidadId: id,
  })

  revalidatePath('/lista-precios')
  return { success: true }
}
