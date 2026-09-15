'use client'

import { useState } from 'react'
import {
  obtenerUrlExcelLiquidacion,
} from '@/lib/services/liquidaciones'

export default function DescargarLiquidacionDocumento({
  liquidacionId,
}: {
  liquidacionId: string
}) {
  const [cargando, setCargando] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function descargar() {
    setCargando(true)
    setError(null)

    try {
      const resultado =
        await obtenerUrlExcelLiquidacion(
          liquidacionId
        )

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      if (resultado.data) {
        window.open(
          resultado.data,
          '_blank',
          'noopener,noreferrer'
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        'No se pudo descargar el documento.'
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={descargar}
        disabled={cargando}
        className="text-xs font-medium text-gray-700 hover:underline disabled:opacity-50"
      >
        {cargando
          ? 'Preparando...'
          : 'Descargar Excel'}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}