'use server'

import { createClient } from '@/lib/supabase/server'
import { generarPdfComprobante } from '@/lib/pdf/comprobante'
import { enviarComprobanteConFallback } from '@/lib/services/envio-comprobante'
import { revalidatePath } from 'next/cache'

export async function listarComprobantesDeTrabajo(
  trabajoId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('facturas')
    .select('*')
    .eq('trabajo_id', trabajoId)
    .order('creado_en', {
      ascending: false,
    })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function listarTodasLasFacturas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('facturas')
    .select(
      '*, trabajos(numero), clientes(nombre_razon_social)'
    )
    .order('creado_en', {
      ascending: false,
    })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function generarComprobante(
  trabajoId: string
) {
  const supabase = await createClient()

  // =========================================================
  // OBTENER TRABAJO + CLIENTE
  // =========================================================

  const { data: trabajo, error: errorTrabajo } =
    await supabase
      .from('trabajos')
      .select(`
        numero,
        descripcion,
        rubro,
        precio_final,
        cliente_id,
        clientes(
          nombre_razon_social,
          cuit_cuil,
          domicilio,
          whatsapp,
          email
        )
      `)
      .eq('id', trabajoId)
      .single()

  if (errorTrabajo || !trabajo) {
    return {
      error:
        'No se encontró el trabajo para generar el comprobante',
    }
  }

  const cliente = Array.isArray(trabajo.clientes)
    ? trabajo.clientes[0]
    : trabajo.clientes

  if (!cliente) {
    return {
      error:
        'El trabajo no tiene un cliente asociado',
    }
  }

  // =========================================================
  // EMPRESA
  // =========================================================

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .limit(1)
    .maybeSingle()

  // =========================================================
  // CREAR FACTURA
  // =========================================================

  const { data: factura, error: errorInsert } =
    await supabase
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
    return {
      error:
        errorInsert?.message ??
        'No se pudo registrar el comprobante',
    }
  }

  // =========================================================
  // GENERAR PDF
  // =========================================================

  const bytesPdf = await generarPdfComprobante({
    numero: factura.numero,
    fecha: factura.fecha,
    monto: factura.monto,
    empresa: empresa ?? null,

    cliente: {
      nombre_razon_social:
        cliente.nombre_razon_social,
      cuit_cuil: cliente.cuit_cuil,
      domicilio: cliente.domicilio,
    },

    trabajo: {
      numero: trabajo.numero,
      descripcion: trabajo.descripcion,
      rubro: trabajo.rubro,
    },
  })

  const pdfBuffer = Buffer.from(bytesPdf)

  // =========================================================
  // GUARDAR PDF
  // =========================================================

  const rutaArchivo =
    `${trabajoId}/${factura.numero}.pdf`

  const { error: errorStorage } =
    await supabase.storage
      .from('comprobantes')
      .upload(
        rutaArchivo,
        pdfBuffer,
        {
          contentType: 'application/pdf',
          upsert: true,
        }
      )

  if (errorStorage) {
    return {
      error:
        `El comprobante se registró pero falló ` +
        `la generación del PDF: ${errorStorage.message}`,
    }
  }

  // =========================================================
  // GUARDAR RUTA DEL PDF
  // =========================================================

  const { error: errorUpdate } =
    await supabase
      .from('facturas')
      .update({
        archivo_pdf_url: rutaArchivo,
      })
      .eq('id', factura.id)

  if (errorUpdate) {
    return {
      error: errorUpdate.message,
    }
  }

  // =========================================================
  // ENVIAR AUTOMÁTICAMENTE
  // WHATSAPP → EMAIL → NO ENVIADO
  // =========================================================

  const resultadoEnvio =
    await enviarComprobanteConFallback({
      facturaId: factura.id,
      numero: factura.numero,
      nombreCliente:
        cliente.nombre_razon_social,
      whatsapp: cliente.whatsapp,
      email: cliente.email,
      pdf: pdfBuffer,
    })

  // =========================================================
  // RECUPERAR ESTADO FINAL
  // =========================================================

  const { data: facturaActualizada } =
    await supabase
      .from('facturas')
      .select('*')
      .eq('id', factura.id)
      .single()

  revalidatePath(`/trabajos/${trabajoId}`)
  revalidatePath('/facturas')
  revalidatePath('/documentos')

  return {
    data: facturaActualizada ?? {
      ...factura,
      archivo_pdf_url: rutaArchivo,
    },

    envio: resultadoEnvio,
  }
}

// =========================================================
// DESCARGA
// =========================================================

export async function obtenerUrlDescargaComprobante(
  rutaArchivo: string
) {
  const supabase = await createClient()

  const { data, error } =
    await supabase.storage
      .from('comprobantes')
      .createSignedUrl(
        rutaArchivo,
        60
      )

  if (error) {
    return {
      error: error.message,
    }
  }

  return {
    data: data.signedUrl,
  }
}