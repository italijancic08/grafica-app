'use server'

import { createClient } from '@/lib/supabase/server'
import { empresaSchema, type EmpresaInput } from '@/lib/validations/empresa'
import { revalidatePath } from 'next/cache'

// El sistema es de una sola empresa: siempre hay a lo sumo una fila
// en la tabla "empresas". Si todavía no se cargó ninguna, devuelve null.
export async function obtenerEmpresa() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) return { error: error.message }
  return { data }
}

export async function actualizarEmpresa(input: EmpresaInput) {
  const parsed = empresaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data: existente } = await supabase
    .from('empresas')
    .select('id')
    .limit(1)
    .maybeSingle()

  const datos = {
    nombre: parsed.data.nombre,
    cuit: parsed.data.cuit || null,
    direccion: parsed.data.direccion || null,
    telefono: parsed.data.telefono || null,
    email: parsed.data.email || null,
  }

  const { error } = existente
    ? await supabase.from('empresas').update(datos).eq('id', existente.id)
    : await supabase.from('empresas').insert(datos)

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { success: true }
}