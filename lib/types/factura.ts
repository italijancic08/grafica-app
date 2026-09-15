export type TipoComprobante =
  | 'RECIBO'
  | 'FACTURA_A'
  | 'FACTURA_B'
  | 'FACTURA_C'

export type EstadoEnvio =
  | 'PENDIENTE'
  | 'ENVIADO_WHATSAPP'
  | 'ENVIADO_EMAIL'
  | 'NO_ENVIADO'

export type CanalEnvio =
  | 'WHATSAPP'
  | 'EMAIL'

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

  estado_envio: EstadoEnvio
  canal_envio: CanalEnvio | null
  error_envio: string | null
  enviado_en: string | null
}

export const ETIQUETAS_TIPO_COMPROBANTE:
  Record<TipoComprobante, string> = {
    RECIBO: 'Recibo',
    FACTURA_A: 'Factura A',
    FACTURA_B: 'Factura B',
    FACTURA_C: 'Factura C',
  }

export const ETIQUETAS_ESTADO_ENVIO:
  Record<EstadoEnvio, string> = {
    PENDIENTE: 'Pendiente',
    ENVIADO_WHATSAPP: 'Enviado por WhatsApp',
    ENVIADO_EMAIL: 'Enviado por email',
    NO_ENVIADO: 'No enviado',
  }