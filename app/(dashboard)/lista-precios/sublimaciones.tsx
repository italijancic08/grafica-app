'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  guardarSublimacion, borrarSublimacion,
  type DatosSublimacion, type Sublimacion,
} from '@/lib/services/sublimaciones'

const VACIO: DatosSublimacion = {
  articulo: '', tela: null, material: null, temperatura: null,
  tiempo: null, presion: null, nota: null,
}

export default function Sublimaciones({ items, administrador, error }: {
  items: Sublimacion[]
  administrador: boolean
  error?: string
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<string | null | undefined>(undefined)
  const [form, setForm] = useState<DatosSublimacion>(VACIO)
  const [errorForm, setErrorForm] = useState('')
  const [guardando, setGuardando] = useState(false)

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return items
    return items.filter(i => [i.articulo, i.tela, i.material, i.nota]
      .some(v => (v ?? '').toLowerCase().includes(q)))
  }, [items, busqueda])

  function abrir(item?: Sublimacion) {
    setEditando(item?.id ?? null)
    setForm(item ? {
      articulo: item.articulo, tela: item.tela, material: item.material,
      temperatura: item.temperatura, tiempo: item.tiempo, presion: item.presion, nota: item.nota,
    } : VACIO)
    setErrorForm('')
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorForm('')
    try {
      const resultado = await guardarSublimacion(editando ?? null, form)
      if ('error' in resultado && resultado.error) { setErrorForm(resultado.error); return }
      setEditando(undefined)
      router.refresh()
    } catch { setErrorForm('No se pudo guardar el artículo.') }
    finally { setGuardando(false) }
  }

  async function borrar(item: Sublimacion) {
    if (!window.confirm(`¿Eliminar «${item.articulo}» de sublimaciones?`)) return
    setGuardando(true)
    try {
      const resultado = await borrarSublimacion(item.id)
      if ('error' in resultado && resultado.error) { window.alert(resultado.error); return }
      router.refresh()
    } catch { window.alert('No se pudo eliminar el artículo.') }
    finally { setGuardando(false) }
  }

  function campo(nombre: keyof DatosSublimacion, etiqueta: string, obligatorio = false) {
    const valor = form[nombre]
    return <label className="block text-sm font-medium text-gray-700">{etiqueta}
      <input required={obligatorio} maxLength={500} value={valor ?? ''}
        onChange={e => setForm(prev => ({ ...prev, [nombre]: e.target.value || (obligatorio ? '' : null) }))}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
    </label>
  }

  if (error) {
    return <div>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Sublimaciones</h1>
      <p className="text-sm text-red-600">
        No se pudo cargar la lista de sublimaciones: {error}. Verificá que se haya ejecutado la migración 0032.
      </p>
    </div>
  }

  const columnas = ['Artículo', 'Tela', 'Material', 'Temperatura', 'Tiempo', 'Presión', 'Nota']

  return <div>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Sublimaciones</h1>
        <p className="text-sm text-gray-500">{items.length} artículo{items.length === 1 ? '' : 's'}.</p>
      </div>
      {administrador && <button onClick={() => abrir()} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
        <Plus size={16} /> Nuevo artículo
      </button>}
    </div>
    <div className="relative mb-6">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por artículo, tela o material..."
        className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm sm:max-w-md" />
    </div>

    {!filtrados.length
      ? <p className="text-sm text-gray-500">{items.length ? 'No se encontraron artículos.' : 'Todavía no hay artículos cargados.'}</p>
      : <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr>
            {columnas.map(c => <th key={c} className="px-4 py-2 text-left font-medium text-gray-500">{c}</th>)}
            {administrador && <th className="px-4 py-2 text-right font-medium text-gray-500">Acciones</th>}
          </tr></thead>
          <tbody className="divide-y divide-gray-200 bg-white">{filtrados.map(item =>
            <tr key={item.id} className="align-top">
              <td className="px-4 py-2 font-medium text-gray-900">{item.articulo}</td>
              <td className="px-4 py-2 text-gray-600">{item.tela ?? '—'}</td>
              <td className="px-4 py-2 text-gray-600">{item.material ?? '—'}</td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-600">{item.temperatura ?? '—'}</td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-600">{item.tiempo ?? '—'}</td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-600">{item.presion ?? '—'}</td>
              <td className="px-4 py-2 text-gray-600">{item.nota ?? '—'}</td>
              {administrador && <td className="whitespace-nowrap px-4 py-2 text-right">
                <button title="Editar" onClick={() => abrir(item)} className="mr-2 rounded p-1 text-gray-600 hover:bg-gray-100"><Pencil size={16} /></button>
                <button title="Eliminar" disabled={guardando} onClick={() => borrar(item)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
              </td>}
            </tr>)}</tbody>
        </table>
      </div>}

    {editando !== undefined && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{editando === null ? 'Nuevo artículo' : 'Editar artículo'}</h2>
          <button aria-label="Cerrar" disabled={guardando} onClick={() => setEditando(undefined)} className="rounded p-1 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
        </div>
        <form onSubmit={guardar} className="space-y-3">
          {campo('articulo', 'Artículo', true)}
          <div className="grid gap-3 sm:grid-cols-2">
            {campo('tela', 'Tela')}{campo('material', 'Material')}
            {campo('temperatura', 'Temperatura')}{campo('tiempo', 'Tiempo')}
            {campo('presion', 'Presión')}
          </div>
          {campo('nota', 'Nota')}
          {errorForm && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{errorForm}</p>}
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