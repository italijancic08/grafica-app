'use server'

import { createClient } from '@/lib/supabase/server'
import { enviarComprobanteWhatsApp } from '@/lib/services/whatsapp'
import { enviarComprobanteEmail } from '@/lib/services/email'

async function registrarIntento({
  facturaId,
  canal,
  estado,
  destinatario,
  proveedorId,
  codigoError,
  detalleError,
}: {
  facturaId: string
  canal: 'WHATSAPP' | 'EMAIL'
  estado: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO'
  destinatario?: string | null
  proveedorId?: string | null
  codigoError?: string | null
  detalleError?: string | null
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('factura_envios')
    .insert({
      factura_id: facturaId,
      canal,
      estado,
      destinatario: destinatario ?? null,
      proveedor_id: proveedorId ?? null,
      codigo_error: codigoError ?? null,
      detalle_error: detalleError ?? null,
      enviado_en:
        estado === 'ENVIADO'
          ? new Date().toISOString()
          : null,
    })

  if (error) {
    console.error(
      '[Factura Envío] Error registrando intento:',
      error
    )
  }
}

async function actualizarEstadoFactura({
  facturaId,
  estado,
  canal,
  error,
}: {
  facturaId: string
  estado:
    | 'PENDIENTE'
    | 'ENVIADO_WHATSAPP'
    | 'ENVIADO_EMAIL'
    | 'NO_ENVIADO'
  canal?: 'WHATSAPP' | 'EMAIL' | null
  error?: string | null
}) {
  const supabase = await createClient()

  const { error: errorUpdate } = await supabase
    .from('facturas')
    .update({
      estado_envio: estado,
      canal_envio: canal ?? null,
      error_envio: error ?? null,
      enviado_en:
        estado === 'ENVIADO_WHATSAPP' ||
        estado === 'ENVIADO_EMAIL'
          ? new Date().toISOString()
          : null,
    })
    .eq('id', facturaId)

  if (errorUpdate) {
    console.error(
      '[Factura Envío] Error actualizando factura:',
      errorUpdate
    )
  }
}

export async function enviarComprobanteConFallback({
  facturaId,
  numero,
  nombreCliente,
  whatsapp,
  email,
  pdf,
}: {
  facturaId: string
  numero: string
  nombreCliente: string
  whatsapp: string | null
  email: string | null
  pdf: Buffer
}) {
  await actualizarEstadoFactura({
    facturaId,
    estado: 'PENDIENTE',
  })

  let errorWhatsApp = 'No se intentó WhatsApp.'
  let errorEmail = 'No se intentó email.'

  // =========================================================
  // 1. WHATSAPP
  // =========================================================

  console.log(
    `[Factura ${numero}] Iniciando envío por WhatsApp...`
  )

  /*
   * MODO DE PRUEBA
   *
   * Si WHATSAPP_TEST_FAIL=true en .env.local,
   * simulamos un fallo de WhatsApp.
   *
   * Esto nos permite comprobar el fallback a email
   * sin depender todavía de Meta ni del webhook.
   */
  if (process.env.WHATSAPP_TEST_FAIL === 'true') {
    errorWhatsApp =
      'Fallo de WhatsApp simulado para pruebas.'

    console.warn(
      `[Factura ${numero}] WhatsApp FALLÓ (prueba)`
    )

    await registrarIntento({
      facturaId,
      canal: 'WHATSAPP',
      estado: 'FALLIDO',
      destinatario: whatsapp,
      codigoError: 'WHATSAPP_TEST_FAIL',
      detalleError: errorWhatsApp,
    })
  } else if (whatsapp) {
    const resultadoWhatsApp =
      await enviarComprobanteWhatsApp({
        numero,
        nombreCliente,
        telefono: whatsapp,
        pdf,
      })

    await registrarIntento({
      facturaId,
      canal: 'WHATSAPP',
      estado:
        resultadoWhatsApp.success
          ? 'ENVIADO'
          : 'FALLIDO',
      destinatario: whatsapp,
      proveedorId:
        resultadoWhatsApp.proveedorId,
      codigoError:
        resultadoWhatsApp.codigoError,
      detalleError:
        resultadoWhatsApp.detalleError,
    })

    if (resultadoWhatsApp.success) {
      console.log(
        `[Factura ${numero}] WhatsApp enviado correctamente.`
      )

      await actualizarEstadoFactura({
        facturaId,
        estado: 'ENVIADO_WHATSAPP',
        canal: 'WHATSAPP',
      })

      return {
        success: true,
        canal: 'WHATSAPP' as const,
      }
    }

    errorWhatsApp =
      resultadoWhatsApp.detalleError ??
      'No se pudo enviar por WhatsApp.'

    console.warn(
      `[Factura ${numero}] WhatsApp FALLÓ:`,
      errorWhatsApp
    )
  } else {
    errorWhatsApp =
      'El cliente no tiene un número de WhatsApp cargado.'

    console.warn(
      `[Factura ${numero}] Sin WhatsApp.`
    )

    await registrarIntento({
      facturaId,
      canal: 'WHATSAPP',
      estado: 'FALLIDO',
      destinatario: null,
      codigoError: 'SIN_WHATSAPP',
      detalleError: errorWhatsApp,
    })
  }

  // =========================================================
  // 2. EMAIL
  // =========================================================

  console.log(
    `[Factura ${numero}] Intentando fallback por email...`
  )

  if (email) {
    const resultadoEmail =
      await enviarComprobanteEmail({
        numero,
        nombreCliente,
        email,
        pdf,
      })

    await registrarIntento({
      facturaId,
      canal: 'EMAIL',
      estado:
        resultadoEmail.success
          ? 'ENVIADO'
          : 'FALLIDO',
      destinatario: email,
      proveedorId:
        resultadoEmail.proveedorId,
      codigoError:
        resultadoEmail.codigoError,
      detalleError:
        resultadoEmail.detalleError,
    })

    if (resultadoEmail.success) {
      console.log(
        `[Factura ${numero}] Email enviado correctamente.`
      )

      await actualizarEstadoFactura({
        facturaId,
        estado: 'ENVIADO_EMAIL',
        canal: 'EMAIL',
        error:
          `WhatsApp falló: ${errorWhatsApp}`,
      })

      return {
        success: true,
        canal: 'EMAIL' as const,
        fallback: true,
        errorWhatsApp,
      }
    }

    errorEmail =
      resultadoEmail.detalleError ??
      'No se pudo enviar por email.'

    console.error(
      `[Factura ${numero}] Email FALLÓ:`,
      errorEmail
    )
  } else {
    errorEmail =
      'El cliente no tiene un email cargado.'

    console.warn(
      `[Factura ${numero}] Sin email.`
    )

    await registrarIntento({
      facturaId,
      canal: 'EMAIL',
      estado: 'FALLIDO',
      destinatario: null,
      codigoError: 'SIN_EMAIL',
      detalleError: errorEmail,
    })
  }

  // =========================================================
  // 3. FALLAR TODO
  // =========================================================

  const errorFinal =
    `WhatsApp: ${errorWhatsApp} | Email: ${errorEmail}`

  console.error(
    `[Factura ${numero}] No se pudo enviar por ningún canal:`,
    errorFinal
  )

  await actualizarEstadoFactura({
    facturaId,
    estado: 'NO_ENVIADO',
    error: errorFinal,
  })

  return {
    success: false,
    error: errorFinal,
  }
}