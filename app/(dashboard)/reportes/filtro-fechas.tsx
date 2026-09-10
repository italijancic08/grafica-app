'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function FiltroFechas({ desde, hasta }: { desde: string; hasta: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function actualizar(clave: 'desde' | 'hasta', valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(clave, valor)
    router.push(`/reportes?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Desde</label>
        <input
          type="date"
          defaultValue={desde}
          onChange={(e) => actualizar('desde', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Hasta</label>
        <input
          type="date"
          defaultValue={hasta}
          onChange={(e) => actualizar('hasta', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
    </div>
  )
}