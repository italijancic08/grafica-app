'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { formatearMoneda } from '@/lib/utils/formato'
import { LISTA_POLARIZADOS, precioTarjeta } from '@/lib/data/lista-precios-polarizados'

export default function ListaPolarizados() {
  const [busqueda, setBusqueda] = useState('')
  const total = LISTA_POLARIZADOS.reduce((suma, g) => suma + g.items.length, 0)

  const secciones = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return LISTA_POLARIZADOS.map(grupo => ({
      ...grupo,
      items: grupo.items.filter(i =>
        !q || [i.vehiculo, i.categoria].some(v => (v ?? '').toLowerCase().includes(q))),
    })).filter(g => g.items.length)
  }, [busqueda])

  return <div>
    <div className="mb-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Lista de precios polarizados</h1>
      <p className="text-sm text-gray-500">
        {total} artículos en {LISTA_POLARIZADOS.length} rubros. Tarjeta: 6 pagos sin interés.
      </p>
    </div>
    <div className="relative mb-6">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por vehículo o categoría..."
        className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm sm:max-w-md" />
    </div>
    {!secciones.length && <p className="text-sm text-gray-500">No se encontraron artículos.</p>}
    <div className="space-y-3">{secciones.map(grupo =>
      <details key={`${grupo.titulo}-${busqueda ? 'busqueda' : 'normal'}`}
        open={busqueda.trim() ? true : undefined} className="group rounded-lg border border-gray-200">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">{grupo.titulo}</span>
          <span className="flex items-center gap-2 text-xs text-gray-400">
            {grupo.items.length} artículo{grupo.items.length === 1 ? '' : 's'}
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Vehículo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">{grupo.etiquetaCategoria ?? 'Categoría'}</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Efectivo</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Tarjeta
                <span className="block text-xs font-normal text-gray-400">6 pagos sin interés</span>
              </th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200 bg-white">{grupo.items.map((item, i) =>
              <tr key={`${item.vehiculo}-${item.categoria}-${i}`} className="align-top">
                <td className="px-4 py-2 font-medium text-gray-900">{item.vehiculo}</td>
                <td className="px-4 py-2">{item.categoria
                  ? <span className="inline-block whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{item.categoria}</span>
                  : <span className="text-gray-400">—</span>}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">{formatearMoneda(item.efectivo)}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">{formatearMoneda(precioTarjeta(item.efectivo, grupo.recargoTarjeta))}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </details>)}</div>
  </div>
}