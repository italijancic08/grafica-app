import { createClient } from '@/lib/supabase/client'
import { TAMANO_MAXIMO_COMPROBANTE_MB } from '@/lib/utils/subir-comprobante-pago'

// Sube el comprobante de un movimiento MANUAL de caja directamente desde el
// navegador al bucket privado "comprobantes" (carpeta caja/<movimiento_id>/).
// Después hay que guardar la ruta con adjuntarComprobanteMovimiento().
export async function subirComprobanteMovimientoCaja(
  movimientoId: string,
  archivo: File
): Promise<{ ruta?: string; error?: string }> {
  if (archivo.size > TAMANO_MAXIMO_COMPROBANTE_MB * 1024 * 1024) {
    return { error: `El archivo supera los ${TAMANO_MAXIMO_COMPROBANTE_MB} MB.` }
  }

  if (archivo.type !== 'application/pdf' && !archivo.type.startsWith('image/')) {
    return { error: 'Solo se aceptan imágenes o PDF.' }
  }

  const extension = (archivo.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const ruta = `caja/${movimientoId}/${Date.now()}.${extension}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('comprobantes')
    .upload(ruta, archivo, { contentType: archivo.type })

  if (error) return { error: error.message }
  return { ruta }
}