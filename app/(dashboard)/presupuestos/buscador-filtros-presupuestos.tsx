'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'

const OPCIONES_ESTADO = [
  { valor: 'pendiente', etiqueta: 'Pendiente de presupuestar' },
  { valor: 'enviado', etiqueta: 'Presupuesto enviado' },
]

export default function BuscadorFiltrosPresupuestos({
  estadoActivo,
  conteos,
  total,
  verRechazados,
}: {
  estadoActivo: string | null
  conteos: Record<string, number>
  total: number
  verRechazados: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qActual = searchParams.get('q') ?? ''

  const [valor, setValor] = useState(qActual)
  const [abierto, setAbierto] = useState(false)

  const base = verRechazados ? '/presupuestos?ver=rechazados' : '/presupuestos'

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

  // Los links de estado conservan la búsqueda actual
  function hrefEstado(estado: string | null) {
    const params = new URLSearchParams()
    if (verRechazados) params.set('ver', 'rechazados')
    if (qActual) params.set('q', qActual)
    if (estado) params.set('estado', estado)
    const qs = params.toString()
    return qs ? `/presupuestos?${qs}` : '/presupuestos'
  }

  const pastilla = (activo: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      activo ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`

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

        {!verRechazados && (
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
              abierto || estadoActivo
                ? 'border-gray-900 text-gray-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {estadoActivo && <span className="h-2 w-2 rounded-full bg-gray-900" />}
            <ChevronDown size={16} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
          </button>
        )}

        {(qActual || estadoActivo) && (
          <Link
            href={base}
            onClick={() => setValor('')}
            className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
          >
            Limpiar
          </Link>
        )}
      </div>

      {!verRechazados && abierto && (
        <div className="mt-3 rounded-lg border border-gray-200 p-4">
          <p className="mb-2 text-xs font-medium text-gray-700">Estado</p>
          <div className="flex flex-wrap gap-2">
            <Link href={hrefEstado(null)} className={pastilla(!estadoActivo)}>
              Todos ({total})
            </Link>
            {OPCIONES_ESTADO.map((o) => (
              <Link key={o.valor} href={hrefEstado(o.valor)} className={pastilla(estadoActivo === o.valor)}>
                {o.etiqueta} ({conteos[o.valor] ?? 0})
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}