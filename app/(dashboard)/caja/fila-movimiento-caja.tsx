'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarMovimientoCaja } from '@/lib/services/caja'
import { ETIQUETAS_MEDIO_PAGO, type MedioPago } from '@/lib/types/pago'
import { ETIQUETAS_RUBRO, type Rubro, type MovimientoCaja, type TipoMovimientoCaja } from '@/lib/types/caja'
import { formatearMoneda, diaDelMes } from '@/lib/utils/formato'

export default function FilaMovimientoCaja({
  movimiento,
  bloqueado = false,
}: {
  movimiento: MovimientoCaja
  bloqueado?: boolean
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)

  const [tipo, setTipo] = useState<TipoMovimientoCaja>(movimiento.tipo)
  const [monto, setMonto] = useState(String(movimiento.monto))
  const [concepto, setConcepto] = useState(movimiento.concepto)
  const [medioPago, setMedioPago] = useState<MedioPago>(movimiento.medio_pago ?? 'efectivo')
  const [rubro, setRubro] = useState<Rubro>(movimiento.rubro ?? 'otros_varios')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await actualizarMovimientoCaja(movimiento.id, {
        tipo,
        monto: Number(monto),
        concepto,
        medio_pago: medioPago,
        rubro,
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
        <td colSpan={7} className="bg-gray-50 px-4 py-3">
          <form onSubmit={handleGuardar} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoMovimientoCaja)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="egreso">Egreso</option>
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
                {Object.entries(ETIQUETAS_RUBRO).map(([valor, etiqueta]) => (
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
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Monto</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Concepto</label>
              <input
                required
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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
              onClick={() => setEditando(false)}
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
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2">{diaDelMes(movimiento.fecha)}</td>
      <td className="px-4 py-2">
        <span className={movimiento.tipo === 'ingreso' ? 'text-green-700' : 'text-red-600'}>
          {movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
        </span>
      </td>
      <td className="px-4 py-2">{movimiento.rubro ? ETIQUETAS_RUBRO[movimiento.rubro] : '—'}</td>
      <td className="px-4 py-2">{movimiento.medio_pago ? ETIQUETAS_MEDIO_PAGO[movimiento.medio_pago] : '—'}</td>
      <td className="px-4 py-2">{movimiento.concepto}</td>
      <td className="px-4 py-2">{movimiento.trabajos?.numero ?? '—'}</td>
      <td className="px-4 py-2 text-right">
        <span className={`mr-3 font-medium ${movimiento.tipo === 'ingreso' ? 'text-green-700' : 'text-red-600'}`}>
          {movimiento.tipo === 'ingreso' ? '+' : '-'}{formatearMoneda(movimiento.monto)}
        </span>
        {!bloqueado && (
          <button
            onClick={() => setEditando(true)}
            className="text-xs font-medium text-gray-600 hover:underline"
          >
            Editar
          </button>
        )}
      </td>
    </tr>
  )
}