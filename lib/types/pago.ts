export type MedioPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto' | 'otro'
export type TipoTarjeta = 'debito' | 'credito'

export interface Pago {
  id: string
  trabajo_id: string
  cliente_id: string
  fecha: string
  hora: string
  importe: number
  medio_pago: MedioPago
  detalle_medio_pago: string | null
  usuario_id: string | null
  observacion: string | null
  creado_en: string
}

export const ETIQUETAS_MEDIO_PAGO: Record<MedioPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mixto: 'Pago mixto',
  otro: 'Otro',
}

export const ETIQUETAS_TIPO_TARJETA: Record<TipoTarjeta, string> = {
  debito: 'Débito',
  credito: 'Crédito',
}