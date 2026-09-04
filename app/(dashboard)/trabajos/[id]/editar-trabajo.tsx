'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarTrabajo } from '@/lib/services/trabajos'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import { formatearMoneda } from '@/lib/utils/formato'

export default function EditarTrabajo({
  trabajoId,
  descripcion,
  rubro,
  fechaMaxima,
  precioFinal,
}: {
  trabajoId: string
  descripcion: string
  rubro: RubroTrabajo
  fechaMaxima: string | null
  precioFinal: number
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)

  const [descripcionForm, setDescripcionForm] = useState(descripcion)
  const [rubroForm, setRubroForm] = useState<RubroTrabajo>(rubro)
  const [fechaMaximaForm, setFechaMaximaForm] = useState(fechaMaxima ?? '')
  const [precioFinalForm, setPrecioFinalForm] = useState(String(precioFinal))
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  function handleCancelar() {
    setDescripcionForm(descripcion)
    setRubroForm(rubro)
    setFechaMaximaForm(fechaMaxima ?? '')
    setPrecioFinalForm(String(precioFinal))
    setError(null)
    setEditando(false)
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await actualizarTrabajo(trabajoId, {
        descripcion: descripcionForm,
        rubro: rubroForm,
        fecha_maxima: fechaMaximaForm,
        precio_final: Number(precioFinalForm),
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setEditando(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  if (editando) {
    return (
      <div className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Editar trabajo</h2>
        <form onSubmit={handleGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Rubro</label>
            <select
              required
              value={rubroForm}
              onChange={(e) => setRubroForm(e.target.value as RubroTrabajo)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:w-80"
            >
              {Object.entries(ETIQUETAS_RUBRO_TRABAJO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Descripción</label>
            <textarea
              required
              value={descripcionForm}
              onChange={(e) => setDescripcionForm(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Fecha máxima</label>
              <input
                type="date"
                value={fechaMaximaForm}
                onChange={(e) => setFechaMaximaForm(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Precio final</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={precioFinalForm}
                onChange={(e) => setPrecioFinalForm(e.target.value)}
                className="w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cargando}
              className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={handleCancelar}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Descripción
          <span className="ml-2 font-normal text-gray-500">· {ETIQUETAS_RUBRO_TRABAJO[rubro]}</span>
        </h2>
        <button
          onClick={() => setEditando(true)}
          className="text-xs font-medium text-gray-600 hover:underline"
        >
          Editar
        </button>
      </div>
      <p className="text-sm text-gray-700">{descripcion}</p>
      <p className="mt-2 text-xs text-gray-400">Precio final: {formatearMoneda(precioFinal)}</p>
    </div>
  )
}