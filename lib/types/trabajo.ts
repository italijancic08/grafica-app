export type EstadoOperativo =
  | 'INGRESADO'
  | 'EN_PRODUCCION'
  | 'TERCERIZADO'
  | 'TERMINADO'
  | 'PARA_RETIRAR'
  | 'RETIRADO'
  | 'CANCELADO'

export type EstadoFinanciero = 'SIN_PAGAR' | 'PAGO_PARCIAL' | 'PAGADO'

export interface Trabajo {
  id: string
  numero: string
  cliente_id: string
  descripcion: string
  fecha_entrada: string
  fecha_maxima: string | null
  fecha_finalizacion: string | null
  fecha_retiro: string | null
  precio_final: number
  sena: number
  estado_operativo: EstadoOperativo
  usuario_carga_id: string | null
  usuario_responsable_id: string | null
  creado_en: string
  modificado_en: string
}

export interface TrabajoConSaldo extends Trabajo {
  total_pagado: number
  saldo: number
  estado_financiero: EstadoFinanciero
  clientes?: { nombre_razon_social: string; telefono: string | null }
}

export const ETIQUETAS_ESTADO_OPERATIVO: Record<EstadoOperativo, string> = {
  INGRESADO: 'Ingresado',
  EN_PRODUCCION: 'En producción',
  TERCERIZADO: 'Tercerizado',
  TERMINADO: 'Terminado',
  PARA_RETIRAR: 'Para retirar',
  RETIRADO: 'Retirado',
  CANCELADO: 'Cancelado',
}

export const ETIQUETAS_ESTADO_FINANCIERO: Record<EstadoFinanciero, string> = {
  SIN_PAGAR: 'Sin pagar',
  PAGO_PARCIAL: 'Pago parcial',
  PAGADO: 'Pagado',
}