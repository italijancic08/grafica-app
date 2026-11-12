'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FotoTrabajo } from '@/lib/types/foto-trabajo'

const BUCKET = 'fotos-trabajos'

// Devuelve las fotos de un trabajo/presupuesto con un link temporal (1 hora)
export async function listarFotosDeTrabajo(trabajoId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trabajo_fotos')
    .select('id, ruta, nombre')
    .eq('trabajo_id', trabajoId)
    .order('creado_en', { ascending: true })

  if (error) return { error: error.message }

  const filas = data ?? []
  if (filas.length === 0) return { data: [] as FotoTrabajo[] }

  const { data: firmadas } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      filas.map((f) => f.ruta),
      3600
    )

  const urlPorRuta = new Map((firmadas ?? []).map((f) => [f.path, f.signedUrl]))

  const fotos: FotoTrabajo[] = filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    url: urlPorRuta.get(f.ruta) ?? null,
  }))

  return { data: fotos }
}

// Se llama después de subir la foto al bucket desde el navegador
export async function registrarFotoTrabajo(trabajoId: string, ruta: string, nombre: string) {
  if (!ruta.startsWith(`${trabajoId}/`)) {
    return { error: 'Ruta de foto inválida.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('trabajo_fotos')
    .insert({ trabajo_id: trabajoId, ruta, nombre })

  if (error) return { error: error.message }

  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}

export async function eliminarFotoTrabajo(fotoId: string, trabajoId: string) {
  const supabase = await createClient()

  const { data: foto, error: errorFoto } = await supabase
    .from('trabajo_fotos')
    .select('ruta')
    .eq('id', fotoId)
    .eq('trabajo_id', trabajoId)
    .single()

  if (errorFoto || !foto) return { error: 'No se encontró la foto.' }

  await supabase.storage.from(BUCKET).remove([foto.ruta])

  const { error } = await supabase.from('trabajo_fotos').delete().eq('id', fotoId)
  if (error) return { error: error.message }

  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}