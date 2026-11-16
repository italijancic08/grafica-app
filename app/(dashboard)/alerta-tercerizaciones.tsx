'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Truck, X } from 'lucide-react'

const CLAVE_CERRADA = 'alerta-tercerizaciones-cerrada'

// Aviso fijo arriba mientras haya trabajos tercerizados que no volvieron.
// Se puede cerrar; vuelve a aparecer al abrir el sistema en una pestaña nueva.
export default function AlertaTercerizaciones({ cantidad }: { cantidad: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLAVE_CERRADA) !== '1') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function cerrar() {
    setVisible(false)
    try {
      sessionStorage.setItem(CLAVE_CERRADA, '1')
    } catch {
      // si el navegador no permite guardar, el aviso solo se cierra por ahora
    }
  }

  if (!visible) return null

  return (
    <div
      role="alert"
      className="flex items-center gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-sm text-amber-900"
    >
      <Truck size={18} className="shrink-0" />
      <p className="min-w-0 flex-1">
        <span className="font-bold">HAY TERCERIZACIONES:</span>{' '}
        {cantidad} {cantidad === 1 ? 'trabajo tercerizado en curso' : 'trabajos tercerizados en curso'}.
      </p>
      <Link href="/tercerizados" className="shrink-0 font-medium underline hover:no-underline">
        Ver
      </Link>
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar aviso"
        className="shrink-0 rounded p-1 hover:bg-amber-200"
      >
        <X size={16} />
      </button>
    </div>
  )
}