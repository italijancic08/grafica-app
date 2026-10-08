'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarTrabajo } from '@/lib/services/trabajos'
import type { Cliente } from '@/lib/types/cliente'
import { ETIQUETAS_RUBRO_TRABAJO, type EstadoOperativo, type RubroTrabajo } from '@/lib/types/trabajo'
import { formatearMoneda } from '@/lib/utils/formato'
import SelectorCliente from '../../clientes/selector-cliente'

export default function EditarTrabajo({
  trabajoId,
  estado,
  clienteId,
  clientes,
  descripcion,
  rubro,
  fechaMaxima,
  precioFinal,
  anchoCm,
  largoCm,
}: {
  trabajoId: string
  estado: EstadoOperativo
  clienteId: string
  clientes: Cliente[]
  descripcion: string
  rubro: RubroTrabajo | null
  fechaMaxima: string | null
  precioFinal: number
  anchoCm: number | null
  largoCm: number | null
}) {
  const router = useRouter()
  const esPresupuesto = estado === 'PRESUPUESTO'
  const puedeEditar = estado !== 'RECHAZADO'

  const [editando, setEditando] = useState(false)

  const [clienteForm, setClienteForm] = useState(clienteId)
  const [descripcionForm, setDescripcionForm] = useState(descripcion)
  const [rubroForm, setRubroForm] = useState<RubroTrabajo | ''>(rubro ?? '')
  const [fechaMaximaForm, setFechaMaximaForm] = useState(fechaMaxima ?? '')
  const [precioFinalForm, setPrecioFinalForm] = useState(precioFinal > 0 ? String(precioFinal) : '')
  const [anchoForm, setAnchoForm] = useState(anchoCm ? String(anchoCm) : '')
  const [largoForm, setLargoForm] = useState(largoCm ? String(largoCm) : '')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const m2 = Number(anchoForm) > 0 && Number(largoForm) > 0
    ? (Number(anchoForm) / 100) * (Number(largoForm) / 100)
    : null

  function handleCancelar() {
    setClienteForm(clienteId)
    setDescripcionForm(descripcion)
    setRubroForm(rubro ?? '')
    setFechaMaximaForm(fechaMaxima ?? '')
    setPrecioFinalForm(precioFinal > 0 ? String(precioFinal) : '')
    setAnchoForm(anchoCm ? String(anchoCm) : '')
    setLargoForm(largoCm ? String(largoCm) : '')
    setError(null)
    setEditando(false)
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (esPresupuesto && !clienteForm) {
      setError('Seleccioná un cliente')
      return
    }

    setCargando(true)

    try {
      const resultado = await actualizarTrabajo(trabajoId, {
        cliente_id: esPresupuesto ? clienteForm : undefined,
        descripcion: descripcionForm,
        rubro: rubroForm || undefined,
        fecha_maxima: fechaMaximaForm,
        precio_final: Number(precioFinalForm || 0),
        ancho_cm: anchoForm ? Number(anchoForm) : undefined,
        largo_cm: largoForm ? Number(largoForm) : undefined,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setEditando(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  if (editando) {
    return (
      <div className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          {esPresupuesto ? 'Editar presupuesto' : 'Editar trabajo'}
        </h2>
        <form onSubmit={handleGuardar} className="space-y-3">
          {esPresupuesto && (
            <div className="max-w-xl">
              <label className="mb-1 block text-xs font-medium text-gray-700">Cliente</label>
              <SelectorCliente clientes={clientes} clienteId={clienteForm} onChange={setClienteForm} />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Rubro</label>
            <select
              required={!esPresupuesto}
              value={rubroForm}
              onChange={(e) => setRubroForm(e.target.value as RubroTrabajo)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:w-80"
            >
              <option value="">{esPresupuesto ? 'Sin definir' : 'Seleccionar rubro...'}</option>
              {Object.entries(ETIQUETAS_RUBRO_TRABAJO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Descripción</label>
            <textarea
              required
              value={descripcionForm}
              onChange={(e) => setDescripcionForm(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Plazo de entrega</label>
              <input
                type="date"
                value={fechaMaximaForm}
                onChange={(e) => setFechaMaximaForm(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {esPresupuesto ? 'Precio' : 'Precio final'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required={!esPresupuesto}
                value={precioFinalForm}
                onChange={(e) => setPrecioFinalForm(e.target.value)}
                className="w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Ancho (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={anchoForm}
                onChange={(e) => setAnchoForm(e.target.value)}
                className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Largo (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={largoForm}
                onChange={(e) => setLargoForm(e.target.value)}
                className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            {m2 !== null && <p className="pb-2 text-sm text-gray-500">= {m2.toFixed(2)} m²</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cargando}
              className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={handleCancelar}
              disabled={cargando}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Descripción
          <span className="ml-2 font-normal text-gray-500">
            · {rubro ? ETIQUETAS_RUBRO_TRABAJO[rubro] : 'Rubro sin definir'}
          </span>
        </h2>
        {puedeEditar && (
          <button
            onClick={() => setEditando(true)}
            className="text-xs font-medium text-gray-600 hover:underline"
          >
            Editar
          </button>
        )}
      </div>
      <p className="text-sm text-gray-700">{descripcion}</p>
      <p className="mt-2 text-xs text-gray-400">
        {esPresupuesto ? 'Precio' : 'Precio final'}:{' '}
        {precioFinal > 0 ? formatearMoneda(precioFinal) : 'Sin definir'}
        {anchoCm && largoCm ? ` · Medidas: ${anchoCm} × ${largoCm} cm` : ''}
      </p>
    </div>
  )
}