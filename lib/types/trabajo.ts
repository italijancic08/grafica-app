export type EstadoOperativo =
  | 'INGRESADO'
  | 'EN_PRODUCCION'
  | 'TERCERIZADO'
  | 'TERMINADO'
  | 'PARA_RETIRAR'
  | 'RETIRADO'
  | 'CANCELADO'

export type EstadoFinanciero = 'SIN_PAGAR' | 'PAGO_PARCIAL' | 'PAGADO'

export type RubroTrabajo =
  | 'carteleria' | 'articulos_sublimados' | 'banners' | 'calcomanias_impresas' | 'calcomanias_rotuladas'
  | 'cartel_corrugado' | 'corporeo_polifan' | 'disenos_graficos' | 'fletes' | 'folleteria_tarjeteria'
  | 'frentes_comerciales' | 'grabado_vidrios' | 'otros_varios' | 'patentes' | 'ploteo' | 'ploteo_vehicular'
  | 'polarizado' | 'posicionador' | 'rigidos' | 'sellos' | 'supermercado' | 'trabajos_imprenta'
  | 'termotransferible_corte' | 'venta_lamina' | 'venta_materiales' | 'vinilo_aerosol'

export interface Trabajo {
  id: string
  numero: string
  cliente_id: string
  descripcion: string
  rubro: RubroTrabajo
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

export const ETIQUETAS_RUBRO_TRABAJO: Record<RubroTrabajo, string> = {
  carteleria: 'Cartelería',
  articulos_sublimados: 'Artículos sublimados',
  banners: 'Banners',
  calcomanias_impresas: 'Calcomanías impresas',
  calcomanias_rotuladas: 'Calcomanías rotuladas',
  cartel_corrugado: 'Cartel corrugado',
  corporeo_polifan: 'Corpóreo polifan',
  disenos_graficos: 'Diseños gráficos',
  fletes: 'Fletes',
  folleteria_tarjeteria: 'Folletería y tarjetería',
  frentes_comerciales: 'Frentes comerciales',
  grabado_vidrios: 'Grabado en vidrios',
  otros_varios: 'Otros/varios',
  patentes: 'Patentes',
  ploteo: 'Ploteo',
  ploteo_vehicular: 'Ploteo vehicular',
  polarizado: 'Polarizado',
  posicionador: 'Posicionador',
  rigidos: 'Rígidos',
  sellos: 'Sellos',
  supermercado: 'Supermercado',
  trabajos_imprenta: 'Trabajos de imprenta',
  termotransferible_corte: 'Termotransferible de corte',
  venta_lamina: 'Venta de lámina',
  venta_materiales: 'Venta de materiales',
  vinilo_aerosol: 'Vinilo en aerosol',
}