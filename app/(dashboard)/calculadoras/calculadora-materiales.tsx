'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { registrarMovimiento } from '@/lib/services/materiales'
import type { Material } from '@/lib/types/material'

export default function CalculadoraMateriales({ materiales }: { materiales: Material[] }) {
  const router = useRouter()

  const [materialId, setMaterialId] = useState('')
  const [ancho, setAncho] = useState('')
  const [alto, setAlto] = useState('')
  const [cantidadPiezas, setCantidadPiezas] = useState('1')
  const [desperdicio, setDesperdicio] = useState('10')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const material = materiales.find((m) => m.id === materialId)

  const resultado = useMemo(() => {
    const a = Number(ancho)
    const h = Number(alto)
    const piezas = Number(cantidadPiezas) || 1
    const desp = Number(desperdicio) || 0

    if (!a || !h) return null

    const superficieUnitaria = a * h
    const superficieTotal = superficieUnitaria * piezas
    const conDesperdicio = superficieTotal * (1 + desp / 100)

    return {
      superficieUnitaria,
      superficieTotal,
      conDesperdicio,
    }
  }, [ancho, alto, cantidadPiezas, desperdicio])

  const alcanza = material && resultado ? material.cantidad_actual >= resultado.conDesperdicio : null

  async function handleDescontar() {
    if (!material || !resultado) return
    setCargando(true)
    setMensaje(null)

    try {
      const res = await registrarMovimiento({
        material_id: material.id,
        tipo: 'egreso',
        cantidad: Number(resultado.conDesperdicio.toFixed(2)),
        observacion: `Calculadora: ${ancho}x${alto} x${cantidadPiezas} piezas (+${desperdicio}% desperdicio)`,
      })

      if (res.error) {
        setMensaje(res.error)
        return
      }

      setMensaje('Stock descontado correctamente.')
      router.refresh()
    } catch (err) {
      console.error(err)
      setMensaje('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-gray-200 p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Material</label>
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Seleccionar material...</option>
          {materiales.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} (stock: {m.cantidad_actual} {m.unidad_medida})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ancho ({material?.unidad_medida.startsWith('m') ? 'm' : material?.unidad_medida ?? '—'})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={ancho}
            onChange={(e) => setAncho(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Alto</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={alto}
            onChange={(e) => setAlto(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad de piezas</label>
          <input
            type="number"
            min="1"
            value={cantidadPiezas}
            onChange={(e) => setCantidadPiezas(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Desperdicio (%)</label>
          <input
            type="number"
            min="0"
            value={desperdicio}
            onChange={(e) => setDesperdicio(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {resultado && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Superficie por pieza:</span>
            <span className="font-medium">{resultado.superficieUnitaria.toFixed(2)} {material?.unidad_medida}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Superficie total ({cantidadPiezas} piezas):</span>
            <span className="font-medium">{resultado.superficieTotal.toFixed(2)} {material?.unidad_medida}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 py-1 pt-2 text-base">
            <span className="font-semibold text-gray-900">Total con desperdicio:</span>
            <span className="font-semibold text-gray-900">{resultado.conDesperdicio.toFixed(2)} {material?.unidad_medida}</span>
          </div>

          {material && (
            <p className={`mt-2 text-sm ${alcanza ? 'text-green-700' : 'text-red-600'}`}>
              {alcanza
                ? `✓ Alcanza el stock (disponible: ${material.cantidad_actual} ${material.unidad_medida})`
                : `⚠️ No alcanza el stock (disponible: ${material.cantidad_actual} ${material.unidad_medida})`}
            </p>
          )}

          {material && (
            <button
              onClick={handleDescontar}
              disabled={cargando || !alcanza}
              className="mt-3 rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {cargando ? 'Descontando...' : 'Descontar del stock'}
            </button>
          )}

          {mensaje && <p className="mt-2 text-sm text-gray-700">{mensaje}</p>}
        </div>
      )}
    </div>
  )
}