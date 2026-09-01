'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { registrarMovimiento } from '@/lib/services/materiales'
import type { Material } from '@/lib/types/material'
import { formatearMoneda } from '@/lib/utils/formato'

export default function CalculadoraMateriales({ materiales }: { materiales: Material[] }) {
  const router = useRouter()

  const [materialId, setMaterialId] = useState('')
  const [anchoCm, setAnchoCm] = useState('')
  const [altoCm, setAltoCm] = useState('')
  const [cantidadPiezas, setCantidadPiezas] = useState('1')
  const [desperdicio, setDesperdicio] = useState('10')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const material = materiales.find((m) => m.id === materialId)

  const resultado = useMemo(() => {
    const anchoCmNum = Number(anchoCm)
    const altoCmNum = Number(altoCm)
    const piezas = Number(cantidadPiezas) || 1
    const desp = Number(desperdicio) || 0

    if (!anchoCmNum || !altoCmNum) return null

    // Las medidas se cargan en cm, pero el stock se maneja en m2 —
    // convertimos cada lado de cm a metros antes de multiplicar.
    const anchoM = anchoCmNum / 100
    const altoM = altoCmNum / 100

    const superficieUnitaria = anchoM * altoM
    const superficieTotal = superficieUnitaria * piezas
    const conDesperdicio = superficieTotal * (1 + desp / 100)

    return { superficieUnitaria, superficieTotal, conDesperdicio }
  }, [anchoCm, altoCm, cantidadPiezas, desperdicio])

  const costoTotal = material && resultado ? resultado.conDesperdicio * material.costo_unitario : null
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
        observacion: `Calculadora: ${anchoCm}cm x ${altoCm}cm x${cantidadPiezas} piezas (+${desperdicio}% desperdicio)`,
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Ancho (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={anchoCm}
            onChange={(e) => setAnchoCm(e.target.value)}
            placeholder="Ej: 150"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Alto (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={altoCm}
            onChange={(e) => setAltoCm(e.target.value)}
            placeholder="Ej: 200"
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
            <span className="font-medium">{resultado.superficieUnitaria.toFixed(2)} m2</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Superficie total ({cantidadPiezas} piezas):</span>
            <span className="font-medium">{resultado.superficieTotal.toFixed(2)} m2</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Total con desperdicio:</span>
            <span className="font-medium">{resultado.conDesperdicio.toFixed(2)} m2</span>
          </div>

          {costoTotal !== null && (
            <div className="flex justify-between border-t border-gray-200 py-1 pt-2 text-base">
              <span className="font-semibold text-gray-900">Costo del material:</span>
              <span className="font-semibold text-gray-900">{formatearMoneda(costoTotal)}</span>
            </div>
          )}

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