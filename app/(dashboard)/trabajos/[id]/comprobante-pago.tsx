'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adjuntarComprobantePago } from '@/lib/services/pagos'
import { obtenerUrlDescargaComprobante } from '@/lib/services/facturas'
import { subirComprobantePago } from '@/lib/utils/subir-comprobante-pago'
import type { Pago } from '@/lib/types/pago'

// Estado del comprobante de una transferencia: permite verlo y adjuntarlo
// (o reemplazarlo) en cualquier momento, incluso con el mes de caja cerrado,
// porque no modifica ningún importe.
export default function ComprobantePago({ pago }: { pago: Pago }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleVer() {
    if (!pago.comprobante_url) return
    setError(null)
    setCargando(true)
    try {
      const resultado = await obtenerUrlDescargaComprobante(pago.comprobante_url)
      if (resultado.error || !resultado.data) {
        setError(resultado.error ?? 'No se pudo abrir el comprobante.')
        return
      }
      window.open(resultado.data, '_blank')
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  async function handleAdjuntar(archivo: File) {
    setError(null)
    setCargando(true)
    try {
      const subida = await subirComprobantePago(pago.trabajo_id, pago.id, archivo)
      if (subida.error || !subida.ruta) {
        setError(subida.error ?? 'No se pudo subir el archivo.')
        return
      }

      const resultado = await adjuntarComprobantePago(pago.id, subida.ruta)
      if (resultado.error) {
        setError(resultado.error)
        return
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      {pago.comprobante_url ? (
        <button
          type="button"
          onClick={handleVer}
          disabled={cargando}
          className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
        >
          Ver comprobante
        </button>
      ) : (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            pago.comprobante_exento ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          Sin comprobante
        </span>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={cargando}
        className="text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
      >
        {cargando ? 'Procesando...' : pago.comprobante_url ? 'Reemplazar' : 'Adjuntar'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          e.target.value = ''
          if (archivo) handleAdjuntar(archivo)
        }}
      />

      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </div>
  )
}