import Link from 'next/link'
import { obtenerAlertas } from '@/lib/services/alertas'
import { ETIQUETAS_TIPO_ALERTA, type TipoAlerta } from '@/lib/types/alerta'

const COLOR_POR_TIPO: Record<TipoAlerta, string> = {
  STOCK_BAJO: 'bg-blue-100 text-blue-800',
  TRABAJO_DEMORADO: 'bg-red-100 text-red-800',
  TRABAJO_NO_RETIRADO: 'bg-yellow-100 text-yellow-800',
  TERCERIZACION_DEMORADA: 'bg-orange-100 text-orange-800',
}

export default async function AlertasPage() {
  const { data: alertas, error } = await obtenerAlertas()

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Alertas</h1>
      <p className="mb-6 text-sm text-gray-500">
        Se recalculan en el momento: en cuanto resolvés el problema de fondo, la alerta desaparece sola.
      </p>

      {error && <p className="text-sm text-red-600">Error al cargar las alertas: {error}</p>}

      {!error && alertas?.length === 0 && (
        <p className="text-sm text-gray-500">Sin alertas activas. Todo en orden. ✅</p>
      )}

      {!error && alertas && alertas.length > 0 && (
        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {alertas.map((a, i) => (
            <Link
              key={i}
              href={a.urlDetalle}
              className="flex items-center gap-3 p-4 text-sm hover:bg-gray-50"
            >
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_POR_TIPO[a.tipo]}`}>
                {ETIQUETAS_TIPO_ALERTA[a.tipo]}
              </span>
              <span className="text-gray-700">{a.mensaje}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}