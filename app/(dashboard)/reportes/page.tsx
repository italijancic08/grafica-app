import {
  obtenerResumenPeriodo, obtenerVentasPorRubro, obtenerRankingClientes, obtenerProductividad,
} from '@/lib/services/reportes'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import { formatearMoneda, fechaHoyArgentina } from '@/lib/utils/formato'
import FiltroFechas from './filtro-fechas'

function primerYUltimoDiaDelMesActual() {
  const hoy = fechaHoyArgentina()
  const [anio, mes] = hoy.split('-').map(Number)
  const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`
  const ultimoDiaNum = new Date(anio, mes, 0).getDate()
  const ultimoDia = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDiaNum).padStart(2, '0')}`
  return { primerDia, ultimoDia }
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  const params = await searchParams
  const { primerDia, ultimoDia } = primerYUltimoDiaDelMesActual()
  const desde = params.desde ?? primerDia
  const hasta = params.hasta ?? ultimoDia
  const filtros = { desde, hasta }

  const [
    { data: resumen, error: errorResumen },
    { data: ventasPorRubro, error: errorRubro },
    { data: ranking, error: errorRanking },
    { data: productividad, error: errorProductividad },
  ] = await Promise.all([
    obtenerResumenPeriodo(filtros),
    obtenerVentasPorRubro(filtros),
    obtenerRankingClientes(filtros),
    obtenerProductividad(filtros),
  ])

  const errorGeneral = errorResumen ?? errorRubro ?? errorRanking ?? errorProductividad
  const totalRubro = ventasPorRubro?.[0]?.total ?? 0
  const maxRubro = Math.max(totalRubro, 1)

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Reportes</h1>
      <p className="mb-6 text-sm text-gray-500">Ventas, cobros y productividad en el período seleccionado.</p>

      <FiltroFechas desde={desde} hasta={hasta} />

      {errorGeneral && <p className="mt-6 text-sm text-red-600">{errorGeneral}</p>}

      {!errorGeneral && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-xs font-medium text-gray-600">Total facturado</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{formatearMoneda(resumen?.totalFacturado ?? 0)}</p>
            </div>
            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-xs font-medium text-gray-600">Total cobrado</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{formatearMoneda(resumen?.totalCobrado ?? 0)}</p>
            </div>
            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-xs font-medium text-gray-600">Trabajos ingresados</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{resumen?.cantidadTrabajos ?? 0}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Ventas por rubro</h2>
            {ventasPorRubro?.length === 0 && <p className="text-sm text-gray-500">Sin trabajos en este período.</p>}
            {ventasPorRubro && ventasPorRubro.length > 0 && (
              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                {ventasPorRubro.map((f) => (
                  <div key={f.rubro} className="text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-gray-700">
                        {ETIQUETAS_RUBRO_TRABAJO[f.rubro as RubroTrabajo] ?? f.rubro}
                        <span className="ml-1 text-xs text-gray-400">({f.cantidad})</span>
                      </span>
                      <span className="font-medium text-gray-900">{formatearMoneda(f.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gray-800"
                        style={{ width: `${(f.total / maxRubro) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Ranking de clientes</h2>
              {ranking?.length === 0 && <p className="text-sm text-gray-500">Sin trabajos en este período.</p>}
              {ranking && ranking.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">Trabajos</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {ranking.map((c, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{c.nombre}</td>
                          <td className="px-4 py-2 text-right">{c.cantidad}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatearMoneda(c.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Productividad</h2>
              {productividad && productividad.total === 0 && (
                <p className="text-sm text-gray-500">Sin trabajos retirados con fecha máxima en este período.</p>
              )}
              {productividad && productividad.total > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <p className="text-2xl font-semibold text-gray-900">{productividad.porcentajeATiempo}%</p>
                    <p className="text-xs text-gray-500">entregados a tiempo</p>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-red-100">
                    <div className="h-2 bg-green-600" style={{ width: `${productividad.porcentajeATiempo}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">A tiempo</p>
                      <p className="font-medium text-green-700">{productividad.aTiempo}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Demorados</p>
                      <p className="font-medium text-red-600">{productividad.demorados}</p>
                    </div>
                  </div>
                  {productividad.demorados > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Promedio de demora: {productividad.promedioDiasDemora} día{productividad.promedioDiasDemora === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}