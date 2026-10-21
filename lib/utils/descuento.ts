import type { TipoDescuento } from '@/lib/types/trabajo'

export interface ResultadoDescuento {
  descuento: number
  precioFinal: number
  error?: string
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}

// Calcula el precio final que paga el cliente a partir del precio sin
// descuento. Se usa tanto en el servidor (para guardar) como en el
// formulario (para mostrar la vista previa), así ambos coinciden siempre.
export function calcularPrecioConDescuento(
  precioBase: number,
  tipo?: TipoDescuento | null,
  valor?: number | null
): ResultadoDescuento {
  const base = redondear(Number(precioBase) || 0)
  const valorNumerico = Number(valor) || 0

  if (!tipo || valorNumerico <= 0) {
    return { descuento: 0, precioFinal: base }
  }

  if (base <= 0) {
    return { descuento: 0, precioFinal: base, error: 'Para aplicar un descuento primero indicá el precio.' }
  }

  if (tipo === 'PORCENTAJE' && valorNumerico > 100) {
    return { descuento: 0, precioFinal: base, error: 'El descuento no puede superar el 100%.' }
  }

  const descuento = redondear(tipo === 'PORCENTAJE' ? (base * valorNumerico) / 100 : valorNumerico)

  if (descuento > base) {
    return { descuento: 0, precioFinal: base, error: 'El descuento no puede superar el precio.' }
  }

  return { descuento, precioFinal: redondear(base - descuento) }
}