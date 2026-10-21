'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarPermisoGratuito } from '@/lib/services/autorizaciones-gratuitos'

export default function AutorizacionGratuitos({
  tipo, id, permitido, administrador,
}: {
  tipo: 'cliente' | 'empresa'
  id: string
  permitido: boolean
  administrador: boolean
}) {
  const router = useRouter()
  const [activo, setActivo] = useState(permitido)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiar(valor: boolean) {
    if (!administrador || guardando) return
    if (!window.confirm(valor
      ? '¿Autorizar trabajos gratuitos para este registro?'
      : '¿Quitar la autorización para nuevos trabajos gratuitos?')) return

    setGuardando(true)
    setError(null)
    try {
      const resultado = await actualizarPermisoGratuito(tipo, id, valor)
      if ('error' in resultado) {
        setError(resultado.error)
      } else {
        setActivo(valor)
        router.refresh()
      }
    } catch {
      setError('No se pudo modificar la autorización.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Autorización de trabajos gratuitos</h2>
          <p className="mt-1 text-xs text-gray-500">
            {activo ? 'Se permiten trabajos con precio final de $0.' : 'Los trabajos requieren un precio mayor a $0.'}
          </p>
          {!administrador && <p className="mt-1 text-xs text-gray-500">Solo un administrador puede cambiar este permiso.</p>}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={activo} disabled={!administrador || guardando}
            onChange={(e) => cambiar(e.target.checked)} className="h-4 w-4 accent-gray-900" />
          {activo ? 'Habilitado' : 'Deshabilitado'}
        </label>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  )
}
