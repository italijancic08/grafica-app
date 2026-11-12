
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  aceptarPresupuesto,
  rechazarPresupuesto,
  marcarPresupuestoEnviado,
} from '@/lib/services/trabajos'
import { fechaHoyArgentina, formatearFecha } from '@/lib/utils/formato'
import { presupuestoArchivado } from '@/lib/utils/estado-presupuesto'

export default function AccionesPresupuesto({
  trabajoId,
  precioFinal,
  tieneRubro,
  permiteTrabajosGratis,
  fechaEnvio,
}: {
  trabajoId: string
  precioFinal: number
  tieneRubro: boolean
  permiteTrabajosGratis: boolean
  fechaEnvio: string | null
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fechaEnvioInput, setFechaEnvioInput] = useState(fechaHoyArgentina())

  const archivado = presupuestoArchivado(fechaEnvio)

  async function guardarEnvio(fecha: string | null) {
    setError(null)
    setCargando(true)

    try {
      const resultado = await marcarPresupuestoEnviado(trabajoId, fecha)

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

  const esGratuito = precioFinal === 0 && permiteTrabajosGratis

  const faltantes: string[] = []

  if (!(precioFinal > 0) && !esGratuito) {
    faltantes.push(
      'un precio mayor a $0 o una autorización para trabajos gratuitos'
    )
  }

  if (!tieneRubro) {
    faltantes.push('el rubro')
  }

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
      <div className="mb-5 rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-sm font-medium text-gray-700">Envío del presupuesto</p>

        {fechaEnvio ? (
          <>
            <p className="text-sm text-gray-900">
              Presupuesto enviado el{' '}
              <span className="font-semibold">{formatearFecha(fechaEnvio)}</span>
            </p>

            {archivado && (
              <p className="mt-1 text-xs text-yellow-700">
                Pasaron más de 10 días sin respuesta: está archivado y ya no se lista en
                Presupuestos. Si el cliente confirma, igual podés aceptarlo desde acá.
              </p>
            )}

            <button
              type="button"
              onClick={() => guardarEnvio(null)}
              disabled={cargando}
              className="mt-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50"
            >
              Quitar envío
            </button>
          </>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Fecha de envío</label>
              <input
                type="date"
                value={fechaEnvioInput}
                onChange={(e) => setFechaEnvioInput(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => guardarEnvio(fechaEnvioInput)}
              disabled={cargando || !fechaEnvioInput}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Marcar presupuesto enviado'}
            </button>
          </div>
        )}
      </div>

      <p className="mb-1 text-sm font-medium text-gray-700">
        Respuesta del cliente
      </p>

      <p className="mb-3 text-xs text-gray-500">
        Si el cliente acepta, el presupuesto pasa a ser un trabajo
        y sigue el flujo normal. Si lo rechaza, se descarta.
      </p>

      {esGratuito && (
        <p className="mb-3 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
          Trabajo gratuito autorizado. Este presupuesto puede
          aceptarse con un precio final de $0.
        </p>
      )}

      {!puedeAceptar && (
        <p className="mb-3 text-sm text-yellow-700">
          Para aceptarlo, primero cargá {faltantes.join(' y ')}
          {' '}(botón &quot;Editar&quot;).
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

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
