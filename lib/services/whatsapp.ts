interface ConfiguracionWhatsApp {
  accessToken: string
  phoneNumberId: string
  graphApiVersion: string
  templateName: string
  templateLanguage: string
}

interface ResultadoWhatsApp {
  success: boolean
  proveedorId?: string
  codigoError?: string
  detalleError?: string
}

function obtenerConfiguracionWhatsApp(): ConfiguracionWhatsApp {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0'
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME
  const templateLanguage =
    process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es_AR'

  if (!accessToken) {
    throw new Error('Falta WHATSAPP_ACCESS_TOKEN')
  }

  if (!phoneNumberId) {
    throw new Error('Falta WHATSAPP_PHONE_NUMBER_ID')
  }

  if (!templateName) {
    throw new Error('Falta WHATSAPP_TEMPLATE_NAME')
  }

  return {
    accessToken,
    phoneNumberId,
    graphApiVersion,
    templateName,
    templateLanguage,
  }
}

export function normalizarNumeroWhatsApp(numero: string): string {
  let limpio = numero.replace(/\D/g, '')

  // Argentina:
  // Si viene como 03482..., eliminamos el 0.
  if (limpio.startsWith('0')) {
    limpio = limpio.substring(1)
  }

  // Si viene como 549..., ya está correctamente preparado.
  if (limpio.startsWith('549')) {
    return limpio
  }

  // Si viene como 54..., agregamos el 9 para celular argentino.
  if (limpio.startsWith('54')) {
    const resto = limpio.substring(2)

    if (!resto.startsWith('9')) {
      return `549${resto}`
    }

    return limpio
  }

  // Si es un número argentino sin código de país.
  if (limpio.length >= 10) {
    if (limpio.startsWith('9')) {
      return `54${limpio}`
    }

    return `549${limpio}`
  }

  return limpio
}

async function subirDocumentoWhatsApp(
  pdf: Buffer,
  config: ConfiguracionWhatsApp
): Promise<string> {
  const url =
    `https://graph.facebook.com/` +
    `${config.graphApiVersion}/` +
    `${config.phoneNumberId}/media`

  const formData = new FormData()

  const blob = new Blob(
    [new Uint8Array(pdf)],
    {
      type: 'application/pdf',
    }
  )

  formData.append(
    'file',
    blob,
    'comprobante.pdf'
  )

  formData.append(
    'type',
    'application/pdf'
  )

  formData.append(
    'messaging_product',
    'whatsapp'
  )

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: formData,
  })

  const resultado = await response.json()

  if (!response.ok || !resultado.id) {
    const error = resultado?.error

    throw new Error(
      error?.message ||
      'WhatsApp rechazó la subida del PDF'
    )
  }

  return resultado.id
}

export async function enviarComprobanteWhatsApp({
  numero,
  nombreCliente,
  telefono,
  pdf,
}: {
  numero: string
  nombreCliente: string
  telefono: string
  pdf: Buffer
}): Promise<ResultadoWhatsApp> {
  try {
    const config = obtenerConfiguracionWhatsApp()

    const numeroNormalizado =
      normalizarNumeroWhatsApp(telefono)

    if (!numeroNormalizado) {
      return {
        success: false,
        codigoError: 'NUMERO_INVALIDO',
        detalleError: 'El número de WhatsApp está vacío o es inválido.',
      }
    }

    const mediaId = await subirDocumentoWhatsApp(
      pdf,
      config
    )

    const url =
      `https://graph.facebook.com/` +
      `${config.graphApiVersion}/` +
      `${config.phoneNumberId}/messages`

    const body = {
      messaging_product: 'whatsapp',
      to: numeroNormalizado,
      type: 'template',
      template: {
        name: config.templateName,
        language: {
          code: config.templateLanguage,
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'document',
                document: {
                  id: mediaId,
                  filename: `${numero}.pdf`,
                },
              },
            ],
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: nombreCliente,
              },
              {
                type: 'text',
                text: numero,
              },
            ],
          },
        ],
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const resultado = await response.json()

    if (!response.ok) {
      const error = resultado?.error

      return {
        success: false,
        codigoError:
          error?.code?.toString() ||
          'WHATSAPP_ERROR',
        detalleError:
          error?.message ||
          'WhatsApp rechazó el envío.',
      }
    }

    const messageId =
      resultado?.messages?.[0]?.id

    return {
      success: true,
      proveedorId: messageId,
    }
  } catch (error) {
    return {
      success: false,
      codigoError: 'WHATSAPP_EXCEPTION',
      detalleError:
        error instanceof Error
          ? error.message
          : 'Error desconocido al enviar por WhatsApp.',
    }
  }
}