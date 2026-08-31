'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearMaterial } from '@/lib/services/materiales'

export default function FormularioMaterial() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [unidadMedida, setUnidadMedida] = useState('')
  const [cantidadActual, setCantidadActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await crearMaterial({
        nombre,
        unidad_medida: unidadMedida,
        cantidad_actual: Number(cantidadActual),
        stock_minimo: Number(stockMinimo),
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setNombre('')
      setUnidadMedida('')
      setCantidadActual('0')
      setStockMinimo('0')
      setAbierto(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Nuevo material
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Nombre</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Unidad (m2, kg, unidad...)</label>
        <input
          required
          value={unidadMedida}
          onChange={(e) => setUnidadMedida(e.target.value)}
          className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Stock inicial</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={cantidadActual}
          onChange={(e) => setCantidadActual(e.target.value)}
          className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Stock mínimo</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
          className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={cargando}
        className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {cargando ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancelar
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}