'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarMovimiento } from '@/lib/services/materiales'
import type { Material, TipoMovimiento } from '@/lib/types/material'

export default function FilaMaterial({ material }: { material: Material }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoMovimiento>('ingreso')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const stockBajo = material.cantidad_actual <= material.stock_minimo

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await registrarMovimiento({
        material_id: material.id,
        tipo,
        cantidad: Number(cantidad),
        observacion,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setCantidad('')
      setObservacion('')
      setAbierto(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2 font-medium">{material.nombre}</td>
        <td className="px-4 py-2">{material.unidad_medida}</td>
        <td className={`px-4 py-2 ${stockBajo ? 'font-medium text-red-600' : ''}`}>
          {material.cantidad_actual} {stockBajo && '⚠️'}
        </td>
        <td className="px-4 py-2">{material.stock_minimo}</td>
        <td className="px-4 py-2 text-right">
          <button
            onClick={() => setAbierto((v) => !v)}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            {abierto ? 'Cerrar' : 'Movimiento'}
          </button>
        </td>
      </tr>
      {abierto && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Observación</label>
                <input
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Registrar'}
              </button>
              {error && <p className="w-full text-sm text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  )
}