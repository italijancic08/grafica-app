'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  cambiarEstadoTrabajo,
  finalizarTrabajo,
  notificarCliente,
} from '@/lib/services/trabajos'
import { TRANSICIONES_VALIDAS } from '@/lib/utils/estados-trabajo'
import { ETIQUETAS_ESTADO_OPERATIVO, type EstadoOperativo } from '@/lib/types/trabajo'

type Resultado = {
  error?: string
  avisoComprobante?: string
  [clave: string]: unknown
}

export default function CambiarEstado({
  trabajoId,
  estadoActual,
}: {
  trabajoId: string
  estadoActual: EstadoOperativo
  requiereTurno?: boolean
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avisoComprobante, setAvisoComprobante] = useState<string | null>(null)
  const [preguntandoNotificacion, setPreguntandoNotificacion] = useState(false)

  const opciones = TRANSICIONES_VALIDAS[estadoActual]
  const pendienteNotificacion = estadoActual === 'PENDIENTE_NOTIFICACION'

  async function ejecutar(accion: () => Promise<Resultado>) {
    setError(null)
    setAvisoComprobante(null)
    setCargando(true)

    try {
      const resultado = await accion()

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      if (resultado.avisoComprobante) {
        setAvisoComprobante(resultado.avisoComprobante)
      }

      setPreguntandoNotificacion(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  function alApretarEstado(estado: EstadoOperativo) {
    if (estado === 'FINALIZADO') {
      setError(null)
      setPreguntandoNotificacion(true)
      return
    }

    ejecutar(() => cambiarEstadoTrabajo(trabajoId, estado))
  }

  const hayAcciones = pendienteNotificacion || opciones.length > 0

  return (
    <div>
      {!hayAcciones && (
        <p className="text-sm text-gray-500">Este trabajo no admite más cambios de estado.</p>
      )}

      {hayAcciones && (
        <>
          <p className="mb-2 text-sm font-medium text-gray-700">
            {pendienteNotificacion ? 'El cliente todavía no fue notificado:' : 'Cambiar estado a:'}
          </p>

          <div className="flex flex-wrap gap-2">
            {pendienteNotificacion && (
              <button
                onClick={() => ejecutar(() => notificarCliente(trabajoId))}
                disabled={cargando}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Notificar al cliente'}
              </button>
            )}

            {opciones.map((estado) => (
              <button
                key={estado}
                onClick={() => alApretarEstado(estado)}
                disabled={cargando}
                className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                  estado === 'CANCELADO'
                    ? 'border border-red-300 text-red-700 hover:bg-red-50'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {estado === 'CANCELADO' ? 'Cancelar trabajo' : ETIQUETAS_ESTADO_OPERATIVO[estado]}
              </button>
            ))}
          </div>
        </>
      )}

      {preguntandoNotificacion && (
        <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="mb-3 text-sm font-medium text-yellow-900">¿Notificaste al cliente?</p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => ejecutar(() => finalizarTrabajo(trabajoId, true))}
              disabled={cargando}
              className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Sí'}
            </button>
            <button
              onClick={() => ejecutar(() => finalizarTrabajo(trabajoId, false))}
              disabled={cargando}
              className="rounded-md bg-yellow-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-yellow-800 disabled:opacity-50"
            >
              No
            </button>
            <button
              onClick={() => setPreguntandoNotificacion(false)}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>

          <p className="mt-3 text-xs text-yellow-800">
            Con &quot;Sí&quot; el trabajo queda finalizado, se guarda la fecha de notificación y se genera
            el recibo. Con &quot;No&quot; queda como &quot;Pendiente de notificación&quot; y sigue en la lista de trabajos.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {avisoComprobante && (
        <p className="mt-2 text-sm text-yellow-700">
          ⚠️ El cambio se guardó, pero no se pudo generar el recibo: {avisoComprobante}
        </p>
      )}
    </div>
  )
}