'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aceptarPresupuesto, rechazarPresupuesto } from '@/lib/services/trabajos'

export default function AccionesPresupuesto({
  trabajoId,
  precioFinal,
  tieneRubro,
}: {
  trabajoId: string
  precioFinal: number
  tieneRubro: boolean
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const faltantes: string[] = []
  if (!(precioFinal > 0)) faltantes.push('un precio mayor a $0')
  if (!tieneRubro) faltantes.push('el rubro')
  const puedeAceptar = faltantes.length === 0

  async function handleAceptar() {
    setError(null)
    setCargando(true)
    try {
      const resultado = await aceptarPresupuesto(trabajoId)
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

  async function handleRechazar() {
    setError(null)
    setCargando(true)
    try {
      const resultado = await rechazarPresupuesto(trabajoId)
      if (resultado.error) {
        setError(resultado.error)
        return
      }
      router.push('/presupuestos')
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">Respuesta del cliente</p>
      <p className="mb-3 text-xs text-gray-500">
        Si el cliente acepta, el presupuesto pasa a ser un trabajo y sigue el flujo normal.
        Si lo rechaza, se descarta.
      </p>

      {!puedeAceptar && (
        <p className="mb-3 text-sm text-yellow-700">
          Para aceptarlo, primero cargá {faltantes.join(' y ')} (botón &quot;Editar&quot;).
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAceptar}
          disabled={cargando || !puedeAceptar}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando ? 'Procesando...' : 'Aceptar presupuesto'}
        </button>

        {!confirmandoRechazo ? (
          <button
            onClick={() => setConfirmandoRechazo(true)}
            disabled={cargando}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Rechazar
          </button>
        ) : (
          <>
            <button
              onClick={handleRechazar}
              disabled={cargando}
              className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
            <button
              onClick={() => setConfirmandoRechazo(false)}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}