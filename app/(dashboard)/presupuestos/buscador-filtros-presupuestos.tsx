'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function BuscadorFiltrosPresupuestos({ vista }: { vista: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qActual = searchParams.get('q') ?? ''

  const [valor, setValor] = useState(qActual)

  const base = vista === 'pendientes' ? '/presupuestos' : `/presupuestos?ver=${vista}`

  // Busca automáticamente 300 ms después de dejar de escribir
  useEffect(() => {
    if (valor.trim() === qActual) return
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (valor.trim()) params.set('q', valor.trim())
      else params.delete('q')
      const qs = params.toString()
      router.replace(qs ? `/presupuestos?${qs}` : '/presupuestos')
    }, 300)
    return () => clearTimeout(timer)
  }, [valor, qActual, searchParams, router])

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 focus-within:border-gray-500 sm:max-w-md">
          <Search size={16} className="shrink-0 text-gray-500" />
          <input
            type="search"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Buscar por número, cliente, teléfono, descripción..."
            aria-label="Buscar presupuestos"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {valor && (
            <button
              type="button"
              onClick={() => setValor('')}
              aria-label="Borrar búsqueda"
              className="shrink-0 text-gray-400 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {qActual && (
          <Link
            href={base}
            onClick={() => setValor('')}
            className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
          >
            Limpiar
          </Link>
        )}
      </div>
    </div>
  )
}