export type TipoAlerta = 'STOCK_BAJO' | 'TRABAJO_DEMORADO' | 'TRABAJO_NO_RETIRADO' | 'TERCERIZACION_DEMORADA'

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
  TERCERIZACION_DEMORADA: 'Tercerización demorada',
}