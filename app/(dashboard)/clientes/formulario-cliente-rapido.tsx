'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearCliente } from '@/lib/services/clientes'

export default function FormularioClienteRapido() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const resultado = await crearCliente({ nombre_razon_social: nombre, telefono })

    setCargando(false)

    if (resultado.error) {
      setError(resultado.error)
      return
    }

    setNombre('')
    setTelefono('')
    setAbierto(false)
    router.refresh()
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Nuevo cliente
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Nombre / Razón social</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Teléfono</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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