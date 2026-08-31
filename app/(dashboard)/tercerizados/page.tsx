import Link from 'next/link'
import { listarTercerizaciones } from '@/lib/services/tercerizaciones'
import { ETIQUETAS_ESTADO_TERCERIZACION } from '@/lib/types/tercerizacion'
import { formatearFecha, formatearMoneda } from '@/lib/utils/formato'
import BotonMarcarVuelta from './boton-marcar-vuelta'

export default async function TercerizadosPage() {
  const { data: tercerizaciones, error } = await listarTercerizaciones()
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Tercerizados</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Trabajo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Proveedor</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Envío</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Vuelta estimada</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Costo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={8} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {tercerizaciones?.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-3 text-gray-500">Sin tercerizaciones registradas.</td></tr>
            )}
            {tercerizaciones?.map((tc) => {
              const demorado =
                tc.estado !== 'VUELTO' &&
                tc.fecha_estimada_vuelta &&
                tc.fecha_estimada_vuelta < hoy

              return (
                <tr key={tc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/trabajos/${tc.trabajo_id}`} className="hover:underline">
                      {tc.trabajos?.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{tc.trabajos?.clientes?.nombre_razon_social}</td>
                  <td className="px-4 py-2">{tc.proveedor}</td>
                  <td className="px-4 py-2">{formatearFecha(tc.fecha_envio)}</td>
                  <td className="px-4 py-2">{formatearFecha(tc.fecha_estimada_vuelta)}</td>
                  <td className="px-4 py-2">{tc.costo ? formatearMoneda(tc.costo) : '—'}</td>
                  <td className="px-4 py-2">
                    <span className={demorado ? 'font-medium text-red-600' : ''}>
                      {ETIQUETAS_ESTADO_TERCERIZACION[tc.estado]}
                      {demorado && ' (demorado)'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {tc.estado !== 'VUELTO' && (
                      <BotonMarcarVuelta tercerizacionId={tc.id} trabajoId={tc.trabajo_id} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}