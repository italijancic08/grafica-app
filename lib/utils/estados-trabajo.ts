import type { EstadoOperativo } from '@/lib/types/trabajo'

// Define a qué estados se puede pasar desde cada estado actual
export const TRANSICIONES_VALIDAS: Record<EstadoOperativo, EstadoOperativo[]> = {
  // Presupuesto y rechazado no usan esta tabla: se resuelven con
  // aceptarPresupuesto() / rechazarPresupuesto() en lib/services/trabajos.ts
  PRESUPUESTO: [],
  RECHAZADO: [],
  INGRESADO: ['EN_PRODUCCION', 'TERCERIZADO', 'CANCELADO'],
  EN_PRODUCCION: ['TERCERIZADO', 'TERMINADO', 'CANCELADO'],
  TERCERIZADO: ['EN_PRODUCCION', 'TERMINADO', 'CANCELADO'],
  TERMINADO: ['PARA_RETIRAR', 'CANCELADO'],
  PARA_RETIRAR: ['RETIRADO', 'CANCELADO'],
  RETIRADO: [],
  CANCELADO: [],
}
// Estados de un trabajo ya aceptado (todo menos presupuestos y rechazados)
export const ESTADOS_DE_TRABAJO: EstadoOperativo[] = [
  'INGRESADO',
  'EN_PRODUCCION',
  'TERCERIZADO',
  'TERMINADO',
  'PARA_RETIRAR',
  'RETIRADO',
  'CANCELADO',
]