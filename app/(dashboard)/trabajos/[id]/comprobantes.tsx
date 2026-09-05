'use client'

import { useState } from 'react'
import { obtenerUrlDescargaComprobante } from '@/lib/services/facturas'
import { ETIQUETAS_TIPO_COMPROBANTE, type Factura } from '@/lib/types/factura'
import { formatearMoneda, formatearFecha } from '@/lib/utils/formato'

export default function SeccionComprobantes({ comprobantes }: { comprobantes: Factura[] }) {
  const [descargando, setDescargando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDescargar(factura: Factura) {
    if (!factura.archivo_pdf_url) return
    setError(null)
    setDescargando(factura.id)

    try {
      const resultado = await obtenerUrlDescargaComprobante(factura.archivo_pdf_url)
      if (resultado.error || !resultado.data) {
        setError(resultado.error ?? 'No se pudo generar el link de descarga')
        return
      }
      window.open(resultado.data, '_blank')
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setDescargando(null)
    }
  }

  if (comprobantes.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-gray-200 p-4">
      <h2 className="mb-2 text-sm font-semibold text-gray-900">Comprobantes</h2>
      <div className="divide-y divide-gray-200">
        {comprobantes.map((f) => (
          <div key={f.id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <span className="font-medium">{f.numero ?? '(sin número)'}</span>
              <span className="ml-2 text-gray-500">
                {ETIQUETAS_TIPO_COMPROBANTE[f.tipo_comprobante]} · {formatearFecha(f.fecha)} · {formatearMoneda(f.monto)}
              </span>
            </div>
            {f.archivo_pdf_url ? (
              <button
                onClick={() => handleDescargar(f)}
                disabled={descargando === f.id}
                className="text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
              >
                {descargando === f.id ? 'Generando link...' : 'Descargar PDF'}
              </button>
            ) : (
              <span className="text-xs text-gray-400">PDF no disponible</span>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}