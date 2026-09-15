import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarComprobanteEmail } from '@/lib/services/email'

/**
 * =========================================================
 * VERIFICACIÓN DEL WEBHOOK
 * =========================================================
 *
 * Meta hace una petición GET cuando configuramos el webhook.
 *
 * Debemos devolver exactamente el hub.challenge si
 * el verify_token coincide.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode =
    searchParams.get('hub.mode')

  const token =
    searchParams.get('hub.verify_token')

  const challenge =
    searchParams.get('hub.challenge')

  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN

  if (
    mode === 'subscribe' &&
    token &&
    verifyToken &&
    token === verifyToken
  ) {
    return new NextResponse(
      challenge ?? '',
      {
        status: 200,
      }
    )
  }

  return NextResponse.json(
    {
      error: 'Token de verificación inválido',
    },
    {
      status: 403,
    }
  )
}

/**
 * =========================================================
 * EVENTOS DE WHATSAPP
 * =========================================================
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json()

    console.log(
      '[WhatsApp Webhook]',
      JSON.stringify(body)
    )

    /**
     * Meta puede mandar distintos tipos de eventos.
     *
     * Nos interesan particularmente:
     *
     * statuses[].status = failed
     */

    const entries = Array.isArray(body?.entry)
      ? body.entry
      : []

    for (const entry of entries) {
      const changes = Array.isArray(
        entry?.changes
      )
        ? entry.changes
        : []

      for (const change of changes) {
        const value = change?.value

        if (!value) {
          continue
        }

        const statuses = Array.isArray(
          value?.statuses
        )
          ? value.statuses
          : []

        for (const status of statuses) {
          await procesarEstadoWhatsApp(status)
        }
      }
    }

    return NextResponse.json({
      received: true,
    })
  } catch (error) {
    console.error(
      '[WhatsApp Webhook] Error:',
      error
    )

    /**
     * Respondemos 200 igualmente.
     *
     * Esto evita que Meta reintente indefinidamente
     * por un error interno nuestro.
     */
    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    )
  }
}

/**
 * =========================================================
 * PROCESAR ESTADO DE UN MENSAJE
 * =========================================================
 */
async function procesarEstadoWhatsApp(
  status: any
) {
  const messageId =
    status?.id

  const estado =
    status?.status

  if (!messageId || !estado) {
    return
  }

  const supabase =
    createAdminClient()

  /**
   * Buscamos el intento de WhatsApp utilizando
   * el ID que nos dio Meta.
   */
  const {
    data: envio,
    error: errorEnvio,
  } = await supabase
    .from('factura_envios')
    .select('*')
    .eq('proveedor_id', messageId)
    .eq('canal', 'WHATSAPP')
    .maybeSingle()

  if (errorEnvio) {
    console.error(
      '[WhatsApp Webhook] Error buscando envío:',
      errorEnvio
    )

    return
  }

  if (!envio) {
    /**
     * Puede ser un mensaje que no pertenece a nuestra
     * aplicación.
     */
    return
  }

  /**
   * =======================================================
   * ENTREGADO
   * =======================================================
   */

  if (
    estado === 'delivered' ||
    estado === 'read'
  ) {
    await supabase
      .from('factura_envios')
      .update({
        estado: 'ENVIADO',
        enviado_en:
          new Date().toISOString(),
        actualizado_en:
          new Date().toISOString(),
      })
      .eq('id', envio.id)

    return
  }

  /**
   * =======================================================
   * FALLÓ WHATSAPP
   * =======================================================
   */

  if (estado !== 'failed') {
    return
  }

  /**
   * Evitamos ejecutar el fallback dos veces.
   */
  const { data: factura } =
    await supabase
      .from('facturas')
      .select(`
        *,
        clientes(
          nombre_razon_social,
          email
        )
      `)
      .eq('id', envio.factura_id)
      .maybeSingle()

  if (!factura) {
    console.error(
      '[WhatsApp Webhook] Factura no encontrada:',
      envio.factura_id
    )

    return
  }

  /**
   * Si ya conseguimos enviar por email anteriormente,
   * no hacemos nada.
   */
  if (
    factura.estado_envio ===
    'ENVIADO_EMAIL'
  ) {
    return
  }

  /**
   * Obtenemos el motivo del error que mandó Meta.
   */
  const errores =
    Array.isArray(status?.errors)
      ? status.errors
      : []

  const primerError =
    errores[0]

  const codigoError =
    primerError?.code
      ? String(primerError.code)
      : 'WHATSAPP_DELIVERY_FAILED'

  const detalleError =
    primerError?.title ||
    primerError?.message ||
    'WhatsApp no pudo entregar el comprobante.'

  /**
   * Guardamos el fallo real informado por Meta.
   */
  await supabase
    .from('factura_envios')
    .update({
      estado: 'FALLIDO',
      codigo_error: codigoError,
      detalle_error: detalleError,
      actualizado_en:
        new Date().toISOString(),
    })
    .eq('id', envio.id)

  /**
   * =======================================================
   * FALLBACK A EMAIL
   * =======================================================
   */

  const cliente = Array.isArray(
    factura.clientes
  )
    ? factura.clientes[0]
    : factura.clientes

  const email =
    cliente?.email

  if (!email) {
    await marcarNoEnviado(
      factura.id,
      `WhatsApp falló: ${detalleError}. ` +
      `El cliente no tiene email configurado.`
    )

    return
  }

  /**
   * Descargar nuevamente el PDF desde Storage.
   */
  if (!factura.archivo_pdf_url) {
    await marcarNoEnviado(
      factura.id,
      `WhatsApp falló: ${detalleError}. ` +
      `El comprobante no tiene PDF almacenado.`
    )

    return
  }

  const {
    data: archivo,
    error: errorDescarga,
  } = await supabase.storage
    .from('comprobantes')
    .download(
      factura.archivo_pdf_url
    )

  if (
    errorDescarga ||
    !archivo
  ) {
    await marcarNoEnviado(
      factura.id,
      `WhatsApp falló: ${detalleError}. ` +
      `No se pudo recuperar el PDF para enviarlo por email.`
    )

    return
  }

  const arrayBuffer =
    await archivo.arrayBuffer()

  const pdf = Buffer.from(
    arrayBuffer
  )

  const resultadoEmail =
    await enviarComprobanteEmail({
      numero:
        factura.numero ?? 'comprobante',
      nombreCliente:
        cliente?.nombre_razon_social ??
        'Cliente',
      email,
      pdf,
    })

  /**
   * Registramos el intento de email.
   */
  await supabase
    .from('factura_envios')
    .insert({
      factura_id: factura.id,
      canal: 'EMAIL',
      estado:
        resultadoEmail.success
          ? 'ENVIADO'
          : 'FALLIDO',
      destinatario: email,
      proveedor_id:
        resultadoEmail.proveedorId ??
        null,
      codigo_error:
        resultadoEmail.codigoError ??
        null,
      detalle_error:
        resultadoEmail.detalleError ??
        null,
      enviado_en:
        resultadoEmail.success
          ? new Date().toISOString()
          : null,
    })

  if (resultadoEmail.success) {
    await supabase
      .from('facturas')
      .update({
        estado_envio:
          'ENVIADO_EMAIL',
        canal_envio:
          'EMAIL',
        error_envio:
          `WhatsApp falló: ${detalleError}`,
        enviado_en:
          new Date().toISOString(),
      })
      .eq('id', factura.id)

    return
  }

  /**
   * WhatsApp + email fallaron.
   */
  await marcarNoEnviado(
    factura.id,
    `WhatsApp falló: ${detalleError}. ` +
    `Email falló: ${
      resultadoEmail.detalleError ??
      'error desconocido'
    }`
  )
}

/**
 * =========================================================
 * MARCAR COMO NO ENVIADO
 * =========================================================
 */
async function marcarNoEnviado(
  facturaId: string,
  error: string
) {
  const supabase =
    createAdminClient()

  await supabase
    .from('facturas')
    .update({
      estado_envio:
        'NO_ENVIADO',
      canal_envio:
        null,
      error_envio:
        error,
    })
    .eq('id', facturaId)
}