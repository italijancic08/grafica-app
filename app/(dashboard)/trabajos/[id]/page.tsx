import Link from 'next/link'
import { listarTrabajos } from '@/lib/services/trabajos'
import { ESTADOS_EN_LISTA_DE_TRABAJOS } from '@/lib/utils/estados-trabajo'
import { ETIQUETAS_ESTADO_OPERATIVO } from '@/lib/types/trabajo'
import { formatearFecha } from '@/lib/utils/formato'
import { filtrarTrabajosPorBusqueda } from '@/lib/utils/buscar-trabajos'
import BuscadorFiltrosTrabajos from './buscador-filtros-trabajos'
import CambiarEstado from './cambiar-estado'
import MuestraEnviada from './muestra-enviada'

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>
}) {
  const { estado, q } = await searchParams
  const busqueda = (q ?? '').trim()
  // Si el parámetro no es un estado válido de la lista, se muestran todos
  const estadoFiltro = ESTADOS_EN_LISTA_DE_TRABAJOS.find((e) => e === estado) ?? null

  // Se ven solo los trabajos en curso, los más viejos arriba (por fecha de carga).
  // Los presupuestos se ven en /presupuestos; los finalizados, en el historial del cliente.
  const { data: todos, error } = await listarTrabajos(ESTADOS_EN_LISTA_DE_TRABAJOS, true)

  // La búsqueda se aplica primero; los contadores de estado reflejan sus resultados
  const coincidentes = busqueda && todos ? filtrarTrabajosPorBusqueda(todos, busqueda) : todos
  const trabajos = estadoFiltro
    ? coincidentes?.filter((t) => t.estado_operativo === estadoFiltro)
    : coincidentes

  const conteos: Record<string, number> = {}
  for (const e of ESTADOS_EN_LISTA_DE_TRABAJOS) {
    conteos[e] = coincidentes?.filter((t) => t.estado_operativo === e).length ?? 0
  }

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

      <BuscadorFiltrosTrabajos
        estadoActivo={estadoFiltro}
        conteos={conteos}
        total={coincidentes?.length ?? 0}
      />

      {(busqueda || estadoFiltro) && trabajos && (
        <p className="mb-3 text-sm text-gray-500">
          {trabajos.length} {trabajos.length === 1 ? 'resultado' : 'resultados'}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-red-600">{error}</td>
              </tr>
            )}
            {trabajos?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-gray-500">
                  {estadoFiltro || busqueda
                    ? 'No hay trabajos que coincidan con la búsqueda o los filtros.'
                    : 'No hay trabajos en curso.'}
                </td>
              </tr>
            )}
            {trabajos?.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trabajos/${t.id}`} className="hover:underline">{t.numero}</Link>
                </td>
                <td className="px-4 py-2">{formatearFecha(t.fecha_entrada)}</td>
                <td className="px-4 py-2">
                  {t.clientes?.nombre_razon_social ?? t.empresas_clientes?.nombre}
                  {t.clientes && t.empresas_clientes && (
                    <span className="block text-xs text-gray-400">por parte de {t.empresas_clientes.nombre}</span>
                  )}
                </td>
                <td className="px-4 py-2 max-w-xs truncate">{t.descripcion}</td>
                <td className="px-4 py-2">{ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}