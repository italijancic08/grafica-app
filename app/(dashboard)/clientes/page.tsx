import Link from 'next/link'
import { listarClientes } from '@/lib/services/clientes'
import FormularioClienteRapido from './formulario-cliente-rapido'
import BuscadorClientes from './buscador-clientes'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const { data: clientes, error } = await listarClientes(q)

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Clientes</h1>

      <div className="mb-4 flex items-center justify-between gap-4">
        <BuscadorClientes />
      </div>

      <FormularioClienteRapido />

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre / Razón social</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Teléfono</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">CUIT/CUIL</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Localidad</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={5} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {clientes?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-3 text-gray-500">No se encontraron clientes.</td></tr>
            )}
            {clientes?.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">{c.nombre_razon_social}</td>
                <td className="px-4 py-2">{c.telefono ?? '—'}</td>
                <td className="px-4 py-2">{c.cuit_cuil ?? '—'}</td>
                <td className="px-4 py-2">{c.localidad ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/clientes/${c.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                    Ver ficha
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}