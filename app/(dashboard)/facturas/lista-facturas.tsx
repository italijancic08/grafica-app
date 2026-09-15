'use client'

import { useState } from 'react'
import { obtenerUrlDescargaComprobante } from '@/lib/services/facturas'
import {
  ETIQUETAS_TIPO_COMPROBANTE,
  type Factura,
} from '@/lib/types/factura'
import {
  formatearMoneda,
  formatearFecha,
} from '@/lib/utils/formato'

type FacturaConRelaciones = Factura & {
  trabajos:
    | { numero: string }
    | { numero: string }[]
    | null
  clientes:
    | { nombre_razon_social: string }
    | { nombre_razon_social: string }[]
    | null
}

function obtenerEstadoEnvio(factura: Factura) {
  switch (factura.estado_envio) {
    case 'ENVIADO_WHATSAPP':
      return {
        texto: 'Enviado por WhatsApp',
        clase:
          'bg-green-100 text-green-700',
      }

    case 'ENVIADO_EMAIL':
      return {
        texto: 'Enviado por email',
        clase:
          'bg-blue-100 text-blue-700',
      }

    case 'NO_ENVIADO':
      return {
        texto: 'No enviado',
        clase:
          'bg-red-100 text-red-700',
      }

    case 'PENDIENTE':
    default:
      return {
        texto: 'Pendiente',
        clase:
          'bg-yellow-100 text-yellow-700',
      }
  }
}

export default function ListaFacturas({
  facturas,
}: {
  facturas: FacturaConRelaciones[]
}) {
  const [descargando, setDescargando] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  async function handleDescargar(
    factura: Factura
  ) {
    if (!factura.archivo_pdf_url) return

    setError(null)
    setDescargando(factura.id)

    try {
      const resultado =
        await obtenerUrlDescargaComprobante(
          factura.archivo_pdf_url
        )

      if (
        resultado.error ||
        !resultado.data
      ) {
        setError(
          resultado.error ??
            'No se pudo generar el link de descarga'
        )
        return
      }

      window.open(
        resultado.data,
        '_blank'
      )
    } catch (err) {
      console.error(err)

      setError(
        'Ocurrió un error inesperado.'
      )
    } finally {
      setDescargando(null)
    }
  }

  if (facturas.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Todavía no se generó ningún comprobante.
      </p>
    )
  }

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {facturas.map((f) => {
        const trabajo = Array.isArray(
          f.trabajos
        )
          ? f.trabajos[0]
          : f.trabajos

        const cliente = Array.isArray(
          f.clientes
        )
          ? f.clientes[0]
          : f.clientes

        const estado =
          obtenerEstadoEnvio(f)

        return (
          <div
            key={f.id}
            className="flex items-center justify-between gap-4 p-3 text-sm"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {f.numero ??
                    '(sin número)'}
                </p>

                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${estado.clase}`}
                >
                  {estado.texto}
                </span>
              </div>

              <p className="text-xs text-gray-500">
                {
                  ETIQUETAS_TIPO_COMPROBANTE[
                    f.tipo_comprobante
                  ]
                }
                {' · '}
                {formatearFecha(f.fecha)}
                {' · '}
                {formatearMoneda(f.monto)}

                {cliente &&
                  ` · ${cliente.nombre_razon_social}`}

                {trabajo &&
                  ` · ${trabajo.numero}`}
              </p>

              {f.estado_envio ===
                'ENVIADO_EMAIL' &&
                f.error_envio && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Enviado por email como
                    alternativa.
                  </p>
                )}

              {f.estado_envio ===
                'NO_ENVIADO' &&
                f.error_envio && (
                  <p className="mt-1 max-w-xl text-[11px] text-red-500">
                    {f.error_envio}
                  </p>
                )}
            </div>

            {f.archivo_pdf_url ? (
              <button
                onClick={() =>
                  handleDescargar(f)
                }
                disabled={
                  descargando === f.id
                }
                className="whitespace-nowrap text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
              >
                {descargando === f.id
                  ? 'Generando link...'
                  : 'Descargar PDF'}
              </button>
            ) : (
              <span className="whitespace-nowrap text-xs text-gray-400">
                PDF no disponible
              </span>
            )}
          </div>
        )
      })}

      {error && (
        <p className="p-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}