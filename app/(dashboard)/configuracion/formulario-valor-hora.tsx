'use client'

import { useState } from 'react'
import { actualizarValorHora } from '@/lib/services/configuracion'

export default function FormularioValorHora({
  valorActual,
}: {
  valorActual: number
}) {
  const [valor, setValor] = useState(
    String(valorActual)
  )

  const [guardando, setGuardando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  async function guardar() {
    setMensaje(null)
    setError(null)
    setGuardando(true)

    try {
      const resultado =
        await actualizarValorHora(
          Number(valor)
        )

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setMensaje(
        'Valor por hora actualizado correctamente.'
      )
    } catch (err) {
      console.error(err)
      setError(
        'Ocurrió un error inesperado.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">
        Valor por hora de los trabajadores
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Este valor se utiliza automáticamente para
        calcular las liquidaciones semanales.
      </p>

      <div className="mt-4 flex max-w-md items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="valor-hora"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Valor por hora
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>

            <input
              id="valor-hora"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) =>
                setValor(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm outline-none focus:border-gray-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {guardando
            ? 'Guardando...'
            : 'Guardar'}
        </button>
      </div>

      {mensaje && (
        <p className="mt-3 text-sm text-green-600">
          {mensaje}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}