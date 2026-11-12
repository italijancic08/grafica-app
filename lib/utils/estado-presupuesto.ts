import { fechaHoyArgentina } from '@/lib/utils/formato'

// Un presupuesto enviado que lleva más de 10 días sin respuesta se archiva:
// desaparece de la lista de Presupuestos y queda en el historial del cliente.
export const DIAS_PARA_ARCHIVAR_PRESUPUESTO = 10

// Fecha (YYYY-MM-DD) de hace 10 días, en horario de Argentina
export function fechaLimiteArchivoPresupuesto(): string {
  const [anio, mes, dia] = fechaHoyArgentina().split('-').map(Number)
  const limite = new Date(Date.UTC(anio, mes - 1, dia - DIAS_PARA_ARCHIVAR_PRESUPUESTO))
  return limite.toISOString().slice(0, 10)
}

export function presupuestoArchivado(fechaEnvio: string | null | undefined): boolean {
  if (!fechaEnvio) return false
  return fechaEnvio.slice(0, 10) < fechaLimiteArchivoPresupuesto()
}

// Etiqueta que se muestra para un presupuesto (estado real en la base: PRESUPUESTO)
export function etiquetaEstadoPresupuesto(fechaEnvio: string | null | undefined): string {
  if (!fechaEnvio) return 'Pendiente de presupuestar'
  if (presupuestoArchivado(fechaEnvio)) return 'Presupuesto archivado'
  return 'Presupuesto enviado'
}