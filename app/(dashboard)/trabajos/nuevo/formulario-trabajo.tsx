'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearTrabajo } from '@/lib/services/trabajos'
import type { Cliente } from '@/lib/types/cliente'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import SelectorCliente from '../../clientes/selector-cliente'

export default function FormularioTrabajo({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter()

  const [clienteId, setClienteId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [rubro, setRubro] = useState<RubroTrabajo | ''>('')
  const [fechaMaxima, setFechaMaxima] = useState('')
  const [precioFinal, setPrecioFinal] = useState('')
  const [anchoCm, setAnchoCm] = useState('')
  const [largoCm, setLargoCm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const m2 = Number(anchoCm) > 0 && Number(largoCm) > 0
    ? (Number(anchoCm) / 100) * (Number(largoCm) / 100)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!clienteId) {
      setError('Seleccioná un cliente')
      return
    }

    setCargando(true)

    try {
      const resultado = await crearTrabajo({
        cliente_id: clienteId,
        descripcion,
        rubro: rubro || undefined,
        fecha_maxima: fechaMaxima,
        // Si queda vacío, el presupuesto se guarda "sin definir" y se completa más adelante
        precio_final: precioFinal.trim() === '' ? undefined : Number(precioFinal),
        ancho_cm: anchoCm ? Number(anchoCm) : undefined,
        largo_cm: largoCm ? Number(largoCm) : undefined,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      router.push(`/trabajos/${resultado.data.id}`)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border border-gray-200 p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Cliente</label>
        <SelectorCliente clientes={clientes} clienteId={clienteId} onChange={setClienteId} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Rubro
          <span className="ml-1 font-normal text-gray-400">(se puede definir más adelante)</span>
        </label>
        <select
          value={rubro}
          onChange={(e) => setRubro(e.target.value as RubroTrabajo)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Sin definir</option>
          {Object.entries(ETIQUETAS_RUBRO_TRABAJO).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>{etiqueta}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Descripción del trabajo</label>
        <textarea
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Plazo de entrega</label>
          <input
            type="date"
            value={fechaMaxima}
            onChange={(e) => setFechaMaxima(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Precio
            <span className="ml-1 font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={precioFinal}
            onChange={(e) => setPrecioFinal(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Medidas (opcional)</label>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Ancho (cm)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={anchoCm}
              onChange={(e) => setAnchoCm(e.target.value)}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Largo (cm)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={largoCm}
              onChange={(e) => setLargoCm(e.target.value)}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {m2 !== null && (
            <p className="pb-2 text-sm text-gray-500">= {m2.toFixed(2)} m²</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {cargando ? 'Guardando...' : 'Guardar presupuesto'}
      </button>
    </form>
  )
}