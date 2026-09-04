'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearPresupuesto } from '@/lib/services/presupuestos'
import type { Cliente } from '@/lib/types/cliente'

export default function FormularioPresupuesto({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await crearPresupuesto({
        cliente_id: clienteId,
        descripcion,
        monto: Number(monto),
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setClienteId('')
      setDescripcion('')
      setMonto('')
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
        + Nuevo presupuesto
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Cliente</label>
        <select
          required
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre_razon_social}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Descripción</label>
        <input
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Monto</label>
        <input
          type="number"
          step="0.01"
          min="0"
          required
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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