'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearTercerizacion } from '@/lib/services/tercerizaciones'
import { ETIQUETAS_ESTADO_TERCERIZACION, type Tercerizacion } from '@/lib/types/tercerizacion'
import { formatearFecha, formatearMoneda } from '@/lib/utils/formato'

export default function SeccionTercerizacion({
  trabajoId,
  tercerizaciones,
}: {
  trabajoId: string
  tercerizaciones: Tercerizacion[]
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [proveedor, setProveedor] = useState('')
  const [fechaEstimada, setFechaEstimada] = useState('')
  const [costo, setCosto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await crearTercerizacion({
        trabajo_id: trabajoId,
        proveedor,
        fecha_estimada_vuelta: fechaEstimada,
        costo: costo ? Number(costo) : undefined,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setProveedor('')
      setFechaEstimada('')
      setCosto('')
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
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Tercerización</h2>
        {!abierto && (
          <button
            onClick={() => setAbierto(true)}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            + Enviar a tercerizar
          </button>
        )}
      </div>

      {abierto && (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Proveedor</label>
            <input
              required
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Vuelta estimada</label>
            <input
              type="date"
              value={fechaEstimada}
              onChange={(e) => setFechaEstimada(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Costo</label>
            <input
              type="number"
              step="0.01"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {cargando ? 'Enviando...' : 'Confirmar envío'}
          </button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </form>
      )}

      {tercerizaciones.length > 0 && (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium text-gray-500">Proveedor</th>
              <th className="px-3 py-1.5 text-left font-medium text-gray-500">Envío</th>
              <th className="px-3 py-1.5 text-left font-medium text-gray-500">Vuelta est.</th>
              <th className="px-3 py-1.5 text-left font-medium text-gray-500">Vuelta real</th>
              <th className="px-3 py-1.5 text-left font-medium text-gray-500">Costo</th>
              <th className="px-3 py-1.5 text-left font-medium text-gray-500">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tercerizaciones.map((tc) => (
              <tr key={tc.id}>
                <td className="px-3 py-1.5">{tc.proveedor}</td>
                <td className="px-3 py-1.5">{formatearFecha(tc.fecha_envio)}</td>
                <td className="px-3 py-1.5">{formatearFecha(tc.fecha_estimada_vuelta)}</td>
                <td className="px-3 py-1.5">{formatearFecha(tc.fecha_real_vuelta)}</td>
                <td className="px-3 py-1.5">{tc.costo ? formatearMoneda(tc.costo) : '—'}</td>
                <td className="px-3 py-1.5">{ETIQUETAS_ESTADO_TERCERIZACION[tc.estado]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}