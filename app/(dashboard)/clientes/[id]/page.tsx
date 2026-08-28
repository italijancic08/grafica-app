import { notFound } from 'next/navigation'
import { obtenerCliente, obtenerTrabajosDeCliente } from '@/lib/services/clientes'

function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: cliente, error } = await obtenerCliente(id)

  if (error || !cliente) notFound()

  const { data: trabajos } = await obtenerTrabajosDeCliente(id)

  const totalComprado = trabajos?.reduce((acc, t) => acc + t.precio_final, 0) ?? 0
  const deudaActual = trabajos?.reduce((acc, t) => acc + Math.max(t.saldo, 0), 0) ?? 0

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">{cliente.nombre_razon_social}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {cliente.telefono ?? 'Sin teléfono'} {cliente.email ? `· ${cliente.email}` : ''}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total comprado</p>
          <p className="text-lg font-semibold">{formatearMoneda(totalComprado)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Deuda actual</p>
          <p className="text-lg font-semibold text-red-600">{formatearMoneda(deudaActual)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">CUIT/CUIL</p>
          <p className="text-lg font-semibold">{cliente.cuit_cuil ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Localidad</p>
          <p className="text-lg font-semibold">{cliente.localidad ?? '—'}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-900">Trabajos</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Número</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Precio</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {trabajos?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-3 text-gray-500">Sin trabajos todavía.</td></tr>
            )}
            {trabajos?.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 font-medium">{t.numero}</td>
                <td className="px-4 py-2">{t.descripcion}</td>
                <td className="px-4 py-2">{t.estado_operativo.replace('_', ' ')}</td>
                <td className="px-4 py-2">{formatearMoneda(t.precio_final)}</td>
                <td className={`px-4 py-2 ${t.saldo > 0 ? 'text-red-600' : ''}`}>
                  {formatearMoneda(t.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}