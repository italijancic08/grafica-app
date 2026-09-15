import PanelFichaje from './panel-fichaje'
import { listarFichajesSemana } from '@/lib/services/fichaje'
import {
  formatearFechaHoraArgentina,
} from '@/lib/utils/semana-fichaje'

export default async function FichajePage() {
  const resultado =
    await listarFichajesSemana()

  const fichajes = resultado.data ?? []

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Fichaje
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        Registrá tu entrada y salida de cada jornada.
      </p>

      <PanelFichaje />

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Fichajes de la semana
        </h2>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Empleado
                </th>

                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Entrada
                </th>

                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Salida
                </th>

                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Horas
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {fichajes.map((fichaje: any) => (
                <tr key={fichaje.id}>
                  <td className="px-4 py-3">
                    {fichaje.usuarios?.nombre ?? '-'}
                  </td>

                  <td className="px-4 py-3">
                    {formatearFechaHoraArgentina(
                      fichaje.entrada
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {fichaje.salida
                      ? formatearFechaHoraArgentina(
                          fichaje.salida
                        )
                      : (
                        <span className="font-medium text-orange-600">
                          En curso
                        </span>
                      )}
                  </td>

                  <td className="px-4 py-3">
                    {fichaje.horas_trabajadas != null
                      ? `${fichaje.horas_trabajadas} h`
                      : '-'}
                  </td>
                </tr>
              ))}

              {fichajes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Todavía no hay fichajes
                    registrados esta semana.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
        <strong>Ciclo laboral:</strong>{' '}
        lunes a sábado a las 12:00.
        <br />
        El sábado por la mañana puede utilizarse
        para finalizar jornadas iniciadas el viernes.
      </div>
    </div>
  )
}