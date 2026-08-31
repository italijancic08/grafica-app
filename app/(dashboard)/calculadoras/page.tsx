import { listarMateriales } from '@/lib/services/materiales'
import CalculadoraMateriales from './calculadora-materiales'

export default async function CalculadorasPage() {
  const { data: materiales } = await listarMateriales()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Calculadora de materiales</h1>
      <CalculadoraMateriales materiales={materiales ?? []} />
    </div>
  )
}