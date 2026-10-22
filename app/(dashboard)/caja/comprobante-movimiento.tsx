'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adjuntarComprobanteMovimiento } from '@/lib/services/caja'
import { adjuntarComprobantePago } from '@/lib/services/pagos'
import { obtenerUrlDescargaComprobante } from '@/lib/services/facturas'
import { subirComprobanteMovimientoCaja } from '@/lib/utils/subir-comprobante-caja'
import { subirComprobantePago } from '@/lib/utils/subir-comprobante-pago'
import type { MovimientoCaja } from '@/lib/types/caja'

// Estado del comprobante de un movimiento de caja por transferencia: permite
// verlo y adjuntarlo (o reemplazarlo) en cualquier momento, incluso con el mes
// cerrado, porque no modifica ningún importe.
//
// - Movimiento manual: el comprobante se guarda en caja_movimientos.
// - Movimiento generado por un pago de trabajo (pago_id): el comprobante se
//   guarda en el pago, igual que desde la pantalla del trabajo.
export default function ComprobanteMovimiento({ movimiento }: { movimiento: MovimientoCaja }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pagoId = movimiento.pago_id
  const trabajoId = movimiento.trabajo_id
  const esDePago = Boolean(pagoId && trabajoId)

  const rutaActual = esDePago ? movimiento.pagos?.comprobante_url ?? null : movimiento.comprobante_url
  // Solo los pagos anteriores a la función de comprobantes están "exentos".
  // Los movimientos manuales sin comprobante se muestran en gris (es opcional).
  const exento = esDePago ? movimiento.pagos?.comprobante_exento ?? false : true

  async function handleVer() {
    if (!rutaActual) return
    setError(null)
    setCargando(true)
    try {
      const resultado = await obtenerUrlDescargaComprobante(rutaActual)
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
      const subida = pagoId && trabajoId
        ? await subirComprobantePago(trabajoId, pagoId, archivo)
        : await subirComprobanteMovimientoCaja(movimiento.id, archivo)

      if (subida.error || !subida.ruta) {
        setError(subida.error ?? 'No se pudo subir el archivo.')
        return
      }

      const resultado = pagoId && trabajoId
        ? await adjuntarComprobantePago(pagoId, subida.ruta)
        : await adjuntarComprobanteMovimiento(movimiento.id, subida.ruta)

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
      {rutaActual ? (
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
            exento ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
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
        {cargando ? 'Procesando...' : rutaActual ? 'Reemplazar' : 'Adjuntar'}
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