import { listarClientes } from '@/lib/services/clientes'
import FormularioTrabajo from './formulario-trabajo'

export default async function NuevoTrabajoPage() {
  const { data: clientes } = await listarClientes()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Nuevo trabajo</h1>
      <FormularioTrabajo clientes={clientes ?? []} />
    </div>
  )
}