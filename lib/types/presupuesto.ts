export type EstadoPresupuesto = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

export interface Presupuesto {
  id: string
  cliente_id: string
  descripcion: string
  monto: number
  fecha: string
  estado: EstadoPresupuesto
  trabajo_id: string | null
  creado_en: string
  clientes?: { nombre_razon_social: string; telefono: string | null }
}

export const ETIQUETAS_ESTADO_PRESUPUESTO: Record<EstadoPresupuesto, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
}