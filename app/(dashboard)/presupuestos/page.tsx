import Link from 'next/link'
import { listarTrabajos } from '@/lib/services/trabajos'
import { formatearFecha } from '@/lib/utils/formato'
import { filtrarTrabajosPorBusqueda } from '@/lib/utils/buscar-trabajos'
import { presupuestoArchivado, etiquetaEstadoPresupuesto } from '@/lib/utils/estado-presupuesto'
import BuscadorFiltrosPresupuestos from './buscador-filtros-presupuestos'

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; q?: string; estado?: string }>
}) {
  const { ver, q, estado } = await searchParams
  const verRechazados = ver === 'rechazados'
  const busqueda = (q ?? '').trim()
  const estadoFiltro =
    !verRechazados && (estado === 'pendiente' || estado === 'enviado') ? estado : null

  // Los más viejos arriba (por fecha de carga)
  const { data: todos, error } = await listarTrabajos(
    [verRechazados ? 'RECHAZADO' : 'PRESUPUESTO'],
    true
  )

  // Los presupuestos enviados hace más de 10 días sin respuesta se archivan:
  // no se listan acá, pero siguen en el historial del cliente.
  const vigentes = verRechazados
    ? todos
    : todos?.filter((p) => !presupuestoArchivado(p.fecha_envio_presupuesto))

  // La búsqueda se aplica primero; los contadores reflejan sus resultados
  const coincidentes =
    busqueda && vigentes ? filtrarTrabajosPorBusqueda(vigentes, busqueda) : vigentes

  const presupuestos = estadoFiltro
    ? coincidentes?.filter((p) =>
        estadoFiltro === 'enviado' ? !!p.fecha_envio_presupuesto : !p.fecha_envio_presupuesto
      )
    : coincidentes

  const conteos: Record<string, number> = {
    pendiente: coincidentes?.filter((p) => !p.fecha_envio_presupuesto).length ?? 0,
    enviado: coincidentes?.filter((p) => !!p.fecha_envio_presupuesto).length ?? 0,
  }

  const tab = (activo: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      activo ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Presupuestos</h1>
        <Link
          href="/trabajos/nuevo"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Nuevo presupuesto
        </Link>
      </div>

      {!verRechazados && (
        <p className="mb-4 text-xs text-gray-500">
          Los presupuestos enviados que no reciben respuesta se archivan solos a los 10 días
          y quedan en el historial del cliente.
        </p>
      )}

      <div className="mb-4 flex gap-2">
        <Link href="/presupuestos" className={tab(!verRechazados)}>Pendientes</Link>
        <Link href="/presupuestos?ver=rechazados" className={tab(verRechazados)}>Rechazados</Link>
      </div>

      <BuscadorFiltrosPresupuestos
        estadoActivo={estadoFiltro}
        conteos={conteos}
        total={coincidentes?.length ?? 0}
        verRechazados={verRechazados}
      />

      {(busqueda || estadoFiltro) && presupuestos && (
        <p className="mb-3 text-sm text-gray-500">
          {presupuestos.length} {presupuestos.length === 1 ? 'resultado' : 'resultados'}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Orden Nº</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha de ingreso</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha de envío</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={6} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {presupuestos?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-gray-500">
                  {busqueda || estadoFiltro
                    ? 'No hay presupuestos que coincidan con la búsqueda o los filtros.'
                    : verRechazados
                      ? 'Sin presupuestos rechazados.'
                      : 'Sin presupuestos pendientes.'}
                </td>
              </tr>
            )}
            {presupuestos?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trabajos/${p.id}`} className="hover:underline">{p.numero}</Link>
                </td>
                <td className="px-4 py-2">{formatearFecha(p.fecha_entrada)}</td>
                <td className="px-4 py-2">
                  {p.clientes?.nombre_razon_social ?? p.empresas_clientes?.nombre}
                  {p.clientes && p.empresas_clientes && (
                    <span className="block text-xs text-gray-400">por parte de {p.empresas_clientes.nombre}</span>
                  )}
                </td>
                <td className="max-w-xs truncate px-4 py-2">{p.descripcion}</td>
                <td className="px-4 py-2">
                  {verRechazados ? 'Rechazado' : etiquetaEstadoPresupuesto(p.fecha_envio_presupuesto)}
                </td>
                <td className="px-4 py-2">{formatearFecha(p.fecha_envio_presupuesto ?? null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}