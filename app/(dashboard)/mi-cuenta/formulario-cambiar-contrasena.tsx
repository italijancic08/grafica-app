'use client'

import { useState } from 'react'
import { cambiarContrasena } from '@/lib/services/auth'

export default function FormularioCambiarContrasena() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setMensaje(null)
    setError(null)

    if (nueva !== confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña.')
      return
    }

    setGuardando(true)

    try {
      const resultado = await cambiarContrasena(actual, nueva)

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setMensaje('Contraseña actualizada correctamente.')
      setActual('')
      setNueva('')
      setConfirmacion('')
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mt-6 max-w-sm rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        Cambiar contraseña
      </h2>

      <form onSubmit={guardar} className="space-y-3">
        <div>
          <label
            htmlFor="contrasena-actual"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Contraseña actual
          </label>
          <input
            id="contrasena-actual"
            type="password"
            required
            autoComplete="current-password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="contrasena-nueva"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Nueva contraseña
          </label>
          <input
            id="contrasena-nueva"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres.</p>
        </div>

        <div>
          <label
            htmlFor="contrasena-confirmacion"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Repetir nueva contraseña
          </label>
          <input
            id="contrasena-confirmacion"
            type="password"
            required
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {mensaje && <p className="text-sm text-green-600">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  )
}