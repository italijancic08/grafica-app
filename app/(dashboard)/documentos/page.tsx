import { listarTodasLasFacturas } from '@/lib/services/facturas'
import { listarMesesConMovimientos } from '@/lib/services/caja'
import {
  listarLiquidaciones,
} from '@/lib/services/liquidaciones'

import ListaFacturas from '../facturas/lista-facturas'
import DescargarExcelMes from './descargar-excel-mes'
import DescargarLiquidacionDocumento from './descargar-liquidacion-documento'

export default async function DocumentosPage() {
  const {
    data: facturas,
    error: errorFacturas,
  } = await listarTodasLasFacturas()

  const {
    data: meses,
    error: errorMeses,
  } = await listarMesesConMovimientos()

  const {
    data: liquidaciones,
    error: errorLiquidaciones,
  } = await listarLiquidaciones()

  return (
    <div className="p-8">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">
        Documentos
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        Comprobantes, planillas de caja y
        liquidaciones de trabajadores.
      </p>

      <h2 className="mb-2 text-sm font-semibold text-gray-900">
        Liquidaciones de trabajadores
      </h2>

      {errorLiquidaciones && (
        <p className="mb-6 text-sm text-red-600">
          {errorLiquidaciones}
        </p>
      )}

      {!errorLiquidaciones &&
        (liquidaciones?.length ?? 0) === 0 && (
          <p className="mb-8 text-sm text-gray-500">
            Todavía no hay liquidaciones generadas.
          </p>
        )}

      {!errorLiquidaciones &&
        liquidaciones &&
        liquidaciones.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-200 px-4">
            {liquidaciones.map(
              (liquidacion: any) => (
                <div
                  key={liquidacion.id}
                  className="flex items-center justify-between border-b border-gray-200 py-3 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      Liquidación{' '}
                      {liquidacion.semana_inicio}
                      {' → '}
                      {liquidacion.semana_fin}
                    </p>

                    <p className="text-xs text-gray-500">
                      {liquidacion.total_horas} horas · $
                      {Number(
                        liquidacion.total_pagar
                      ).toFixed(2)}
                    </p>
                  </div>

                  <DescargarLiquidacionDocumento
                    liquidacionId={
                      liquidacion.id
                    }
                  />
                </div>
              )
            )}
          </div>
        )}

      <h2 className="mb-2 text-sm font-semibold text-gray-900">
        Comprobantes
      </h2>

      {errorFacturas && (
        <p className="mb-6 text-sm text-red-600">
          Error al cargar las facturas:{' '}
          {errorFacturas}
        </p>
      )}

      {!errorFacturas && (
        <div className="mb-8">
          <ListaFacturas
            facturas={facturas ?? []}
          />
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-gray-900">
        Excel de caja por mes
      </h2>

      {errorMeses && (
        <p className="text-sm text-red-600">
          Error al cargar los meses:{' '}
          {errorMeses}
        </p>
      )}

      {!errorMeses &&
        (meses?.length ?? 0) === 0 && (
          <p className="text-sm text-gray-500">
            Todavía no hay movimientos de caja
            cargados.
          </p>
        )}

      {!errorMeses &&
        meses &&
        meses.length > 0 && (
          <div className="rounded-lg border border-gray-200 px-4">
            {meses.map((mes) => (
              <DescargarExcelMes
                key={mes}
                mes={mes}
              />
            ))}
          </div>
        )}
    </div>
  )
}