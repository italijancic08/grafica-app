
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'
import { editarTercerizacion } from '@/lib/services/tercerizaciones'
import type { Tercerizacion } from '@/lib/types/tercerizacion'

export default function EditarTercerizacion({
  tercerizacion,
}: {
  tercerizacion: Tercerizacion
}) {
  const router = useRouter()

  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [proveedor, setProveedor] = useState(tercerizacion.proveedor)
  const [fechaEnvio, setFechaEnvio] = useState(tercerizacion.fecha_envio)
  const [fechaEstimada, setFechaEstimada] = useState(
    tercerizacion.fecha_estimada_vuelta ?? ''
  )
  const [fechaReal, setFechaReal] = useState(
    tercerizacion.fecha_real_vuelta ?? ''
  )
  const [costo, setCosto] = useState(
    tercerizacion.costo === null
      ? ''
      : String(tercerizacion.costo)
  )

  function cerrar() {
    setAbierto(false)
    setError(null)
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    try {
      const resultado = await editarTercerizacion(tercerizacion.id, {
        proveedor,
        fecha_envio: fechaEnvio,
        fecha_estimada_vuelta: fechaEstimada || null,
        fecha_real_vuelta:
          tercerizacion.estado === 'VUELTO'
            ? fechaReal || null
            : null,
        costo: costo.trim() === '' ? null : Number(costo),
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      cerrar()
      router.refresh()
    } catch {
      setError('No se pudieron guardar los cambios.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        <Pencil size={13} />
        Editar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Editar tercerización
              </h2>

              <button
                type="button"
                onClick={cerrar}
                disabled={cargando}
                aria-label="Cerrar"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Proveedor
                </label>
                <input
                  required
                  minLength={2}
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fecha de envío
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEnvio}
                    onChange={(e) => setFechaEnvio(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Vuelta estimada
                  </label>
                  <input
                    type="date"
                    value={fechaEstimada}
                    onChange={(e) => setFechaEstimada(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {tercerizacion.estado === 'VUELTO' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fecha real de regreso
                  </label>
                  <input
                    type="date"
                    value={fechaReal}
                    onChange={(e) => setFechaReal(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Costo de tercerización
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={cerrar}
                  disabled={cargando}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={cargando}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {cargando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
