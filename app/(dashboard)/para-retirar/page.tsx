import Link from 'next/link'
import { listarParaRetirar } from '@/lib/services/trabajos'
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

export default async function ParaRetirarPage() {
  const { data: trabajos, error } = await listarParaRetirar()

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Para retirar</h1>
      <p className="mb-6 text-sm text-gray-500">
        Trabajos terminados, listos para que el cliente los retire.
      </p>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Número</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Pago</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Saldo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">F. finalización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={7} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {trabajos?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-3 text-gray-500">No hay trabajos para retirar en este momento.</td></tr>
            )}
            {trabajos?.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trabajos/${t.id}`} className="hover:underline">{t.numero}</Link>
                </td>
                <td className="px-4 py-2">{t.clientes?.nombre_razon_social}</td>
                <td className="px-4 py-2 max-w-xs truncate">{t.descripcion}</td>
                <td className="px-4 py-2">{ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeFinanciero(t.estado_financiero)}`}>
                    {ETIQUETAS_ESTADO_FINANCIERO[t.estado_financiero as keyof typeof ETIQUETAS_ESTADO_FINANCIERO]}
                  </span>
                </td>
                <td className={`px-4 py-2 ${t.saldo > 0 ? 'text-red-600 font-medium' : ''}`}>
                  {formatearMoneda(t.saldo)}
                </td>
                <td className="px-4 py-2">{formatearFecha(t.fecha_finalizacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}