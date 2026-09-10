'use client'

import { generarYDescargarExcelCaja } from '@/lib/utils/excel-caja'
import type { MovimientoCaja } from '@/lib/types/caja'

export default function ExportarExcel({
  movimientos,
  mesFiltro,
  totalIngresos,
  totalEgresos,
  cajaFisica,
}: {
  movimientos: MovimientoCaja[]
  mesFiltro: string
  totalIngresos: number
  totalEgresos: number
  cajaFisica: number
}) {
  function handleExportar() {
    generarYDescargarExcelCaja(movimientos, mesFiltro, { totalIngresos, totalEgresos, cajaFisica })
  }

  return (
    <button
      onClick={handleExportar}
      disabled={movimientos.length === 0}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Descargar Excel
    </button>
  )
}