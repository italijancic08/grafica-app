import { createClient } from '@/lib/supabase/client'

export const TAMANO_MAXIMO_FOTO_MB = 15

// Sube la foto directamente desde el navegador al bucket privado "fotos-trabajos".
// Después hay que guardar la ruta con registrarFotoTrabajo().
export async function subirFotoTrabajo(
  trabajoId: string,
  archivo: File
): Promise<{ ruta?: string; error?: string }> {
  if (!archivo.type.startsWith('image/')) {
    return { error: `"${archivo.name}" no es una imagen.` }
  }

  if (archivo.size > TAMANO_MAXIMO_FOTO_MB * 1024 * 1024) {
    return { error: `"${archivo.name}" supera los ${TAMANO_MAXIMO_FOTO_MB} MB.` }
  }

  const extension =
    (archivo.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const ruta = `${trabajoId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('fotos-trabajos')
    .upload(ruta, archivo, { contentType: archivo.type })

  if (error) return { error: error.message }
  return { ruta }
}