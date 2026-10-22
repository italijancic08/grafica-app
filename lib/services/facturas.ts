'use server'

import { createClient } from '@/lib/supabase/server'
import { generarPdfComprobante } from '@/lib/pdf/comprobante'
import { revalidatePath } from 'next/cache'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'

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
          telefono,
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
      telefono: cliente.telefono ?? cliente.whatsapp,
      email: cliente.email,
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

  revalidatePath(`/trabajos/${trabajoId}`)
  revalidatePath('/facturas')
  revalidatePath('/documentos')

  return {
    data: {
      ...factura,
      archivo_pdf_url: rutaArchivo,
    },
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

// =========================================================
// REGENERAR PDF (para actualizar comprobantes ya emitidos al
// diseño actual). No crea un comprobante nuevo ni cambia su
// número, fecha o monto: vuelve a generar el PDF del mismo
// registro y pisa el archivo que ya está en Storage.
// =========================================================

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>

async function regenerarPdfDeFactura(
  supabase: ClienteSupabase,
  factura: {
    id: string
    trabajo_id: string
    numero: string | null
    fecha: string
    monto: number
    archivo_pdf_url: string | null
  }
): Promise<{ error?: string }> {
  if (!factura.numero) {
    return { error: 'El comprobante no tiene número.' }
  }

  const { data: trabajo, error: errorTrabajo } = await supabase
    .from('trabajos')
    .select(`
      numero,
      descripcion,
      rubro,
      clientes(
        nombre_razon_social,
        cuit_cuil,
        domicilio,
        telefono,
        whatsapp,
        email
      )
    `)
    .eq('id', factura.trabajo_id)
    .single()

  if (errorTrabajo || !trabajo) {
    return { error: 'No se encontró el trabajo del comprobante.' }
  }

  const cliente = Array.isArray(trabajo.clientes)
    ? trabajo.clientes[0]
    : trabajo.clientes

  if (!cliente) {
    return { error: 'El trabajo no tiene un cliente asociado.' }
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .limit(1)
    .maybeSingle()

  const bytesPdf = await generarPdfComprobante({
    numero: factura.numero,
    fecha: factura.fecha,
    monto: factura.monto,
    empresa: empresa ?? null,
    cliente: {
      nombre_razon_social: cliente.nombre_razon_social,
      cuit_cuil: cliente.cuit_cuil,
      domicilio: cliente.domicilio,
      telefono: cliente.telefono ?? cliente.whatsapp,
      email: cliente.email,
    },
    trabajo: {
      numero: trabajo.numero,
      descripcion: trabajo.descripcion,
      rubro: trabajo.rubro,
    },
  })

  // Se pisa el mismo archivo que ya tenía el comprobante
  const rutaArchivo =
    factura.archivo_pdf_url ?? `${factura.trabajo_id}/${factura.numero}.pdf`

  const { error: errorStorage } = await supabase.storage
    .from('comprobantes')
    .upload(rutaArchivo, Buffer.from(bytesPdf), {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (errorStorage) {
    return { error: errorStorage.message }
  }

  if (!factura.archivo_pdf_url) {
    const { error: errorUpdate } = await supabase
      .from('facturas')
      .update({ archivo_pdf_url: rutaArchivo })
      .eq('id', factura.id)

    if (errorUpdate) return { error: errorUpdate.message }
  }

  return {}
}

export async function regenerarComprobante(facturaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Debés iniciar sesión.' }

  const { data: factura } = await supabase
    .from('facturas')
    .select('id, trabajo_id, numero, fecha, monto, archivo_pdf_url')
    .eq('id', facturaId)
    .single()

  if (!factura) return { error: 'No se encontró el comprobante.' }

  const resultado = await regenerarPdfDeFactura(supabase, factura)
  if (resultado.error) return { error: resultado.error }

  revalidatePath('/facturas')
  revalidatePath('/documentos')
  revalidatePath(`/trabajos/${factura.trabajo_id}`)
  return { success: true }
}

export async function regenerarTodosLosComprobantes() {
  const sinPermiso = await errorSiNoEsAdministrador(
    'Solo un administrador puede actualizar todos los comprobantes.'
  )
  if (sinPermiso) return { error: sinPermiso.error }

  const supabase = await createClient()

  const { data: facturas, error } = await supabase
    .from('facturas')
    .select('id, trabajo_id, numero, fecha, monto, archivo_pdf_url')
    .order('creado_en', { ascending: true })

  if (error) return { error: error.message }

  let actualizados = 0
  const fallidos: string[] = []

  // De a uno, para no saturar Storage ni la memoria del servidor
  for (const factura of facturas ?? []) {
    const resultado = await regenerarPdfDeFactura(supabase, factura)
    if (resultado.error) {
      fallidos.push(`${factura.numero ?? factura.id}: ${resultado.error}`)
    } else {
      actualizados++
    }
  }

  revalidatePath('/facturas')
  revalidatePath('/documentos')
  return { success: true, actualizados, fallidos }
}