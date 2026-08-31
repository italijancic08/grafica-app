'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cambiarEstadoTrabajo } from '@/lib/services/trabajos'
import { TRANSICIONES_VALIDAS } from '@/lib/utils/estados-trabajo'
import { ETIQUETAS_ESTADO_OPERATIVO, type EstadoOperativo } from '@/lib/types/trabajo'

export default function CambiarEstado({
  trabajoId,
  estadoActual,
}: {
  trabajoId: string
  estadoActual: EstadoOperativo
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const opciones = TRANSICIONES_VALIDAS[estadoActual]

  async function handleCambiar(nuevoEstado: EstadoOperativo) {
    setError(null)
    setCargando(true)

    try {
      const resultado = await cambiarEstadoTrabajo(trabajoId, nuevoEstado)
      if (resultado.error) {
        setError(resultado.error)
        return
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  if (opciones.length === 0) {
    return <p className="text-sm text-gray-500">Este trabajo no admite más cambios de estado.</p>
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">Cambiar estado a:</p>
      <div className="flex flex-wrap gap-2">
        {opciones.map((estado) => (
          <button
            key={estado}
            onClick={() => handleCambiar(estado)}
            disabled={cargando}
            className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              estado === 'CANCELADO'
                ? 'border border-red-300 text-red-700 hover:bg-red-50'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {ETIQUETAS_ESTADO_OPERATIVO[estado]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}