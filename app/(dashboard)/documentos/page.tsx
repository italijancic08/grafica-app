import { listarTodasLasFacturas } from '@/lib/services/facturas'
import { listarMesesConMovimientos } from '@/lib/services/caja'
import ListaFacturas from '../facturas/lista-facturas'
import DescargarExcelMes from './descargar-excel-mes'

export default async function DocumentosPage() {
  const { data: facturas, error: errorFacturas } = await listarTodasLasFacturas()
  const { data: meses, error: errorMeses } = await listarMesesConMovimientos()

  return (
    <div className="p-8">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Documentos</h1>
      <p className="mb-6 text-sm text-gray-500">
        Comprobantes y planillas de caja, todo en un solo lugar para descargar.
      </p>

      <h2 className="mb-2 text-sm font-semibold text-gray-900">Comprobantes</h2>
      {errorFacturas && <p className="mb-6 text-sm text-red-600">Error al cargar las facturas: {errorFacturas}</p>}
      {!errorFacturas && <div className="mb-8"><ListaFacturas facturas={facturas ?? []} /></div>}

      <h2 className="mb-2 text-sm font-semibold text-gray-900">Excel de caja por mes</h2>
      {errorMeses && <p className="text-sm text-red-600">Error al cargar los meses: {errorMeses}</p>}
      {!errorMeses && (meses?.length ?? 0) === 0 && (
        <p className="text-sm text-gray-500">Todavía no hay movimientos de caja cargados.</p>
      )}
      {!errorMeses && meses && meses.length > 0 && (
        <div className="rounded-lg border border-gray-200 px-4">
          {meses.map((mes) => <DescargarExcelMes key={mes} mes={mes} />)}
        </div>
      )}
    </div>
  )
}