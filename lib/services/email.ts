'use server'

import { Resend } from 'resend'

interface ResultadoEmail {
  success: boolean
  proveedorId?: string
  codigoError?: string
  detalleError?: string
}

function obtenerResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Falta RESEND_API_KEY')
  }

  return new Resend(apiKey)
}

function obtenerEmailRemitente(): string {
  const email = process.env.RESEND_FROM_EMAIL

  if (!email) {
    throw new Error('Falta RESEND_FROM_EMAIL')
  }

  return email
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function enviarComprobanteEmail({
  numero,
  nombreCliente,
  email,
  pdf,
}: {
  numero: string
  nombreCliente: string
  email: string
  pdf: Buffer
}): Promise<ResultadoEmail> {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        codigoError: 'EMAIL_INVALIDO',
        detalleError: 'La dirección de email no es válida.',
      }
    }

    const resend = obtenerResend()
    const from = obtenerEmailRemitente()

    const { data, error } =
      await resend.emails.send({
        from,
        to: [email],
        subject: `Comprobante ${numero}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Comprobante ${escaparHtml(numero)}</h2>

            <p>
              Hola ${escaparHtml(nombreCliente)},
            </p>

            <p>
              Adjuntamos el comprobante correspondiente
              a tu trabajo.
            </p>

            <p>
              Saludos.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `${numero}.pdf`,
            content: pdf,
          },
        ],
      })

    if (error) {
      return {
        success: false,
        codigoError: 'RESEND_ERROR',
        detalleError: error.message,
      }
    }

    return {
      success: true,
      proveedorId: data?.id,
    }
  } catch (error) {
    return {
      success: false,
      codigoError: 'EMAIL_EXCEPTION',
      detalleError:
        error instanceof Error
          ? error.message
          : 'Error desconocido al enviar el email.',
    }
  }
}