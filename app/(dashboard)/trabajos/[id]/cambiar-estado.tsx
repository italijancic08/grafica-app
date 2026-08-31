'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cambiarEstadoTrabajo } from '@/lib/services/trabajos'
import { TRANSICIONES_VALIDAS } from '@/lib/utils/estados-trabajo'
import { ETIQUETAS_ESTADO_OPERATIVO, type EstadoOperativo } from '@/lib/types/trabajo'
import { formatearMoneda } from '@/lib/utils/formato'

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
  const [avisoDeuda, setAvisoDeuda] = useState<{ saldo: number } | null>(null)

  const opciones = TRANSICIONES_VALIDAS[estadoActual]

  async function ejecutarCambio(nuevoEstado: EstadoOperativo, confirmarConDeuda = false) {
    setError(null)
    setCargando(true)

    try {
      const resultado = await cambiarEstadoTrabajo(trabajoId, nuevoEstado, confirmarConDeuda)

      if ('requiereConfirmacion' in resultado && resultado.requiereConfirmacion) {
        setAvisoDeuda({ saldo: resultado.saldo })
        return
      }

      if ('error' in resultado && resultado.error) {
        setError(resultado.error)
        return
      }

      setAvisoDeuda(null)
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
            onClick={() => ejecutarCambio(estado)}
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

      {avisoDeuda && (
        <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="mb-3 text-sm font-medium text-yellow-900">
            ⚠️ Este trabajo tiene un saldo pendiente de {formatearMoneda(avisoDeuda.saldo)}.
            Si lo marcás como retirado igual, va a seguir apareciendo en "Pendientes de pago"
            hasta que se salde.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => ejecutarCambio('RETIRADO', true)}
              disabled={cargando}
              className="rounded-md bg-yellow-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-800 disabled:opacity-50"
            >
              {cargando ? 'Confirmando...' : 'Retirar con deuda'}
            </button>
            <button
              onClick={() => setAvisoDeuda(null)}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}