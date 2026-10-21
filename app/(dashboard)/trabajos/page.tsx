import Link from 'next/link'
import { listarTrabajos } from '@/lib/services/trabajos'
import { ESTADOS_DE_TRABAJO } from '@/lib/utils/estados-trabajo'
import { ETIQUETAS_ESTADO_OPERATIVO, ETIQUETAS_ESTADO_FINANCIERO } from '@/lib/types/trabajo'
import { formatearMoneda, formatearFecha } from '@/lib/utils/formato'

function badgeFinanciero(estado: string) {
  const colores: Record<string, string> = {
    SIN_PAGAR: 'bg-red-100 text-red-700',
    PAGO_PARCIAL: 'bg-yellow-100 text-yellow-700',
    PAGADO: 'bg-green-100 text-green-700',
  }
  return colores[estado] ?? 'bg-gray-100 text-gray-700'
}

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  // Si el parámetro no es un estado válido, se muestran todos
  const estadoFiltro = ESTADOS_DE_TRABAJO.find((e) => e === estado) ?? null

  // Los presupuestos y rechazados se ven en /presupuestos
  const { data: todos, error } = await listarTrabajos(ESTADOS_DE_TRABAJO)
  const trabajos = estadoFiltro
    ? todos?.filter((t) => t.estado_operativo === estadoFiltro)
    : todos

  const cantidad = (e: string) =>
    todos?.filter((t) => t.estado_operativo === e).length ?? 0

  const pastilla = (activo: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      activo ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Trabajos</h1>
        <Link
          href="/trabajos/nuevo"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Nuevo presupuesto
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/trabajos" className={pastilla(!estadoFiltro)}>
          Todos ({todos?.length ?? 0})
        </Link>
        {ESTADOS_DE_TRABAJO.map((e) => (
          <Link key={e} href={`/trabajos?estado=${e}`} className={pastilla(estadoFiltro === e)}>
            {ETIQUETAS_ESTADO_OPERATIVO[e]} ({cantidad(e)})
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Número</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Pago</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Precio</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Saldo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Plazo de entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={8} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {trabajos?.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-3 text-gray-500">{estadoFiltro ? 'No hay trabajos en este estado.' : 'Sin trabajos todavía.'}</td></tr>
            )}
            {trabajos?.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trabajos/${t.id}`} className="hover:underline">{t.numero}</Link>
                </td>
                <td className="px-4 py-2">
                  {t.clientes?.nombre_razon_social}
                  {t.empresas_clientes && (
                    <span className="block text-xs text-gray-400">por parte de {t.empresas_clientes.nombre}</span>
                  )}
                </td>
                <td className="px-4 py-2 max-w-xs truncate">{t.descripcion}</td>
                <td className="px-4 py-2">{ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeFinanciero(t.estado_financiero)}`}>
                    {ETIQUETAS_ESTADO_FINANCIERO[t.estado_financiero as keyof typeof ETIQUETAS_ESTADO_FINANCIERO]}
                  </span>
                </td>
                <td className="px-4 py-2">{formatearMoneda(t.precio_final)}</td>
                <td className={`px-4 py-2 ${t.saldo > 0 ? 'text-red-600 font-medium' : ''}`}>
                  {formatearMoneda(t.saldo)}
                </td>
                <td className="px-4 py-2">{formatearFecha(t.fecha_maxima)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}