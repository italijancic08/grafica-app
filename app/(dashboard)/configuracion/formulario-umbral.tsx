'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarUmbralCajaBaja } from '@/lib/services/configuracion'

export default function FormularioUmbral({ umbralActual }: { umbralActual: number }) {
  const router = useRouter()
  const [monto, setMonto] = useState(String(umbralActual))
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardado(false)
    setCargando(true)

    try {
      const resultado = await actualizarUmbralCajaBaja({ monto: Number(monto) })

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
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Avisar cuando la caja física esté por debajo de
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">$</span>
          <input
            type="number"
            min={0}
            step={100}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {guardado && !error && <p className="text-sm text-green-700">Umbral guardado.</p>}

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