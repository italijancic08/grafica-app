import { listarClientes } from '@/lib/services/clientes'
import { listarEmpresasClientes } from '@/lib/services/empresas-clientes'
import FormularioTrabajo from './formulario-trabajo'

export default async function NuevoTrabajoPage() {
  const { data: clientes } = await listarClientes()
  const { data: empresas } = await listarEmpresasClientes()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Nuevo presupuesto</h1>
      <FormularioTrabajo clientes={clientes ?? []} empresas={empresas ?? []} />
    </div>
  )
}