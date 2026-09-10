import { listarAuditoria, obtenerRolActual } from '@/lib/services/auditoria'
import { listarUsuarios } from '@/lib/services/usuarios'
import FiltrosAuditoria from './filtros-auditoria'
import FilaAuditoria from './fila-auditoria'

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ usuario?: string; accion?: string; entidad?: string; desde?: string; hasta?: string }>
}) {
  const rol = await obtenerRolActual()

  if (rol !== 'administrador') {
    return (
      <div className="p-6">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500">Necesitás rol de administrador para ver esta página.</p>
      </div>
    )
  }

  const filtros = await searchParams
  const [{ data: registros, error }, { data: usuarios }] = await Promise.all([
    listarAuditoria({
      usuarioId: filtros.usuario,
      accion: filtros.accion,
      entidad: filtros.entidad,
      desde: filtros.desde,
      hasta: filtros.hasta,
    }),
    listarUsuarios(),
  ])

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Auditoría</h1>
      <p className="mb-6 text-sm text-gray-500">Historial de acciones del sistema (últimos 200 registros).</p>

      <FiltrosAuditoria usuarios={usuarios ?? []} />

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Usuario</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Acción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Entidad</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={5} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {registros?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-3 text-gray-500">No hay registros para estos filtros.</td></tr>
            )}
            {registros?.map((r) => <FilaAuditoria key={r.id} registro={r} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}