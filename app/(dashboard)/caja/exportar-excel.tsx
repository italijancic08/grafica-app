'use client'

import * as XLSX from 'xlsx'
import { ETIQUETAS_MEDIO_PAGO } from '@/lib/types/pago'
import { ETIQUETAS_RUBRO, type MovimientoCaja } from '@/lib/types/caja'
import { diaDelMes } from '@/lib/utils/formato'

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
    const filas: Record<string, string | number>[] = movimientos.map((m) => ({
      Día: diaDelMes(m.fecha),
      Tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
      Rubro: m.rubro ? ETIQUETAS_RUBRO[m.rubro] : '',
      Forma: m.medio_pago ? ETIQUETAS_MEDIO_PAGO[m.medio_pago] : '',
      Concepto: m.concepto,
      Trabajo: m.trabajos?.numero ?? '',
      Monto: m.tipo === 'ingreso' ? m.monto : -m.monto,
    }))

    filas.push({ Día: '', Tipo: '', Rubro: '', Forma: '', Concepto: '', Trabajo: '', Monto: '' })
    filas.push({ Día: '', Tipo: '', Rubro: '', Forma: '', Concepto: 'Total ingresos', Trabajo: '', Monto: totalIngresos })
    filas.push({ Día: '', Tipo: '', Rubro: '', Forma: '', Concepto: 'Total egresos', Trabajo: '', Monto: -totalEgresos })
    filas.push({ Día: '', Tipo: '', Rubro: '', Forma: '', Concepto: 'Caja física (solo efectivo)', Trabajo: '', Monto: cajaFisica })

    const hoja = XLSX.utils.json_to_sheet(filas)
    hoja['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 26 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 12 },
    ]

    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Caja')

    XLSX.writeFile(libro, `caja-${mesFiltro}.xlsx`)
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