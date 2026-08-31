import type { EstadoOperativo } from '@/lib/types/trabajo'

// Define a qué estados se puede pasar desde cada estado actual
export const TRANSICIONES_VALIDAS: Record<EstadoOperativo, EstadoOperativo[]> = {
  INGRESADO: ['EN_PRODUCCION', 'TERCERIZADO', 'CANCELADO'],
  EN_PRODUCCION: ['TERCERIZADO', 'TERMINADO', 'CANCELADO'],
  TERCERIZADO: ['EN_PRODUCCION', 'TERMINADO', 'CANCELADO'],
  TERMINADO: ['PARA_RETIRAR', 'CANCELADO'],
  PARA_RETIRAR: ['RETIRADO', 'CANCELADO'],
  RETIRADO: [],
  CANCELADO: [],
}