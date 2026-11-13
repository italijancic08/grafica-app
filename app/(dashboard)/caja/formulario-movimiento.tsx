'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarMovimientoManual } from '@/lib/services/caja'
import { subirComprobanteMovimientoCaja } from '@/lib/utils/subir-comprobante-caja'
import { ETIQUETAS_MEDIO_PAGO, type MedioPago } from '@/lib/types/pago'
import {
  ETIQUETAS_RUBRO,
  ETIQUETAS_RUBRO_EGRESO,
  RUBROS_EGRESO,
  RUBROS_EGRESO_SOLO_ADMIN,
  RUBROS_NUEVOS_SOLO_EGRESO,
  type Rubro,
  type TipoMovimientoCaja,
} from '@/lib/types/caja'
import { formatearMoneda } from '@/lib/utils/formato'

export default function FormularioMovimientoCaja({
  bloqueado = false,
  administrador = false,
}: {
  bloqueado?: boolean
  administrador?: boolean
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoMovimientoCaja>('egreso')
  const [monto, setMonto] = useState('')
  const [montoEfectivo, setMontoEfectivo] = useState('')
  const [montoTransferencia, setMontoTransferencia] = useState('')
  const [concepto, setConcepto] = useState('')
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo')
  const [rubro, setRubro] = useState<Rubro>('compras')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [claveArchivo, setClaveArchivo] = useState(0)

  const esMixto = medioPago === 'mixto'
  const esEgreso = tipo === 'egreso'
  const totalMixto = (Number(montoEfectivo) || 0) + (Number(montoTransferencia) || 0)
  const mostrarComprobante = esEgreso || medioPago === 'transferencia' || esMixto

  // Rubros disponibles: las salidas tienen una lista propia; los ingresos
  // conservan la lista de siempre (sin los rubros nuevos de gastos).
  const opcionesRubro: [string, string][] = esEgreso
    ? [...RUBROS_EGRESO, ...(administrador ? RUBROS_EGRESO_SOLO_ADMIN : [])].map((r) => [
        r,
        ETIQUETAS_RUBRO_EGRESO[r] ?? ETIQUETAS_RUBRO[r],
      ])
    : Object.entries(ETIQUETAS_RUBRO).filter(
        ([valor]) => !RUBROS_NUEVOS_SOLO_EGRESO.includes(valor as Rubro)
      )

  function alCambiarTipo(nuevoTipo: TipoMovimientoCaja) {
    setTipo(nuevoTipo)
    setRubro(nuevoTipo === 'egreso' ? 'compras' : 'otros_varios')
  }

  // Sube el comprobante (si hay) y registra un movimiento.
  // Devuelve un mensaje de error, o null si salió bien.
  async function crearMovimiento(
    montoMovimiento: number,
    medio: MedioPago,
    conceptoMovimiento: string
  ): Promise<string | null> {
    const id = crypto.randomUUID()
    let comprobanteUrl: string | undefined

    if (archivo && (esEgreso || medio === 'transferencia')) {
      const subida = await subirComprobanteMovimientoCaja(id, archivo)
      if (subida.error || !subida.ruta) {
        return subida.error ?? 'No se pudo subir el comprobante.'
      }
      comprobanteUrl = subida.ruta
    }

    const resultado = await registrarMovimientoManual({
      id,
      tipo,
      monto: montoMovimiento,
      concepto: conceptoMovimiento,
      medio_pago: medio,
      rubro,
      comprobante_url: comprobanteUrl,
    })

    return resultado.error ?? null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (esMixto && !(Number(montoEfectivo) > 0 && Number(montoTransferencia) > 0)) {
      setError('En un pago mixto ingresá tanto el importe en efectivo como el de transferencia.')
      return
    }

    // El pago mixto se guarda como dos movimientos: uno en efectivo y otro por transferencia
    const partes: { medio: MedioPago; monto: number; concepto: string }[] = esMixto
      ? [
          { medio: 'efectivo', monto: Number(montoEfectivo), concepto: `${concepto} (pago mixto: efectivo)` },
          { medio: 'transferencia', monto: Number(montoTransferencia), concepto: `${concepto} (pago mixto: transferencia)` },
        ]
      : [{ medio: medioPago, monto: Number(monto), concepto }]

    setCargando(true)

    try {
      for (let i = 0; i < partes.length; i++) {
        const mensaje = await crearMovimiento(partes[i].monto, partes[i].medio, partes[i].concepto)

        if (mensaje) {
          setError(
            i > 0
              ? `Se registró la primera parte (${ETIQUETAS_MEDIO_PAGO[partes[0].medio]}), pero falló la segunda: ${mensaje} Cargá manualmente la que falta.`
              : mensaje
          )
          router.refresh()
          return
        }
      }

      setMonto('')
      setMontoEfectivo('')
      setMontoTransferencia('')
      setConcepto('')
      setArchivo(null)
      setClaveArchivo((n) => n + 1)
      setAbierto(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  if (bloqueado) {
    return (
      <p className="text-sm text-gray-500">
        No se pueden cargar movimientos manuales en este mes.
      </p>
    )
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Movimiento manual
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => alCambiarTipo(e.target.value as TipoMovimientoCaja)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="egreso">Egreso (salida de dinero)</option>
          <option value="ingreso">Ingreso</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Rubro</label>
        <select
          value={rubro}
          onChange={(e) => setRubro(e.target.value as Rubro)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          {opcionesRubro.map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>{etiqueta}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Forma</label>
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

      {esMixto ? (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Efectivo</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={montoEfectivo}
              onChange={(e) => setMontoEfectivo(e.target.value)}
              className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Transferencia</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={montoTransferencia}
              onChange={(e) => setMontoTransferencia(e.target.value)}
              className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <p className="pb-2 text-sm text-gray-600">
            Total: <span className="font-semibold">{formatearMoneda(totalMixto)}</span>
          </p>
        </>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Monto</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Concepto</label>
        <input
          required
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Ej: Alquiler, compra de insumos..."
          className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      {mostrarComprobante && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Comprobante (RC){' '}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            key={claveArchivo}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="block w-56 text-xs text-gray-600 file:mr-2 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-gray-700"
          />
          {esEgreso && !archivo && (
            <p className="mt-1 w-56 text-xs text-yellow-700">
              Sin comprobante quedará una alerta en Notificaciones hasta que lo adjuntes.
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {cargando ? 'Guardando...' : 'Registrar'}
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancelar
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}