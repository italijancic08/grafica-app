'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarMovimientoManual } from '@/lib/services/caja'
import { ETIQUETAS_MEDIO_PAGO, type MedioPago } from '@/lib/types/pago'
import { ETIQUETAS_RUBRO, type Rubro, type TipoMovimientoCaja } from '@/lib/types/caja'

export default function FormularioMovimientoCaja({ bloqueado = false }: { bloqueado?: boolean }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoMovimientoCaja>('egreso')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo')
  const [rubro, setRubro] = useState<Rubro>('otros_varios')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await registrarMovimientoManual({
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

      setMonto('')
      setConcepto('')
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
          onChange={(e) => setTipo(e.target.value as TipoMovimientoCaja)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="egreso">Egreso (gasto)</option>
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
          className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
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