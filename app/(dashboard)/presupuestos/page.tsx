import { listarPresupuestos } from '@/lib/services/presupuestos'
import { listarClientes } from '@/lib/services/clientes'
import FormularioPresupuesto from './formulario-presupuesto'
import FilaPresupuesto from './fila-presupuesto'

export default async function PresupuestosPage() {
  const { data: presupuestos, error } = await listarPresupuestos()
  const { data: clientes } = await listarClientes()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Presupuestos</h1>

      <FormularioPresupuesto clientes={clientes ?? []} />

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Monto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={6} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {presupuestos?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-3 text-gray-500">Sin presupuestos cargados.</td></tr>
            )}
            {presupuestos?.map((p) => (
              <FilaPresupuesto key={p.id} presupuesto={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}