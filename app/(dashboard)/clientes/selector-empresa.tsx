'use client'

import type { EmpresaCliente } from '@/lib/types/empresa-cliente'

// Select reutilizable de empresas. Si se pasa "destacadaId", esa empresa
// aparece primera en la lista (ej: la empresa a la que pertenece el cliente).
export default function SelectorEmpresa({
  empresas,
  valor,
  onChange,
  etiquetaVacia = 'Sin empresa',
  destacadaId,
  className = 'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm',
}: {
  empresas: EmpresaCliente[]
  valor: string
  onChange: (id: string) => void
  etiquetaVacia?: string
  destacadaId?: string
  className?: string
}) {
  const destacada = destacadaId ? empresas.find((e) => e.id === destacadaId) : undefined
  const resto = empresas.filter((e) => e.id !== destacada?.id)

  return (
    <select value={valor} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{etiquetaVacia}</option>
      {destacada && (
        <option value={destacada.id}>{destacada.nombre} (empresa del cliente)</option>
      )}
      {resto.map((e) => (
        <option key={e.id} value={e.id}>{e.nombre}</option>
      ))}
    </select>
  )
}
