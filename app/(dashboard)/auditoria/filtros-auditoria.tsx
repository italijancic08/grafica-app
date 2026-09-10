'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ETIQUETAS_ACCION, ETIQUETAS_ENTIDAD } from '@/lib/types/auditoria'
import type { Usuario } from '@/lib/types/usuario'

export default function FiltrosAuditoria({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function actualizarFiltro(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) params.set(clave, valor)
    else params.delete(clave)
    router.push(`/auditoria?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Usuario</label>
        <select
          defaultValue={searchParams.get('usuario') ?? ''}
          onChange={(e) => actualizarFiltro('usuario', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Acción</label>
        <select
          defaultValue={searchParams.get('accion') ?? ''}
          onChange={(e) => actualizarFiltro('accion', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todas</option>
          {Object.entries(ETIQUETAS_ACCION).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>{etiqueta}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Entidad</label>
        <select
          defaultValue={searchParams.get('entidad') ?? ''}
          onChange={(e) => actualizarFiltro('entidad', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todas</option>
          {Object.entries(ETIQUETAS_ENTIDAD).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>{etiqueta}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Desde</label>
        <input
          type="date"
          defaultValue={searchParams.get('desde') ?? ''}
          onChange={(e) => actualizarFiltro('desde', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Hasta</label>
        <input
          type="date"
          defaultValue={searchParams.get('hasta') ?? ''}
          onChange={(e) => actualizarFiltro('hasta', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
    </div>
  )
}