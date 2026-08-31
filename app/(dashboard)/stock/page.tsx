import { listarMateriales } from '@/lib/services/materiales'
import FormularioMaterial from './formulario-material'
import FilaMaterial from './fila-material'

export default async function StockPage() {
  const { data: materiales, error } = await listarMateriales()

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Stock</h1>
      </div>

      <FormularioMaterial />

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Material</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Unidad</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Stock actual</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Stock mínimo</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={5} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {materiales?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-3 text-gray-500">Sin materiales cargados.</td></tr>
            )}
            {materiales?.map((m) => (
              <FilaMaterial key={m.id} material={m} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}