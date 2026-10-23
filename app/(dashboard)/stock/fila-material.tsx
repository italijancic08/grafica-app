'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarMovimiento, editarMaterial, eliminarMaterial } from '@/lib/services/materiales'
import { formatearMoneda } from '@/lib/utils/formato'
import type { Material, TipoMovimiento } from '@/lib/types/material'

export default function FilaMaterial({ material, administrador = false }: { material: Material; administrador?: boolean }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoMovimiento>('ingreso')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(material.nombre)
  const [unidad, setUnidad] = useState(material.unidad_medida)
  const [stockMinimo, setStockMinimo] = useState(String(material.stock_minimo))
  const [costo, setCosto] = useState(String(material.costo_unitario ?? 0))
  const [precioBobina, setPrecioBobina] = useState('')
  const [rendimiento, setRendimiento] = useState('')
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const costoDesdeBobina =
    Number(precioBobina) > 0 && Number(rendimiento) > 0
      ? Number(precioBobina) / Number(rendimiento)
      : null

  function abrirEdicion() {
    setNombre(material.nombre)
    setUnidad(material.unidad_medida)
    setStockMinimo(String(material.stock_minimo))
    setCosto(String(material.costo_unitario ?? 0))
    setPrecioBobina('')
    setRendimiento('')
    setErrorEdicion(null)
    setAbierto(false)
    setEditando(true)
  }

  async function handleGuardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    setErrorEdicion(null)
    setGuardando(true)
    try {
      const resultado = await editarMaterial(material.id, {
        nombre,
        unidad_medida: unidad,
        stock_minimo: Number(stockMinimo),
        costo_unitario: costoDesdeBobina ?? (Number(costo) || 0),
      })
      if ('error' in resultado && resultado.error) {
        setErrorEdicion(resultado.error)
        return
      }
      setEditando(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setErrorEdicion('Ocurrió un error inesperado.')
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar "${material.nombre}"? Se borra también su historial de movimientos y no se puede deshacer.`)) return
    setError(null)
    setCargando(true)
    try {
      const resultado = await eliminarMaterial(material.id)
      if ('error' in resultado && resultado.error) {
        setError(resultado.error)
        setAbierto(true)
        return
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
      setAbierto(true)
    } finally {
      setCargando(false)
    }
  }

  const stockBajo = material.cantidad_actual <= material.stock_minimo

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await registrarMovimiento({
        material_id: material.id,
        tipo,
        cantidad: Number(cantidad),
        observacion,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setCantidad('')
      setObservacion('')
      setAbierto(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2 font-medium">{material.nombre}</td>
        <td className="px-4 py-2">{material.unidad_medida}</td>
        <td className={`px-4 py-2 ${stockBajo ? 'font-medium text-red-600' : ''}`}>
          {material.cantidad_actual} {stockBajo && '⚠️'}
        </td>
        <td className="px-4 py-2">{material.stock_minimo}</td>
        <td className="space-x-3 px-4 py-2 text-right">
          <button
            onClick={() => { setEditando(false); setAbierto((v) => !v) }}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            {abierto ? 'Cerrar' : 'Movimiento'}
          </button>
          {administrador && (
            <>
              <button
                onClick={() => (editando ? setEditando(false) : abrirEdicion())}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {editando ? 'Cancelar' : 'Editar'}
              </button>
              <button
                onClick={handleEliminar}
                disabled={cargando}
                className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Eliminar
              </button>
            </>
          )}
        </td>
      </tr>
      {editando && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-3">
            <form onSubmit={handleGuardarEdicion} className="space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Nombre</label>
                  <input required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Unidad</label>
                  <input required value={unidad} onChange={(e) => setUnidad(e.target.value)}
                    className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Stock mínimo</label>
                  <input type="number" step="0.01" min="0" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)}
                    className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Costo por unidad (opcional)</label>
                  <input type="number" step="0.01" min="0" value={costo} onChange={(e) => setCosto(e.target.value)}
                    disabled={costoDesdeBobina !== null}
                    className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100" />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Precio bobina (opcional)</label>
                  <input type="number" step="0.01" min="0" value={precioBobina} onChange={(e) => setPrecioBobina(e.target.value)}
                    className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Rinde (m2) por bobina (opcional)</label>
                  <input type="number" step="0.01" min="0" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)}
                    className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
                {costoDesdeBobina !== null && (
                  <p className="text-sm text-gray-600">Nuevo costo por m2: <span className="font-semibold text-gray-900">{formatearMoneda(costoDesdeBobina)}</span></p>
                )}
                <button type="submit" disabled={guardando}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
              {errorEdicion && <p className="text-sm text-red-600">{errorEdicion}</p>}
            </form>
          </td>
        </tr>
      )}
      {abierto && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Observación</label>
                <input
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Registrar'}
              </button>
              {error && <p className="w-full text-sm text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  )
}