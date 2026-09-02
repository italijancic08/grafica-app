'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cerrarMes } from '@/lib/services/caja-mensual'
import { formatearMoneda } from '@/lib/utils/formato'
import type { CierreMensual } from '@/lib/services/caja-mensual'

export default function CierreMensualControl({
  mes,
  anio,
  cierre,
  cajaFisica,
  esMesActualOFuturo,
}: {
  mes: number
  anio: number
  cierre: CierreMensual | null
  cajaFisica: number
  esMesActualOFuturo: boolean
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (cierre?.cerrado) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-medium text-gray-900">Este mes está cerrado.</p>
        <p className="text-gray-600">
          Ingresos: {formatearMoneda(cierre.total_ingresos)} · Egresos: {formatearMoneda(cierre.total_egresos)} · Saldo: {formatearMoneda(cierre.saldo)}
        </p>
      </div>
    )
  }

  if (esMesActualOFuturo) {
    return (
      <div>
        <button
          disabled
          title="Se habilita cuando termine el mes"
          className="cursor-not-allowed rounded-md bg-gray-300 px-4 py-1.5 text-sm font-medium text-gray-500"
        >
          Cerrar este mes
        </button>
        <p className="mt-1 text-xs text-gray-500">Podés cerrar este mes recién cuando termine.</p>
      </div>
    )
  }

  async function handleCerrar() {
    setError(null)
    setCargando(true)

    try {
      const resultado = await cerrarMes(mes, anio)
      if (resultado.error) {
        setError(resultado.error)
        return
      }
      setConfirmando(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      {!confirmando ? (
        <button
          onClick={() => setConfirmando(true)}
          className="rounded-md bg-yellow-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-yellow-800"
        >
          Cerrar este mes
        </button>
      ) : (
        <div>
          <p className="mb-3 text-sm text-yellow-900">
            Al cerrar este mes, la caja física actual ({formatearMoneda(cajaFisica)}) se va a migrar
            automáticamente como saldo inicial del mes siguiente, con rubro &quot;Caja&quot;. Esta acción
            no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCerrar}
              disabled={cargando}
              className="rounded-md bg-yellow-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-yellow-800 disabled:opacity-50"
            >
              {cargando ? 'Cerrando...' : 'Confirmar cierre'}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}