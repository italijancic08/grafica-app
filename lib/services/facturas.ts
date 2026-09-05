'use server'

import { createClient } from '@/lib/supabase/server'
import { generarPdfComprobante } from '@/lib/pdf/comprobante'
import { revalidatePath } from 'next/cache'

export async function listarComprobantesDeTrabajo(trabajoId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('facturas')
    .select('*')
    .eq('trabajo_id', trabajoId)
    .order('creado_en', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

// Genera el comprobante (recibo interno) de un trabajo: crea el registro
// en "facturas" (el número lo asigna el trigger de la migración 0012),
// arma el PDF y lo sube al bucket privado "comprobantes". Se llama
// automáticamente al marcar un trabajo como Retirado.
export async function generarComprobante(trabajoId: string) {
  const supabase = await createClient()

  const { data: trabajo, error: errorTrabajo } = await supabase
    .from('trabajos')
    .select('numero, descripcion, rubro, precio_final, cliente_id, clientes(nombre_razon_social, cuit_cuil, domicilio)')
    .eq('id', trabajoId)
    .single()

  if (errorTrabajo || !trabajo) {
    return { error: 'No se encontró el trabajo para generar el comprobante' }
  }

  const cliente = Array.isArray(trabajo.clientes) ? trabajo.clientes[0] : trabajo.clientes
  if (!cliente) {
    return { error: 'El trabajo no tiene un cliente asociado' }
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .limit(1)
    .maybeSingle()

  // Insertar el registro primero: el trigger le asigna el número
  // correlativo (REC-AAAA-NNNNNN) antes de que exista el archivo.
  const { data: factura, error: errorInsert } = await supabase
    .from('facturas')
    .insert({
      trabajo_id: trabajoId,
      cliente_id: trabajo.cliente_id,
      tipo_comprobante: 'RECIBO',
      monto: trabajo.precio_final,
    })
    .select()
    .single()

  if (errorInsert || !factura) {
    return { error: errorInsert?.message ?? 'No se pudo registrar el comprobante' }
  }

  const bytesPdf = await generarPdfComprobante({
    numero: factura.numero,
    fecha: factura.fecha,
    monto: factura.monto,
    empresa: empresa ?? null,
    cliente: {
      nombre_razon_social: cliente.nombre_razon_social,
      cuit_cuil: cliente.cuit_cuil,
      domicilio: cliente.domicilio,
    },
    trabajo: {
      numero: trabajo.numero,
      descripcion: trabajo.descripcion,
      rubro: trabajo.rubro,
    },
  })

  const rutaArchivo = `${trabajoId}/${factura.numero}.pdf`

  const { error: errorStorage } = await supabase.storage
    .from('comprobantes')
    .upload(rutaArchivo, bytesPdf, { contentType: 'application/pdf', upsert: true })

  if (errorStorage) {
    // El registro ya quedó creado (con su número consumido). No lo
    // borramos: el usuario puede reintentar la subida del PDF más
    // adelante si hace falta, y el número no se reutiliza.
    return { error: `El comprobante se registró pero falló la generación del PDF: ${errorStorage.message}` }
  }

  const { error: errorUpdate } = await supabase
    .from('facturas')
    .update({ archivo_pdf_url: rutaArchivo })
    .eq('id', factura.id)

  if (errorUpdate) return { error: errorUpdate.message }

  revalidatePath(`/trabajos/${trabajoId}`)
  return { data: { ...factura, archivo_pdf_url: rutaArchivo } }
}

// El bucket es privado, así que la descarga se hace siempre con una
// signed URL de corta duración generada en el momento (nunca se guarda
// una URL pública ni se expone el bucket).
export async function obtenerUrlDescargaComprobante(rutaArchivo: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(rutaArchivo, 60)

  if (error) return { error: error.message }
  return { data: data.signedUrl }
}