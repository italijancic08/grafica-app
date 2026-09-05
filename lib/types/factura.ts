export type TipoComprobante = 'RECIBO' | 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C'

export interface Factura {
  id: string
  trabajo_id: string
  cliente_id: string
  tipo_comprobante: TipoComprobante
  numero: string | null
  fecha: string
  monto: number
  archivo_pdf_url: string | null
  creado_en: string
}

export const ETIQUETAS_TIPO_COMPROBANTE: Record<TipoComprobante, string> = {
  RECIBO: 'Recibo',
  FACTURA_A: 'Factura A',
  FACTURA_B: 'Factura B',
  FACTURA_C: 'Factura C',
}