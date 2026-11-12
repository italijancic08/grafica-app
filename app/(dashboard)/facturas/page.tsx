import { listarTodasLasFacturas } from '@/lib/services/facturas'
import { esAdministrador } from '@/lib/auth/roles'
import ListaFacturas from './lista-facturas'

export default async function FacturasPage() {
  const { data: facturas, error } = await listarTodasLasFacturas()
  const administrador = await esAdministrador()

  return (
    <div className="p-8">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Recibos</h1>
      <p className="mb-6 text-sm text-gray-500">Todos los recibos generados, de todos los trabajos.</p>

      {error && <p className="text-sm text-red-600">Error al cargar los recibos: {error}</p>}
      {!error && <ListaFacturas facturas={facturas ?? []} administrador={administrador} />}
    </div>
  )
}