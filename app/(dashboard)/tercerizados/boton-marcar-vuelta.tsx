'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { marcarVuelta } from '@/lib/services/tercerizaciones'

export default function BotonMarcarVuelta({
  tercerizacionId,
  trabajoId,
}: {
  tercerizacionId: string
  trabajoId: string
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)

  async function handleClick() {
    setCargando(true)
    try {
      await marcarVuelta(tercerizacionId, trabajoId)
      router.refresh()
    } finally {
      setCargando(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={cargando}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
    >
      {cargando ? '...' : 'Marcar vuelta'}
    </button>
  )
}