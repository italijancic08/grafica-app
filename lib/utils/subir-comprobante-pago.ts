import { createClient } from '@/lib/supabase/client'

export const TAMANO_MAXIMO_COMPROBANTE_MB = 10

// Sube el comprobante directamente desde el navegador al bucket privado
// "comprobantes" (así no se choca con el límite de tamaño de las Server
// Actions). Después hay que guardar la ruta con adjuntarComprobantePago().
export async function subirComprobantePago(
  trabajoId: string,
  pagoId: string,
  archivo: File
): Promise<{ ruta?: string; error?: string }> {
  if (archivo.size > TAMANO_MAXIMO_COMPROBANTE_MB * 1024 * 1024) {
    return { error: `El archivo supera los ${TAMANO_MAXIMO_COMPROBANTE_MB} MB.` }
  }

  if (archivo.type !== 'application/pdf' && !archivo.type.startsWith('image/')) {
    return { error: 'Solo se aceptan imágenes o PDF.' }
  }

  const extension = (archivo.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const ruta = `pagos/${trabajoId}/${pagoId}-${Date.now()}.${extension}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('comprobantes')
    .upload(ruta, archivo, { contentType: archivo.type })

  if (error) return { error: error.message }
  return { ruta }
}