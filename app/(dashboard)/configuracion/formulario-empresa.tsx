'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarEmpresa } from '@/lib/services/empresa'
import type { Empresa } from '@/lib/types/empresa'

export default function FormularioEmpresa({ empresa }: { empresa: Empresa | null }) {
  const router = useRouter()
  const [nombre, setNombre] = useState(empresa?.nombre ?? '')
  const [cuit, setCuit] = useState(empresa?.cuit ?? '')
  const [direccion, setDireccion] = useState(empresa?.direccion ?? '')
  const [telefono, setTelefono] = useState(empresa?.telefono ?? '')
  const [email, setEmail] = useState(empresa?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardado(false)
    setCargando(true)

    try {
      const resultado = await actualizarEmpresa({ nombre, cuit, direccion, telefono, email })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setGuardado(true)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Nombre / Razón social *</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">CUIT</label>
        <input
          value={cuit}
          onChange={(e) => setCuit(e.target.value)}
          placeholder="XX-XXXXXXXX-X"
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Dirección</label>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Teléfono</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {guardado && !error && <p className="text-sm text-green-700">Datos guardados.</p>}

      <button
        type="submit"
        disabled={cargando}
        className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {cargando ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}