import { obtenerEmpresa } from '@/lib/services/empresa'
import FormularioEmpresa from './formulario-empresa'

export default async function ConfiguracionPage() {
  const { data: empresa } = await obtenerEmpresa()

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Configuración</h1>
      <p className="mb-6 text-sm text-gray-500">
        Estos datos aparecen en el membrete de los recibos y comprobantes que genera el sistema.
      </p>

      <FormularioEmpresa empresa={empresa ?? null} />
    </div>
  )
}