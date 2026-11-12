'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarFotoTrabajo, eliminarFotoTrabajo } from '@/lib/services/fotos-trabajo'
import { subirFotoTrabajo } from '@/lib/utils/subir-foto-trabajo'
import type { FotoTrabajo } from '@/lib/types/foto-trabajo'

export default function FotosTrabajo({
  trabajoId,
  fotos,
  editable,
}: {
  trabajoId: string
  fotos: FotoTrabajo[]
  editable: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (archivos.length === 0) return

    setError(null)

    try {
      for (let i = 0; i < archivos.length; i++) {
        setSubiendo(`Subiendo ${i + 1} de ${archivos.length}...`)

        const subida = await subirFotoTrabajo(trabajoId, archivos[i])
        if (subida.error || !subida.ruta) {
          setError(subida.error ?? 'No se pudo subir la foto.')
          break
        }

        const registro = await registrarFotoTrabajo(trabajoId, subida.ruta, archivos[i].name)
        if (registro.error) {
          setError(registro.error)
          break
        }
      }
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado al subir las fotos.')
    } finally {
      setSubiendo(null)
      router.refresh()
    }
  }

  async function handleEliminar(fotoId: string) {
    setError(null)
    setEliminandoId(fotoId)

    try {
      const resultado = await eliminarFotoTrabajo(fotoId, trabajoId)
      if (resultado.error) {
        setError(resultado.error)
        return
      }
      setConfirmandoId(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setEliminandoId(null)
    }
  }

  if (!editable && fotos.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Fotos ({fotos.length})</h2>

        {editable && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleArchivos}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!!subiendo}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {subiendo ?? '+ Agregar fotos'}
            </button>
          </>
        )}
      </div>

      {fotos.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay fotos cargadas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((foto) => (
            <div key={foto.id} className="overflow-hidden rounded-md border border-gray-200">
              {foto.url ? (
                <a href={foto.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto.url}
                    alt={foto.nombre ?? 'Foto del trabajo'}
                    className="h-32 w-full object-cover"
                  />
                </a>
              ) : (
                <div className="flex h-32 items-center justify-center bg-gray-100 text-xs text-gray-500">
                  No disponible
                </div>
              )}

              {editable && (
                <div className="p-2">
                  {confirmandoId === foto.id ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEliminar(foto.id)}
                        disabled={eliminandoId === foto.id}
                        className="flex-1 rounded bg-red-700 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {eliminandoId === foto.id ? 'Borrando...' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoId(null)}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(foto.id)}
                      className="w-full rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}