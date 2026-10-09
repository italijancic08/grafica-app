import Link from 'next/link'
import { listarEmpresasClientes } from '@/lib/services/empresas-clientes'
import PestanasClientes from '../pestanas-clientes'
import FormularioEmpresaCliente from './formulario-empresa-cliente'

export default async function EmpresasClientesPage() {
  const { data: empresas, error } = await listarEmpresasClientes()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Clientes</h1>

      <PestanasClientes activa="empresas" />

      <FormularioEmpresaCliente />

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Empresa</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Teléfono</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">CUIT</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Localidad</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Clientes</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={6} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {empresas?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-3 text-gray-500">Todavía no hay empresas cargadas.</td></tr>
            )}
            {empresas?.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 font-medium">{e.nombre}</td>
                <td className="px-4 py-2">{e.telefono ?? '—'}</td>
                <td className="px-4 py-2">{e.cuit ?? '—'}</td>
                <td className="px-4 py-2">{e.localidad ?? '—'}</td>
                <td className="px-4 py-2">{e.clientes?.[0]?.count ?? 0}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/clientes/empresas/${e.id}`} className="text-sm font-medium text-gray-900 hover:underline">
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
