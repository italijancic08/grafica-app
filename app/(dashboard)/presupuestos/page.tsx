import Link from 'next/link'
import { listarTrabajos } from '@/lib/services/trabajos'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import { formatearMoneda, formatearFecha } from '@/lib/utils/formato'

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const { ver } = await searchParams
  const verRechazados = ver === 'rechazados'

  const { data: presupuestos, error } = await listarTrabajos([
    verRechazados ? 'RECHAZADO' : 'PRESUPUESTO',
  ])

  const tab = (activo: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      activo ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Presupuestos</h1>
        <Link
          href="/trabajos/nuevo"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Nuevo presupuesto
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <Link href="/presupuestos" className={tab(!verRechazados)}>Pendientes</Link>
        <Link href="/presupuestos?ver=rechazados" className={tab(verRechazados)}>Rechazados</Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Número</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Rubro</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Monto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Plazo de entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={7} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {presupuestos?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-gray-500">
                  {verRechazados ? 'Sin presupuestos rechazados.' : 'Sin presupuestos pendientes.'}
                </td>
              </tr>
            )}
            {presupuestos?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trabajos/${p.id}`} className="hover:underline">{p.numero}</Link>
                </td>
                <td className="px-4 py-2">{formatearFecha(p.fecha_entrada)}</td>
                <td className="px-4 py-2">{p.clientes?.nombre_razon_social}</td>
                <td className="max-w-xs truncate px-4 py-2">{p.descripcion}</td>
                <td className="px-4 py-2">
                  {p.rubro ? ETIQUETAS_RUBRO_TRABAJO[p.rubro as RubroTrabajo] : '—'}
                </td>
                <td className="px-4 py-2">
                  {p.precio_final > 0 ? (
                    formatearMoneda(p.precio_final)
                  ) : (
                    <span className="font-medium text-yellow-600">Sin definir</span>
                  )}
                </td>
                <td className="px-4 py-2">{formatearFecha(p.fecha_maxima)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}