'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarPago, eliminarPago } from '@/lib/services/pagos'
import { ETIQUETAS_MEDIO_PAGO, ETIQUETAS_TIPO_TARJETA, type MedioPago, type TipoTarjeta, type Pago } from '@/lib/types/pago'
import { formatearMoneda } from '@/lib/utils/formato'
import ComprobantePago from './comprobante-pago'

export default function FilaPago({
  pago,
  bloqueado = false,
  administrador = false,
}: {
  pago: Pago
  bloqueado?: boolean
  administrador?: boolean
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)

  const [importe, setImporte] = useState(String(pago.importe))
  const [medioPago, setMedioPago] = useState<MedioPago>(pago.medio_pago)
  const [tipoTarjeta, setTipoTarjeta] = useState<TipoTarjeta>(
    pago.medio_pago === 'tarjeta' ? (pago.detalle_medio_pago as TipoTarjeta) : 'debito'
  )
  const [otroDetalle, setOtroDetalle] = useState(pago.medio_pago === 'otro' ? pago.detalle_medio_pago ?? '' : '')
  const [observacion, setObservacion] = useState(pago.observacion ?? '')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  async function handleEliminar() {
    setErrorEliminar(null)
    setEliminando(true)

    try {
      const resultado = await eliminarPago(pago.id)

      if (resultado.error) {
        setErrorEliminar(resultado.error)
        setConfirmandoEliminar(false)
        return
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      setErrorEliminar('Ocurrió un error inesperado.')
      setConfirmandoEliminar(false)
    } finally {
      setEliminando(false)
    }
  }

  function handleCancelar() {
    setImporte(String(pago.importe))
    setMedioPago(pago.medio_pago)
    setOtroDetalle(pago.medio_pago === 'otro' ? pago.detalle_medio_pago ?? '' : '')
    setObservacion(pago.observacion ?? '')
    setError(null)
    setEditando(false)
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const detalleMedioPago =
      medioPago === 'tarjeta' ? tipoTarjeta :
      medioPago === 'otro' ? otroDetalle :
      undefined

    try {
      const resultado = await actualizarPago(pago.id, {
        importe: Number(importe),
        medio_pago: medioPago,
        detalle_medio_pago: detalleMedioPago,
        observacion,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setEditando(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  if (editando) {
    return (
      <tr>
        <td colSpan={4} className="bg-gray-50 px-3 py-3">
          <form onSubmit={handleGuardar} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Importe</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Medio de pago</label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value as MedioPago)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {Object.entries(ETIQUETAS_MEDIO_PAGO).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
            </div>

            {medioPago === 'tarjeta' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
                <select
                  value={tipoTarjeta}
                  onChange={(e) => setTipoTarjeta(e.target.value as TipoTarjeta)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  {Object.entries(ETIQUETAS_TIPO_TARJETA).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                  ))}
                </select>
              </div>
            )}

            {medioPago === 'otro' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Especificar</label>
                <input
                  required
                  value={otroDetalle}
                  onChange={(e) => setOtroDetalle(e.target.value)}
                  placeholder="Ej: cheque, criptomoneda..."
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Observación</label>
              <input
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleCancelar}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td className="px-3 py-1.5">{pago.fecha}</td>
      <td className="px-3 py-1.5 font-medium">{formatearMoneda(pago.importe)}</td>
      <td className="px-3 py-1.5">
        {ETIQUETAS_MEDIO_PAGO[pago.medio_pago]}
        {pago.detalle_medio_pago && pago.medio_pago === 'tarjeta' && ` (${ETIQUETAS_TIPO_TARJETA[pago.detalle_medio_pago as TipoTarjeta]})`}
        {pago.detalle_medio_pago && pago.medio_pago === 'otro' && ` (${pago.detalle_medio_pago})`}
        {pago.medio_pago === 'transferencia' && <ComprobantePago pago={pago} />}
      </td>
      <td className="px-3 py-1.5 text-gray-500">
        <div className="flex items-center justify-between gap-2">
          <span>{pago.observacion ?? '—'}</span>
          {!bloqueado && (
            confirmandoEliminar ? (
              <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs">
                <span className="text-gray-600">¿Eliminar pago?</span>
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={eliminando}
                  className="font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(false)}
                  disabled={eliminando}
                  className="font-medium text-gray-900 hover:underline disabled:opacity-50"
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <span className="whitespace-nowrap">
                <button
                  onClick={() => setEditando(true)}
                  className="text-xs font-medium text-gray-600 hover:underline"
                >
                  Editar
                </button>
                {administrador && (
                  <button
                    onClick={() => setConfirmandoEliminar(true)}
                    className="ml-3 text-xs font-medium text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                )}
              </span>
            )
          )}
        </div>
        {errorEliminar && <p className="mt-1 text-xs text-red-600">{errorEliminar}</p>}
      </td>
    </tr>
  )
}