import {
  listarLiquidaciones,
} from '@/lib/services/liquidaciones'

import DescargarLiquidacion from './descargar-liquidacion'

function dinero(valor: number) {
  return new Intl.NumberFormat(
    'es-AR',
    {
      style: 'currency',
      currency: 'ARS',
    }
  ).format(valor)
}

function fecha(fecha: string) {
  return new Intl.DateTimeFormat(
    'es-AR'
  ).format(new Date(`${fecha}T00:00:00-03:00`))
}

export default async function PagaPage() {
  const resultado =
    await listarLiquidaciones()

  if (resultado.error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Paga
        </h1>

        <p className="mt-4 text-sm text-red-600">
          {resultado.error}
        </p>
      </div>
    )
  }

  const liquidaciones =
    resultado.data ?? []

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Paga
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        Liquidaciones semanales de los trabajadores.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Semana
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Estado
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Horas
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Valor hora
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Total
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Excel
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {liquidaciones.map((liquidacion: any) => (
              <tr key={liquidacion.id}>
                <td className="px-4 py-3">
                  {fecha(liquidacion.semana_inicio)}
                  {' → '}
                  {fecha(liquidacion.semana_fin)}
                </td>

                <td className="px-4 py-3">
                  {liquidacion.estado === 'liquidada' ? (
                    <span className="font-medium text-green-600">
                      Liquidada
                    </span>
                  ) : (
                    <span className="font-medium text-orange-600">
                      Pendiente
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {liquidacion.total_horas} h
                </td>

                <td className="px-4 py-3">
                  {dinero(
                    Number(
                      liquidacion.valor_hora
                    )
                  )}
                </td>

                <td className="px-4 py-3 font-medium">
                  {dinero(
                    Number(
                      liquidacion.total_pagar
                    )
                  )}
                </td>

                <td className="px-4 py-3">
                  <DescargarLiquidacion
                    liquidacionId={
                      liquidacion.id
                    }
                  />
                </td>
              </tr>
            ))}

            {liquidaciones.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Todavía no hay liquidaciones
                  generadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
        La liquidación se genera después del
        viernes a las 20:00. Si existe un fichaje
        abierto que continúa hasta el sábado por
        la mañana, queda pendiente hasta registrar
        la salida.
      </div>
    </div>
  )
}