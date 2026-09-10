'use client'

import { useState } from 'react'
import { listarMovimientosDelMes } from '@/lib/services/caja'
import { generarYDescargarExcelCaja } from '@/lib/utils/excel-caja'
import { nombreMesAnio } from '@/lib/utils/formato'

export default function DescargarExcelMes({ mes }: { mes: string }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDescargar() {
    setError(null)
    setCargando(true)

    try {
      const { data: movimientos, error: errorMovs } = await listarMovimientosDelMes(mes)
      if (errorMovs || !movimientos) {
        setError(errorMovs ?? 'No se pudieron cargar los movimientos de ese mes')
        return
      }

      const totalIngresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0)
      const totalEgresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((acc, m) => acc + m.monto, 0)
      const ingresosEfectivo = movimientos
        .filter((m) => m.tipo === 'ingreso' && m.medio_pago === 'efectivo')
        .reduce((acc, m) => acc + m.monto, 0)
      const egresosEfectivo = movimientos
        .filter((m) => m.tipo === 'egreso' && m.medio_pago === 'efectivo')
        .reduce((acc, m) => acc + m.monto, 0)

      generarYDescargarExcelCaja(movimientos, mes, {
        totalIngresos,
        totalEgresos,
        cajaFisica: ingresosEfectivo - egresosEfectivo,
      })
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2 text-sm last:border-0">
      <span className="capitalize text-gray-700">{nombreMesAnio(mes)}</span>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleDescargar}
          disabled={cargando}
          className="text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
        >
          {cargando ? 'Generando...' : 'Descargar Excel'}
        </button>
      </div>
    </div>
  )
}