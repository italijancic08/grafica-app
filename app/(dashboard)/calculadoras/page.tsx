import { listarMateriales } from '@/lib/services/materiales'
import SelectorCalculadoras from './selector-calculadoras'

export default async function CalculadorasPage() {
  const { data: materiales } = await listarMateriales()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Calculadoras</h1>
      <SelectorCalculadoras materiales={materiales ?? []} />
    </div>
  )
}