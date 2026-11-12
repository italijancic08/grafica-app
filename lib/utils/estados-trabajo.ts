import type { EstadoOperativo } from '@/lib/types/trabajo'

// Define a qué estados se puede pasar desde cada estado actual.
// "FINALIZADO" tiene su propio flujo (pregunta si se notificó al cliente),
// y desde "PENDIENTE_NOTIFICACION" se sale con el botón "Notificar al cliente".
// Los estados viejos (Ingresado, Terminado, Para retirar, etc.) se conservan
// para los trabajos que ya existen, pero ya no se ofrecen como destino.
export const TRANSICIONES_VALIDAS: Record<EstadoOperativo, EstadoOperativo[]> = {
  // Presupuesto y rechazado no usan esta tabla: se resuelven con
  // aceptarPresupuesto() / rechazarPresupuesto() en lib/services/trabajos.ts
  PRESUPUESTO: [],
  RECHAZADO: [],
  INGRESADO: ['EN_PRODUCCION', 'TERCERIZADO', 'CANCELADO'],
  EN_PRODUCCION: ['TERCERIZADO', 'FINALIZADO', 'CANCELADO'],
  TERCERIZADO: ['EN_PRODUCCION', 'FINALIZADO', 'CANCELADO'],
  TERMINADO: ['FINALIZADO', 'CANCELADO'],
  A_COORDINAR: ['FINALIZADO', 'CANCELADO'],
  TURNO_AGENDADO: ['FINALIZADO', 'CANCELADO'],
  PARA_RETIRAR: ['FINALIZADO', 'CANCELADO'],
  PENDIENTE_NOTIFICACION: ['CANCELADO'],
  FINALIZADO: [],
  RETIRADO: [],
  CANCELADO: [],
}

// Estados de un trabajo ya aceptado (todo menos presupuestos y rechazados)
export const ESTADOS_DE_TRABAJO: EstadoOperativo[] = [
  'EN_PRODUCCION',
  'TERCERIZADO',
  'PENDIENTE_NOTIFICACION',
  'FINALIZADO',
  'INGRESADO',
  'TERMINADO',
  'A_COORDINAR',
  'TURNO_AGENDADO',
  'PARA_RETIRAR',
  'RETIRADO',
  'CANCELADO',
]

// Estados del flujo nuevo (siempre aparecen como filtro en Trabajos)
export const ESTADOS_PRINCIPALES: EstadoOperativo[] = [
  'EN_PRODUCCION',
  'TERCERIZADO',
  'PENDIENTE_NOTIFICACION',
]

// Trabajos que se ven en la lista de Trabajos: los del flujo nuevo, más los
// estados viejos "en curso" para que ningún trabajo existente desaparezca.
// Finalizado, Retirado y Cancelado quedan en el historial del cliente.
export const ESTADOS_EN_LISTA_DE_TRABAJOS: EstadoOperativo[] = [
  ...ESTADOS_PRINCIPALES,
  'INGRESADO',
  'TERMINADO',
  'A_COORDINAR',
  'TURNO_AGENDADO',
  'PARA_RETIRAR',
]