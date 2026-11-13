export type TipoAlerta = 'STOCK_BAJO' | 'TRABAJO_DEMORADO' | 'TRABAJO_NO_RETIRADO' | 'TRABAJO_SIN_NOTIFICAR' | 'TERCERIZACION_DEMORADA' | 'PAGO_SIN_COMPROBANTE' | 'EGRESO_SIN_COMPROBANTE'

export interface Alerta {
  tipo: TipoAlerta
  mensaje: string
  fecha: string | null
  urlDetalle: string
}

export const ETIQUETAS_TIPO_ALERTA: Record<TipoAlerta, string> = {
  STOCK_BAJO: 'Stock bajo',
  TRABAJO_DEMORADO: 'Trabajo demorado',
  TRABAJO_NO_RETIRADO: 'Trabajo no retirado',
  TRABAJO_SIN_NOTIFICAR: 'Falta notificar al cliente',
  TERCERIZACION_DEMORADA: 'Tercerización demorada',
  PAGO_SIN_COMPROBANTE: 'Pago sin comprobante',
  EGRESO_SIN_COMPROBANTE: 'Egreso sin comprobante',
}