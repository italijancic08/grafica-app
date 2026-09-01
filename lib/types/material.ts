export type TipoMovimiento = 'ingreso' | 'egreso'

export interface Material {
  id: string
  nombre: string
  unidad_medida: string
  cantidad_actual: number
  stock_minimo: number
  costo_unitario: number
  creado_en: string
}

export interface MovimientoStock {
  id: string
  material_id: string
  trabajo_id: string | null
  tipo: TipoMovimiento
  cantidad: number
  fecha: string
  usuario_id: string | null
  observacion: string | null
}