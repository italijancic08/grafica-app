'use client'

import { ETIQUETAS_TIPO_DESCUENTO, type TipoDescuento } from '@/lib/types/trabajo'
import { calcularPrecioConDescuento } from '@/lib/utils/descuento'
import { formatearMoneda } from '@/lib/utils/formato'

export default function CamposDescuento({
  precioBase,
  tipo,
  valor,
  onTipoChange,
  onValorChange,
  compacto = false,
}: {
  precioBase: string
  tipo: TipoDescuento | ''
  valor: string
  onTipoChange: (tipo: TipoDescuento | '') => void
  onValorChange: (valor: string) => void
  compacto?: boolean
}) {
  const claseEtiqueta = compacto
    ? 'mb-1 block text-xs font-medium text-gray-700'
    : 'mb-1 block text-sm font-medium text-gray-700'
  const relleno = compacto ? 'py-1.5' : 'py-2'

  const calculo = calcularPrecioConDescuento(Number(precioBase) || 0, tipo || null, Number(valor) || 0)

  return (
    <div>
      <label className={claseEtiqueta}>
        Descuento <span className="font-normal text-gray-400">(opcional)</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={tipo}
          onChange={(e) => {
            const nuevo = e.target.value as TipoDescuento | ''
            onTipoChange(nuevo)
            if (!nuevo) onValorChange('')
          }}
          className={`rounded-md border border-gray-300 px-3 ${relleno} text-sm`}
        >
          <option value="">Sin descuento</option>
          {Object.entries(ETIQUETAS_TIPO_DESCUENTO).map(([valorTipo, etiqueta]) => (
            <option key={valorTipo} value={valorTipo}>{etiqueta}</option>
          ))}
        </select>

        {tipo && (
          <input
            type="number"
            step="0.01"
            min="0"
            max={tipo === 'PORCENTAJE' ? 100 : undefined}
            value={valor}
            onChange={(e) => onValorChange(e.target.value)}
            placeholder={tipo === 'PORCENTAJE' ? '% a descontar' : '$ a descontar'}
            className={`w-36 rounded-md border border-gray-300 px-3 ${relleno} text-sm`}
          />
        )}

        {tipo && calculo.error && (
          <p className="text-sm text-yellow-700">{calculo.error}</p>
        )}

        {tipo && !calculo.error && calculo.descuento > 0 && (
          <p className="text-sm text-gray-500">
            − {formatearMoneda(calculo.descuento)} · Precio final:{' '}
            <span className="font-semibold text-gray-900">{formatearMoneda(calculo.precioFinal)}</span>
          </p>
        )}
      </div>
    </div>
  )
}