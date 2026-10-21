'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { formatearMoneda } from '@/lib/utils/formato'
import { guardarPrecio, borrarPrecio, type DatosPrecio, type ItemEditable } from '@/lib/services/lista-precios'
import { useRouter } from 'next/navigation'

const VACIO: DatosPrecio = {
  rubro: '', nombre: '', medida: null, material: null, cantidad: '1',
  precio: null, precioTexto: null, minimo: null, minimoTexto: null, nota: null,
}

function titulo(rubro: string) {
  return rubro.toLowerCase().split(' ').map(p => p ? p[0].toUpperCase() + p.slice(1) : p).join(' ')
}

export default function GestionPrecios({ iniciales, administrador }: {
  iniciales: ItemEditable[]
  administrador: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState(iniciales)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<string | null | undefined>(undefined)
  const [form, setForm] = useState<DatosPrecio>(VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const rubros = useMemo(() => Array.from(new Set(items.map(i => i.rubro))).sort(), [items])
  const secciones = useMemo(() => rubros.map(rubro => ({
    rubro,
    items: items.filter(i => i.rubro === rubro && [i.nombre, i.material, i.medida, i.nota]
      .some(valor => (valor ?? '').toLowerCase().includes(busqueda.trim().toLowerCase()))),
  })).filter(s => s.items.length), [rubros, items, busqueda])

  function abrir(item?: ItemEditable) {
    setEditando(item?.clave ?? null)
    setForm(item ? {
      rubro: item.rubro, nombre: item.nombre, medida: item.medida,
      material: item.material, cantidad: item.cantidad, precio: item.precio,
      precioTexto: item.precioTexto, minimo: item.minimo,
      minimoTexto: item.minimoTexto, nota: item.nota,
    } : { ...VACIO, rubro: rubros[0] ?? '' })
    setError('')
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const resultado = await guardarPrecio(editando ?? null, form)
      if ('error' in resultado && resultado.error) { setError(resultado.error); return }
      // Actualizar valores al volver a consultar el servidor.
      window.location.reload()
    } catch { setError('No se pudo guardar el artículo.') }
    finally { setGuardando(false) }
  }

  async function borrar(item: ItemEditable) {
    if (!window.confirm(`¿Eliminar «${item.nombre}» de la lista de precios?`)) return
    setGuardando(true)
    try {
      const resultado = await borrarPrecio(item.clave)
      if ('error' in resultado && resultado.error) { window.alert(resultado.error); return }
      setItems(prev => prev.filter(p => p.clave !== item.clave))
      router.refresh()
    } catch { window.alert('No se pudo eliminar el artículo.') }
    finally { setGuardando(false) }
  }

  function campoTexto(nombre: keyof DatosPrecio, etiqueta: string, obligatorio = false) {
    const valor = form[nombre]
    return <label className="block text-sm font-medium text-gray-700">{etiqueta}
      <input required={obligatorio} maxLength={500} value={valor === null ? '' : String(valor)}
        onChange={e => setForm(prev => ({ ...prev, [nombre]: e.target.value || (obligatorio ? '' : null) }))}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
    </label>
  }

  function campoNumero(nombre: 'precio' | 'minimo', etiqueta: string) {
    return <label className="block text-sm font-medium text-gray-700">{etiqueta}
      <input type="number" min="0" step="0.01" value={form[nombre] ?? ''}
        onChange={e => setForm(prev => ({ ...prev, [nombre]: e.target.value === '' ? null : Number(e.target.value) }))}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
    </label>
  }

  return <div className="p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Lista de precios</h1>
        <p className="text-sm text-gray-500">{items.length} artículos en {rubros.length} rubros.</p>
      </div>
      {administrador && <button onClick={() => abrir()} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
        <Plus size={16} /> Nuevo producto / servicio
      </button>}
    </div>
    <div className="relative mb-6">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por artículo, material o medida..."
        className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm sm:max-w-md" />
    </div>
    {!secciones.length && <p className="text-sm text-gray-500">No se encontraron artículos.</p>}
    <div className="space-y-3">{secciones.map(({ rubro, items: grupo }) =>
      <details key={`${rubro}-${busqueda ? 'busqueda' : 'normal'}`} open={busqueda.trim() ? true : undefined}
        className="group rounded-lg border border-gray-200">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">{titulo(rubro)}</span>
          <span className="flex items-center gap-2 text-xs text-gray-400">{grupo.length} artículo{grupo.length === 1 ? '' : 's'}
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Artículo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Medida / Material</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cantidad</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Precio</th>
              {administrador && <th className="px-4 py-2 text-right font-medium text-gray-500">Acciones</th>}
            </tr></thead>
            <tbody className="divide-y divide-gray-200 bg-white">{grupo.map(item =>
              <tr key={item.clave} className="align-top">
                <td className="px-4 py-2"><p className="font-medium text-gray-900">{item.nombre}</p>
                  {item.nota && <p className="mt-0.5 text-xs text-gray-500">{item.nota}</p>}</td>
                <td className="px-4 py-2 text-gray-600">{[item.medida, item.material].filter(Boolean).join(' · ') || '—'}</td>
                <td className="px-4 py-2 text-gray-600">{item.cantidad ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">
                  {item.precio !== null && item.precio !== 0 ? formatearMoneda(item.precio) : (item.precioTexto ?? 'Consultar')}
                  {item.minimo !== null && item.minimo !== 0 && <p className="text-xs font-normal text-gray-400">mín. {formatearMoneda(item.minimo)}</p>}
                  {item.minimo === null && item.minimoTexto && <p className="text-xs font-normal text-gray-400">mín. {item.minimoTexto}</p>}
                </td>
                {administrador && <td className="whitespace-nowrap px-4 py-2 text-right">
                  <button title="Editar" onClick={() => abrir(item)} className="mr-2 rounded p-1 text-gray-600 hover:bg-gray-100"><Pencil size={16} /></button>
                  <button title="Eliminar" disabled={guardando} onClick={() => borrar(item)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                </td>}
              </tr>)}</tbody>
          </table>
        </div>
      </details>)}</div>

    {editando !== undefined && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{editando === null ? 'Nuevo producto / servicio' : 'Editar producto / servicio'}</h2>
          <button aria-label="Cerrar" disabled={guardando} onClick={() => setEditando(undefined)} className="rounded p-1 text-gray-500 hover:bg-gray-100"><X size={20}/></button>
        </div>
        <form onSubmit={guardar} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Rubro
            <input list="rubros-precios" required value={form.rubro} onChange={e => setForm(prev => ({ ...prev, rubro: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <datalist id="rubros-precios">{rubros.map(r => <option value={r} key={r}/>)}</datalist>
          </label>
          {campoTexto('nombre', 'Nombre del producto / servicio', true)}
          <div className="grid gap-3 sm:grid-cols-2">{campoTexto('medida', 'Medida')}{campoTexto('material', 'Material')}
            {campoTexto('cantidad', 'Cantidad')}{campoNumero('precio', 'Precio ($)')}
            {campoTexto('precioTexto', 'Precio en texto (opcional)')}{campoNumero('minimo', 'Precio mínimo ($)')}
          </div>
          {campoTexto('minimoTexto', 'Mínimo en texto (opcional)')}
          {campoTexto('nota', 'Observaciones')}
          {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <button type="button" disabled={guardando} onClick={() => setEditando(undefined)} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={guardando} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>}
  </div>
}
