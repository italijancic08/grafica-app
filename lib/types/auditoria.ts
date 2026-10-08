export interface Auditoria {
  id: string
  usuario_id: string | null
  accion: string
  entidad: string
  entidad_id: string | null
  detalle: Record<string, unknown> | null
  fecha: string
}

export const ETIQUETAS_ACCION: Record<string, string> = {
  crear: 'Alta',
  editar: 'Edición',
  cambiar_estado: 'Cambio de estado',
  registrar_pago: 'Pago registrado',
  editar_pago: 'Pago editado',
  registrar_movimiento: 'Movimiento de stock',
  registrar_movimiento_caja: 'Movimiento de caja',
  editar_movimiento_caja: 'Movimiento de caja editado',
  cerrar_caja_mensual: 'Cierre de caja mensual',
  convertir_presupuesto: 'Presupuesto convertido',
  aceptar_presupuesto: 'Presupuesto aceptado',
  rechazar_presupuesto: 'Presupuesto rechazado',
  marcar_vuelta: 'Tercerización vuelta',
}

export const ETIQUETAS_ENTIDAD: Record<string, string> = {
  trabajo: 'Trabajo',
  cliente: 'Cliente',
  pago: 'Pago',
  material: 'Material',
  tercerizacion: 'Tercerización',
  usuario: 'Usuario',
  caja: 'Caja',
  caja_mensual: 'Caja mensual',
  presupuesto: 'Presupuesto',
  empresa: 'Empresa',
  configuracion: 'Configuración',
}