'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarPago, adjuntarComprobantePago } from '@/lib/services/pagos'
import { subirComprobantePago } from '@/lib/utils/subir-comprobante-pago'
import { ETIQUETAS_MEDIO_PAGO, ETIQUETAS_TIPO_TARJETA, type MedioPago, type TipoTarjeta, type Pago } from '@/lib/types/pago'
import FilaPago from './fila-pago'

export default function SeccionPagos({
  trabajoId,
  clienteId,
  saldo,
  pagos,
  mesesCerrados = [],
}: {
  trabajoId: string
  clienteId: string
  saldo: number
  pagos: Pago[]
  mesesCerrados?: string[]
}) {
  const router = useRouter()
  const [importe, setImporte] = useState('')
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo')
  const [tipoTarjeta, setTipoTarjeta] = useState<TipoTarjeta>('debito')
  const [otroDetalle, setOtroDetalle] = useState('')
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [claveArchivo, setClaveArchivo] = useState(0)

  const cantidadSinComprobante = pagos.filter(
    (p) => p.medio_pago === 'transferencia' && !p.comprobante_url && !p.comprobante_exento
  ).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const detalleMedioPago =
      medioPago === 'tarjeta' ? tipoTarjeta :
      medioPago === 'otro' ? otroDetalle :
      undefined

    try {
      const resultado = await registrarPago({
        trabajo_id: trabajoId,
        cliente_id: clienteId,
        importe: Number(importe),
        medio_pago: medioPago,
        detalle_medio_pago: detalleMedioPago,
        observacion,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      // El comprobante es opcional: si falla la subida, el pago ya quedó
      // registrado y se puede adjuntar después desde la lista de pagos.
      let avisoComprobante: string | null = null
      if (medioPago === 'transferencia' && archivo && resultado.data) {
        const subida = await subirComprobantePago(trabajoId, resultado.data.id, archivo)
        if (subida.error || !subida.ruta) {
          avisoComprobante = subida.error ?? 'No se pudo subir el archivo.'
        } else {
          const adjuntado = await adjuntarComprobantePago(resultado.data.id, subida.ruta)
          if (adjuntado.error) avisoComprobante = adjuntado.error
        }
      }

      setImporte('')
      setObservacion('')
      setOtroDetalle('')
      setArchivo(null)
      setClaveArchivo((n) => n + 1)
      if (avisoComprobante) {
        setError(`El pago se registró, pero no se pudo adjuntar el comprobante: ${avisoComprobante} Podés adjuntarlo desde la lista de pagos.`)
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Pagos</h2>

      {cantidadSinComprobante > 0 && (
        <p className="mb-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          ⚠️ {cantidadSinComprobante === 1
            ? 'Hay 1 transferencia sin comprobante cargado.'
            : `Hay ${cantidadSinComprobante} transferencias sin comprobante cargado.`}{' '}
          Podés adjuntarlo desde la lista de pagos.
        </p>
      )}

      {saldo > 0 ? (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Importe</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              placeholder={`Máx. ${saldo}`}
              className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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
              placeholder={medioPago === 'mixto' ? 'Ej: $500 efectivo + $300 transf.' : undefined}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          {medioPago === 'transferencia' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Comprobante <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                key={claveArchivo}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="block w-56 text-xs text-gray-600 file:mr-2 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-gray-700"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {cargando ? 'Registrando...' : 'Registrar pago'}
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="mb-4 text-sm text-green-700">Este trabajo ya está pagado en su totalidad.</p>
      )}

      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500">Fecha</th>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500">Importe</th>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500">Medio</th>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500">Observación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {pagos.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-2 text-gray-500">Sin pagos registrados.</td></tr>
          )}
          {pagos.map((p) => (
            <FilaPago
              key={p.id}
              pago={p}
              bloqueado={mesesCerrados.includes(p.fecha.slice(0, 7))}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}