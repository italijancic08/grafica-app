export type EstadoTercerizacion = 'ENVIADO' | 'EN_PROVEEDOR' | 'VUELTO' | 'DEMORADO'

export interface Tercerizacion {
  id: string
  trabajo_id: string
  proveedor: string
  fecha_envio: string
  fecha_estimada_vuelta: string | null
  fecha_real_vuelta: string | null
  costo: number | null
  estado: EstadoTercerizacion
  creado_en: string
}

export const ETIQUETAS_ESTADO_TERCERIZACION: Record<EstadoTercerizacion, string> = {
  ENVIADO: 'Enviado',
  EN_PROVEEDOR: 'En proveedor',
  VUELTO: 'Vuelto',
  DEMORADO: 'Demorado',
}