import Link from 'next/link'
import { listarConDeuda } from '@/lib/services/trabajos'
import { ETIQUETAS_ESTADO_OPERATIVO } from '@/lib/types/trabajo'
import { formatearMoneda, formatearFecha } from '@/lib/utils/formato'

export default async function DeudasPage() {
  const { data: trabajos, error } = await listarConDeuda()

  const totalAdeudado = trabajos?.reduce((acc, t) => acc + t.saldo, 0) ?? 0

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pendientes de pago</h1>
          <p className="text-sm text-gray-500">Trabajos con saldo pendiente, retirados o no.</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-right">
          <p className="text-xs text-red-700">Total adeudado</p>
          <p className="text-lg font-semibold text-red-700">{formatearMoneda(totalAdeudado)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Número</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Teléfono</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Precio</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Saldo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">F. entrada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={7} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {trabajos?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-3 text-gray-500">No hay deudas pendientes. 🎉</td></tr>
            )}
            {trabajos?.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trabajos/${t.id}`} className="hover:underline">{t.numero}</Link>
                </td>
                <td className="px-4 py-2">{t.clientes?.nombre_razon_social}</td>
                <td className="px-4 py-2">{t.clientes?.telefono ?? t.clientes?.whatsapp ?? '—'}</td>
                <td className="px-4 py-2">
                  {ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}
                  {t.estado_operativo === 'RETIRADO' && (
                    <span className="ml-1 text-xs text-orange-600">(retirado con deuda)</span>
                  )}
                </td>
                <td className="px-4 py-2">{formatearMoneda(t.precio_final)}</td>
                <td className="px-4 py-2 font-medium text-red-600">{formatearMoneda(t.saldo)}</td>
                <td className="px-4 py-2">{formatearFecha(t.fecha_entrada)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}