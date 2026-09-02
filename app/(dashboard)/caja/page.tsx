import { listarMovimientosDelMes } from '@/lib/services/caja'
import { obtenerCierreDelMes } from '@/lib/services/caja-mensual'
import { formatearMoneda, mesActualArgentina, nombreMesAnio } from '@/lib/utils/formato'
import FormularioMovimientoCaja from './formulario-movimiento'
import SelectorMes from './selector-mes'
import FilaMovimientoCaja from './fila-movimiento-caja'
import CierreMensualControl from './cierre-mensual'
import ExportarExcel from './exportar-excel'

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const mesFiltro = mes ?? mesActualArgentina()
  const [anioNum, mesNum] = mesFiltro.split('-').map(Number)
  const esMesActualOFuturo = mesFiltro >= mesActualArgentina()
  const esMesFuturo = mesFiltro > mesActualArgentina()

  const { data: movimientos, error } = await listarMovimientosDelMes(mesFiltro)
  const { data: cierre } = await obtenerCierreDelMes(mesNum, anioNum)
  const bloqueado = (cierre?.cerrado ?? false) || esMesFuturo

  const totalIngresos = movimientos?.filter((m) => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0) ?? 0
  const totalEgresos = movimientos?.filter((m) => m.tipo === 'egreso').reduce((acc, m) => acc + m.monto, 0) ?? 0

  const ingresosEfectivo = movimientos
    ?.filter((m) => m.tipo === 'ingreso' && m.medio_pago === 'efectivo')
    .reduce((acc, m) => acc + m.monto, 0) ?? 0
  const egresosEfectivo = movimientos
    ?.filter((m) => m.tipo === 'egreso' && m.medio_pago === 'efectivo')
    .reduce((acc, m) => acc + m.monto, 0) ?? 0
  const cajaFisica = ingresosEfectivo - egresosEfectivo

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Caja</h1>
        <div className="flex items-center gap-2">
          <ExportarExcel
            key={mesFiltro}
            movimientos={movimientos ?? []}
            mesFiltro={mesFiltro}
            totalIngresos={totalIngresos}
            totalEgresos={totalEgresos}
            cajaFisica={cajaFisica}
          />
          <SelectorMes mesActual={mesFiltro} />
        </div>
      </div>
      <p className="mb-6 text-sm text-gray-500">Caja de {nombreMesAnio(mesFiltro)}</p>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700">Ingresos (todas las formas)</p>
          <p className="text-lg font-semibold text-green-700">{formatearMoneda(totalIngresos)}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-700">Egresos (todas las formas)</p>
          <p className="text-lg font-semibold text-red-700">{formatearMoneda(totalEgresos)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-600">Caja física (solo efectivo)</p>
          <p className={`text-lg font-semibold ${cajaFisica >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatearMoneda(cajaFisica)}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <CierreMensualControl
          mes={mesNum}
          anio={anioNum}
          cierre={cierre ?? null}
          cajaFisica={cajaFisica}
          esMesActualOFuturo={esMesActualOFuturo}
        />
      </div>

      <FormularioMovimientoCaja bloqueado={bloqueado} />

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Día</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Tipo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Rubro</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Forma</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Concepto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Trabajo</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={7} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {movimientos?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-3 text-gray-500">Sin movimientos en este mes.</td></tr>
            )}
            {movimientos?.map((m) => (
              <FilaMovimientoCaja key={m.id} movimiento={m} bloqueado={bloqueado} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}