import { listarInstaladoresActivos, listarTurnos } from '@/lib/services/trabajos'
import GestorTurnos from './gestor-turnos'

export default async function TurnosPage() {
  const [resultadoTurnos, resultadoInstaladores] = await Promise.all([
    listarTurnos(),
    listarInstaladoresActivos(),
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Turnos</h1>
        <p className="mt-1 text-sm text-gray-500">Administrá las instalaciones y trabajos que requieren coordinación con el cliente.</p>
      </div>
      {resultadoTurnos.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar los turnos. Verificá que hayas ejecutado la migración 0023_turnos.sql. Detalle: {resultadoTurnos.error}
        </div>
      ) : (
        <GestorTurnos turnos={resultadoTurnos.data ?? []} instaladores={resultadoInstaladores.data ?? []} />
      )}
    </div>
  )
}
