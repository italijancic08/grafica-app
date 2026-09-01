'use client'

import { useState, useMemo } from 'react'
import { formatearMoneda } from '@/lib/utils/formato'

export default function CalculadoraPrecio() {
  const [tieneDiseno, setTieneDiseno] = useState(false)
  const [precioDiseno, setPrecioDiseno] = useState('')
  const [precioServicio, setPrecioServicio] = useState('')
  const [materialAdicional, setMaterialAdicional] = useState('')
  const [terminaciones, setTerminaciones] = useState('')
  const [instalacion, setInstalacion] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [precioEspecial, setPrecioEspecial] = useState(false)
  const [descuentoPct, setDescuentoPct] = useState('25')

  const resultado = useMemo(() => {
    const diseno = tieneDiseno ? (Number(precioDiseno) || 0) : 0
    const servicio = Number(precioServicio) || 0
    const adicional = Number(materialAdicional) || 0
    const term = Number(terminaciones) || 0
    const inst = Number(instalacion) || 0
    const cant = Number(cantidad) || 1
    const desc = precioEspecial ? (Number(descuentoPct) || 0) : 0

    // Diseño es el único costo fijo (no depende de la cantidad).
    // Servicio, material adicional, terminaciones e instalación
    // se cobran por unidad y se multiplican por la cantidad.
    const costoPorUnidad = servicio + adicional + term + inst
    const subtotalPorCantidad = costoPorUnidad * cant
    const precioSinDescuento = diseno + subtotalPorCantidad

    const precioFinal = precioSinDescuento * (1 - desc / 100)
    const montoDescontado = precioSinDescuento - precioFinal
    const precioPorUnidad = precioFinal / cant

    return { precioSinDescuento, precioFinal, montoDescontado, precioPorUnidad, cant }
  }, [tieneDiseno, precioDiseno, precioServicio, materialAdicional, terminaciones, instalacion, cantidad, precioEspecial, descuentoPct])

  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-gray-200 p-6">
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={tieneDiseno}
            onChange={(e) => setTieneDiseno(e.target.checked)}
            className="rounded border-gray-300"
          />
          ¿Incluye diseño gráfico?
        </label>
        {tieneDiseno && (
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio del diseño"
            value={precioDiseno}
            onChange={(e) => setPrecioDiseno(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Precio del material / tipo de servicio (por unidad)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={precioServicio}
          onChange={(e) => setPrecioServicio(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Material adicional (por unidad)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={materialAdicional}
            onChange={(e) => setMaterialAdicional(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Terminaciones (por unidad)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={terminaciones}
            onChange={(e) => setTerminaciones(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Instalación (por unidad)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={instalacion}
            onChange={(e) => setInstalacion(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={precioEspecial}
            onChange={(e) => setPrecioEspecial(e.target.checked)}
            className="rounded border-gray-300"
          />
          Precio especial (cliente frecuente, etc.)
        </label>
        {precioEspecial && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Descuento:</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={descuentoPct}
              onChange={(e) => setDescuentoPct(e.target.value)}
              className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <span className="text-sm text-gray-700">%</span>
          </div>
        )}
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
        {precioEspecial && resultado.montoDescontado > 0 && (
          <>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Precio sin descuento:</span>
              <span className="text-gray-500 line-through">{formatearMoneda(resultado.precioSinDescuento)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Descuento ({descuentoPct}%):</span>
              <span className="font-medium text-green-700">-{formatearMoneda(resultado.montoDescontado)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between border-t border-gray-200 py-1 pt-2 text-base">
          <span className="font-semibold text-gray-900">Precio del trabajo:</span>
          <span className="font-semibold text-gray-900">{formatearMoneda(resultado.precioFinal)}</span>
        </div>
        {resultado.cant > 1 && (
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Precio por unidad:</span>
            <span className="font-medium">{formatearMoneda(resultado.precioPorUnidad)}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Diseño se calcula como costo fijo del trabajo completo. Servicio, material adicional, terminaciones e instalación se calculan por unidad y se multiplican por la cantidad. El descuento de precio especial se aplica sobre el total.
      </p>
    </div>
  )
}