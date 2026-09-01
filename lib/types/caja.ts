import type { MedioPago } from '@/lib/types/pago'

export type TipoMovimientoCaja = 'ingreso' | 'egreso'

export type Rubro =
  | 'caja' | 'dif_caja' | 'reposicion_caja' | 'accesorios_terminaciones' | 'carteleria'
  | 'articulos_sublimados' | 'banners' | 'calcomanias_impresas' | 'calcomanias_rotuladas'
  | 'cartel_corrugado' | 'corporeo_polifan' | 'comisiones' | 'disenos_graficos' | 'fletes'
  | 'folleteria_tarjeteria' | 'frentes_comerciales' | 'grabado_vidrios' | 'indumentaria'
  | 'libreria' | 'limpieza' | 'otros_varios' | 'pagos_ld' | 'pagos_carlos_insumos'
  | 'pago_proveedores' | 'pagos_varios' | 'patentes' | 'ploteo' | 'ploteo_vehicular'
  | 'polarizado' | 'posicionador' | 'retiro_dinero' | 'rigidos' | 'sellos' | 'supermercado'
  | 'trabajos_imprenta' | 'termotransferible_corte' | 'venta_lamina' | 'venta_materiales'
  | 'vinilo_aerosol'

export interface MovimientoCaja {
  id: string
  tipo: TipoMovimientoCaja
  monto: number
  concepto: string
  fecha: string
  trabajo_id: string | null
  usuario_id: string | null
  medio_pago: MedioPago | null
  rubro: Rubro | null
  trabajos?: { numero: string } | null
}

export const ETIQUETAS_RUBRO: Record<Rubro, string> = {
  caja: 'Caja',
  dif_caja: 'Dif. de caja',
  reposicion_caja: 'Reposición de caja',
  accesorios_terminaciones: 'Accesorios para terminaciones',
  carteleria: 'Cartelería',
  articulos_sublimados: 'Artículos sublimados',
  banners: 'Banners',
  calcomanias_impresas: 'Calcomanías impresas',
  calcomanias_rotuladas: 'Calcomanías rotuladas',
  cartel_corrugado: 'Cartel corrugado',
  corporeo_polifan: 'Corpóreo polifan',
  comisiones: 'Comisiones',
  disenos_graficos: 'Diseños gráficos',
  fletes: 'Fletes',
  folleteria_tarjeteria: 'Folletería y tarjetería',
  frentes_comerciales: 'Frentes comerciales',
  grabado_vidrios: 'Grabado en vidrios',
  indumentaria: 'Indumentaria',
  libreria: 'Librería',
  limpieza: 'Limpieza',
  otros_varios: 'Otros/varios',
  pagos_ld: 'Pagos a LD',
  pagos_carlos_insumos: 'Pagos a Carlos insumos',
  pago_proveedores: 'Pago a proveedores',
  pagos_varios: 'Pagos varios',
  patentes: 'Patentes',
  ploteo: 'Ploteo',
  ploteo_vehicular: 'Ploteo vehicular',
  polarizado: 'Polarizado',
  posicionador: 'Posicionador',
  retiro_dinero: 'Retiro de dinero',
  rigidos: 'Rígidos',
  sellos: 'Sellos',
  supermercado: 'Supermercado',
  trabajos_imprenta: 'Trabajos de imprenta',
  termotransferible_corte: 'Termotransferible de corte',
  venta_lamina: 'Venta de lámina',
  venta_materiales: 'Venta de materiales',
  vinilo_aerosol: 'Vinilo en aerosol',
}