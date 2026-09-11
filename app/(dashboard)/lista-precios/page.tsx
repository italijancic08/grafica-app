'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { LISTA_PRECIOS, RUBROS_PRECIOS, type ItemPrecio } from '@/lib/data/lista-precios'
import { formatearMoneda } from '@/lib/utils/formato'

function tituloRubro(rubro: string): string {
  return rubro
    .toLowerCase()
    .split(' ')
    .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ')
}

function FilaItem({ item }: { item: ItemPrecio }) {
  const tienePrecio = item.precio !== null && item.precio !== 0

  return (
    <tr className="align-top">
      <td className="px-4 py-2">
        <p className="font-medium text-gray-900">{item.nombre}</p>
        {item.nota && <p className="mt-0.5 text-xs text-gray-500">{item.nota}</p>}
      </td>
      <td className="px-4 py-2 text-gray-600">
        {[item.medida, item.material].filter(Boolean).join(' · ') || '—'}
      </td>
      <td className="px-4 py-2 text-gray-600">{item.cantidad ?? '—'}</td>
      <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">
        {tienePrecio ? formatearMoneda(item.precio as number) : (item.precioTexto ?? 'Consultar')}
        {item.minimo !== null && item.minimo !== 0 && (
          <p className="text-xs font-normal text-gray-400">mín. {formatearMoneda(item.minimo)}</p>
        )}
        {item.minimo === null && item.minimoTexto && (
          <p className="text-xs font-normal text-gray-400">mín. {item.minimoTexto}</p>
        )}
      </td>
    </tr>
  )
}

function SeccionRubro({ rubro, items, forzarAbierto }: { rubro: string; items: ItemPrecio[]; forzarAbierto: boolean }) {
  return (
    <details open={forzarAbierto} className="group rounded-lg border border-gray-200">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">{tituloRubro(rubro)}</span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{items.length} artículo{items.length === 1 ? '' : 's'}</span>
          <ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="overflow-hidden border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Artículo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Medida / Material</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cantidad</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Precio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item, i) => <FilaItem key={i} item={item} />)}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export default function ListaPreciosPage() {
  const [busqueda, setBusqueda] = useState('')

  const hayBusqueda = busqueda.trim().length > 0

  const secciones = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return RUBROS_PRECIOS.map((rubro) => {
      const items = LISTA_PRECIOS.filter((item) => {
        if (item.rubro !== rubro) return false
        if (!texto) return true
        return (
          item.nombre.toLowerCase().includes(texto) ||
          (item.material?.toLowerCase().includes(texto) ?? false) ||
          (item.medida?.toLowerCase().includes(texto) ?? false)
        )
      })
      return { rubro, items }
    }).filter((s) => s.items.length > 0)
  }, [busqueda])

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Lista de precios</h1>
      <p className="mb-6 text-sm text-gray-500">{LISTA_PRECIOS.length} artículos en {RUBROS_PRECIOS.length} rubros.</p>

      <div className="relative mb-6">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por artículo, material o medida..."
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm sm:max-w-md"
        />
      </div>

      {secciones.length === 0 && <p className="text-sm text-gray-500">No se encontraron artículos.</p>}

      <div className="space-y-3">
        {secciones.map(({ rubro, items }) => (
          <SeccionRubro key={rubro} rubro={rubro} items={items} forzarAbierto={hayBusqueda} />
        ))}
      </div>
    </div>
  )
}