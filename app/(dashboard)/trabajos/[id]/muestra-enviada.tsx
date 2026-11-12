'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { marcarMuestraEnviada } from '@/lib/services/trabajos'
import { fechaHoyArgentina, formatearFecha } from '@/lib/utils/formato'

export default function MuestraEnviada({
  trabajoId,
  fechaMuestra,
  editable,
}: {
  trabajoId: string
  fechaMuestra: string | null
  editable: boolean
}) {
  const router = useRouter()
  const [fecha, setFecha] = useState(fechaMuestra ?? fechaHoyArgentina())
  const [cambiando, setCambiando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(nuevaFecha: string | null) {
    setError(null)
    setCargando(true)

    try {
      const resultado = await marcarMuestraEnviada(trabajoId, nuevaFecha)

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setCambiando(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  const mostrarFormulario = editable && (!fechaMuestra || cambiando)

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="mb-2 text-sm font-medium text-gray-700">Muestra</p>

      {fechaMuestra && !cambiando && (
        <p className="text-sm text-gray-900">
          Muestra enviada el <span className="font-semibold">{formatearFecha(fechaMuestra)}</span>
        </p>
      )}

      {!fechaMuestra && !editable && (
        <p className="text-sm text-gray-500">No se envió muestra.</p>
      )}

      {!fechaMuestra && editable && !cambiando && (
        <p className="mb-2 text-sm text-gray-500">Todavía no se envió muestra.</p>
      )}

      {mostrarFormulario && (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Fecha de envío</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => guardar(fecha)}
            disabled={cargando || !fecha}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Marcar muestra enviada'}
          </button>

          {cambiando && (
            <button
              type="button"
              onClick={() => setCambiando(false)}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {fechaMuestra && editable && !cambiando && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setCambiando(true)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cambiar fecha
          </button>
          <button
            type="button"
            onClick={() => guardar(null)}
            disabled={cargando}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Quitar
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}