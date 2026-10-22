
'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatearMoneda } from '@/lib/utils/formato'
import {
  guardarPolarizado,
  borrarPolarizado,
  type DatosPolarizado,
  type Polarizado,
} from '@/lib/services/polarizados'

const VACIO: DatosPolarizado = {
  titulo: '',
  vehiculo: '',
  categoria: '',
  efectivo: 0,
  recargoTarjeta: 0.6,
}

export default function ListaPolarizados({
  iniciales,
  administrador,
  error,
}: {
  iniciales: Polarizado[]
  administrador: boolean
  error?: string
}) {
  const router = useRouter()
  const [items, setItems] = useState(iniciales)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<string | null | undefined>(undefined)
  const [form, setForm] = useState<DatosPolarizado>(VACIO)
  const [errorForm, setErrorForm] = useState('')
  const [guardando, setGuardando] = useState(false)

  const secciones = useMemo(() => {
    const q = busqueda.trim().toLowerCase()

    return items
      .filter(i =>
        !q ||
        [i.titulo, i.vehiculo, i.categoria].some(v =>
          (v ?? '').toLowerCase().includes(q)
        )
      )
      .reduce<Array<{ titulo: string; items: Polarizado[] }>>(
        (grupos, item) => {
          let grupo = grupos.find(g => g.titulo === item.titulo)

          if (!grupo) {
            grupo = { titulo: item.titulo, items: [] }
            grupos.push(grupo)
          }

          grupo.items.push(item)
          return grupos
        },
        []
      )
  }, [items, busqueda])

  function abrir(item?: Polarizado) {
    setEditando(item?.id ?? null)
    setForm(item ? {
      titulo: item.titulo,
      vehiculo: item.vehiculo,
      categoria: item.categoria ?? '',
      efectivo: item.efectivo,
      recargoTarjeta: item.recargoTarjeta,
    } : { ...VACIO })
    setErrorForm('')
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorForm('')

    try {
      const resultado = await guardarPolarizado(editando ?? null, form)

      if ('error' in resultado && resultado.error) {
        setErrorForm(resultado.error)
        return
      }

      setEditando(undefined)
      router.refresh()
    } catch {
      setErrorForm('No se pudo guardar el artículo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(item: Polarizado) {
    if (!window.confirm(`¿Eliminar «${item.vehiculo}»?`)) return

    setGuardando(true)

    try {
      const resultado = await borrarPolarizado(item.id)

      if ('error' in resultado && resultado.error) {
        window.alert(resultado.error)
        return
      }

      setItems(prev => prev.filter(i => i.id !== item.id))
      router.refresh()
    } catch {
      window.alert('No se pudo eliminar el artículo.')
    } finally {
      setGuardando(false)
    }
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          Lista de precios polarizados
        </h1>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-gray-900">
            Lista de precios polarizados
          </h1>
          <p className="text-sm text-gray-500">
            {items.length} artículos. Tarjeta: 6 pagos sin interés.
          </p>
        </div>

        {administrador && (
          <button
            onClick={() => abrir()}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus size={16} /> Nuevo artículo
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por vehículo, categoría o rubro..."
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm sm:max-w-md"
        />
      </div>

      {!secciones.length && (
        <p className="text-sm text-gray-500">
          No se encontraron artículos.
        </p>
      )}

      <div className="space-y-3">
        {secciones.map(grupo => (
          <details
            key={grupo.titulo}
            open={busqueda.trim() ? true : undefined}
            className="group rounded-lg border border-gray-200"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">
                {grupo.titulo}
              </span>
              <span className="flex items-center gap-2 text-xs text-gray-400">
                {grupo.items.length} artículos
                <ChevronDown
                  size={16}
                  className="transition-transform group-open:rotate-180"
                />
              </span>
            </summary>

            <div className="overflow-x-auto border-t border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Vehículo / servicio</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Categoría / tono</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Efectivo</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Tarjeta</th>
                    {administrador && (
                      <th className="px-4 py-2 text-right font-medium text-gray-500">Acciones</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {grupo.items.map(item => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {item.vehiculo}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {item.categoria || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">
                        {formatearMoneda(item.efectivo)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">
                        {formatearMoneda(
                          Math.round(item.efectivo * (1 + item.recargoTarjeta))
                        )}
                      </td>

                      {administrador && (
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          <button
                            title="Editar"
                            onClick={() => abrir(item)}
                            className="mr-2 rounded p-1 text-gray-600 hover:bg-gray-100"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            title="Eliminar"
                            disabled={guardando}
                            onClick={() => eliminar(item)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>

      {administrador && editando !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editando === null ? 'Nuevo artículo' : 'Editar artículo'}
              </h2>
              <button
                aria-label="Cerrar"
                disabled={guardando}
                onClick={() => setEditando(undefined)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-3">
              {([
                ['titulo', 'Rubro', true],
                ['vehiculo', 'Vehículo / servicio', true],
                ['categoria', 'Categoría / tono', false],
              ] as const).map(([campo, etiqueta, obligatorio]) => (
                <label key={campo} className="block text-sm font-medium text-gray-700">
                  {etiqueta}
                  <input
                    required={obligatorio}
                    maxLength={200}
                    value={form[campo]}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      [campo]: e.target.value,
                    }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              ))}

              <label className="block text-sm font-medium text-gray-700">
                Precio en efectivo ($)
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.efectivo}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    efectivo: Number(e.target.value),
                  }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Recargo de tarjeta (%)
                <input
                  type="number"
                  required
                  min="0"
                  max="500"
                  step="1"
                  value={form.recargoTarjeta * 100}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    recargoTarjeta: Number(e.target.value) / 100,
                  }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                Precio con tarjeta: {formatearMoneda(
                  Math.round(form.efectivo * (1 + form.recargoTarjeta))
                )}
              </p>

              {errorForm && (
                <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
                  {errorForm}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setEditando(undefined)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
