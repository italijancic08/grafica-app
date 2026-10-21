'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarUsuario } from '@/lib/services/usuarios'

export default function BotonEliminarUsuario({
  id,
  nombre,
  esPropio,
}: {
  id: string
  nombre: string
  esPropio: boolean
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleEliminar() {
    setError(null)
    setCargando(true)

    try {
      const resultado = await eliminarUsuario(id)

      if (resultado.error) {
        setError(resultado.error)
        setConfirmando(false)
        return
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
      setConfirmando(false)
    } finally {
      setCargando(false)
    }
  }

  if (esPropio) {
    return <span className="text-xs text-gray-400">Tu usuario</span>
  }

  return (
    <div className="flex flex-col items-end">
      {confirmando ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">¿Eliminar a {nombre}?</span>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={cargando}
            className="font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {cargando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={cargando}
            className="font-medium text-gray-900 hover:underline disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Eliminar
        </button>
      )}

      {error && <p className="mt-1 max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  )
}