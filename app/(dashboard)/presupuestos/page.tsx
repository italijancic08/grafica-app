import Link from 'next/link'
import { listarTrabajos } from '@/lib/services/trabajos'
import { formatearFecha } from '@/lib/utils/formato'
import { filtrarTrabajosPorBusqueda } from '@/lib/utils/buscar-trabajos'
import { presupuestoArchivado, etiquetaEstadoPresupuesto } from '@/lib/utils/estado-presupuesto'
import BuscadorFiltrosPresupuestos from './buscador-filtros-presupuestos'

type Vista = 'pendientes' | 'enviados' | 'rechazados'

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; q?: string }>
}) {
  const { ver, q } = await searchParams
  const vista: Vista = ver === 'enviados' ? 'enviados' : ver === 'rechazados' ? 'rechazados' : 'pendientes'
  const busqueda = (q ?? '').trim()

  // Los más viejos arriba (por fecha de carga)
  const { data: presupuestosTodos, error: errorPresupuestos } = await listarTrabajos(['PRESUPUESTO'], true)

  // Los enviados hace más de 10 días sin respuesta se archivan: no se listan acá,
  // pero siguen en el historial del cliente.
  const vigentes = (presupuestosTodos ?? []).filter(
    (p) => !presupuestoArchivado(p.fecha_envio_presupuesto)
  )
  const sinEnviar = vigentes.filter((p) => !p.fecha_envio_presupuesto)
  const enviados = vigentes.filter((p) => !!p.fecha_envio_presupuesto)

  let base = vista === 'enviados' ? enviados : sinEnviar
  let error = errorPresupuestos

  if (vista === 'rechazados') {
    const rechazados = await listarTrabajos(['RECHAZADO'], true)
    base = rechazados.data ?? []
    error = rechazados.error ?? error
  }

  const presupuestos = busqueda ? filtrarTrabajosPorBusqueda(base, busqueda) : base

  const mostrarEnvio = vista !== 'pendientes'
  const columnas = mostrarEnvio ? 6 : 5

  const tab = (activo: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      activo ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`

  const mensajeVacio = busqueda
    ? 'No hay presupuestos que coincidan con la búsqueda.'
    : vista === 'rechazados'
      ? 'Sin presupuestos rechazados.'
      : vista === 'enviados'
        ? 'Sin presupuestos enviados esperando respuesta.'
        : 'Sin presupuestos pendientes de enviar.'

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

      {vista === 'enviados' && (
        <p className="mb-4 text-xs text-gray-500">
          Los presupuestos enviados que no reciben respuesta se archivan solos a los 10 días
          y quedan en el historial del cliente.
        </p>
      )}

      <div className="mb-4 mt-4 flex flex-wrap gap-2">
        <Link href="/presupuestos" className={tab(vista === 'pendientes')}>
          Pendientes ({sinEnviar.length})
        </Link>
        <Link href="/presupuestos?ver=enviados" className={tab(vista === 'enviados')}>
          Enviados ({enviados.length})
        </Link>
        <Link href="/presupuestos?ver=rechazados" className={tab(vista === 'rechazados')}>
          Rechazados
        </Link>
      </div>

      <BuscadorFiltrosPresupuestos vista={vista} />

      {busqueda && (
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
              {mostrarEnvio && (
                <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha de envío</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={columnas} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {presupuestos.length === 0 && (
              <tr>
                <td colSpan={columnas} className="px-4 py-3 text-gray-500">{mensajeVacio}</td>
              </tr>
            )}
            {presupuestos.map((p) => (
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
                  {vista === 'rechazados' ? 'Rechazado' : etiquetaEstadoPresupuesto(p.fecha_envio_presupuesto)}
                </td>
                {mostrarEnvio && (
                  <td className="px-4 py-2">{formatearFecha(p.fecha_envio_presupuesto ?? null)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}