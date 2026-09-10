'use server'

import { obtenerAlertas } from '@/lib/services/alertas'
import { listarParaRetirar, listarConDeuda, listarTrabajos } from '@/lib/services/trabajos'
import { listarMovimientosDelMes } from '@/lib/services/caja'
import { listarTercerizaciones } from '@/lib/services/tercerizaciones'

export async function obtenerResumenDashboard() {
  const [
    alertas,
    paraRetirar,
    conDeuda,
    movimientosMes,
    tercerizaciones,
    enProduccion,
  ] = await Promise.all([
    obtenerAlertas(),
    listarParaRetirar(),
    listarConDeuda(),
    listarMovimientosDelMes(),
    listarTercerizaciones(),
    listarTrabajos(['INGRESADO', 'EN_PRODUCCION', 'TERCERIZADO']),
  ])

  const ingresosMes = movimientosMes.data?.filter((m) => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0) ?? 0
  const egresosMes = movimientosMes.data?.filter((m) => m.tipo === 'egreso').reduce((acc, m) => acc + m.monto, 0) ?? 0

  const ingresosEfectivoMes = movimientosMes.data
    ?.filter((m) => m.tipo === 'ingreso' && m.medio_pago === 'efectivo')
    .reduce((acc, m) => acc + m.monto, 0) ?? 0
  const egresosEfectivoMes = movimientosMes.data
    ?.filter((m) => m.tipo === 'egreso' && m.medio_pago === 'efectivo')
    .reduce((acc, m) => acc + m.monto, 0) ?? 0

  return {
    alertasActivas: alertas.data?.length ?? 0,
    paraRetirar: paraRetirar.data?.length ?? 0,
    deudas: {
      cantidad: conDeuda.data?.length ?? 0,
      totalAdeudado: conDeuda.data?.reduce((acc, t) => acc + t.saldo, 0) ?? 0,
    },
    cajaMes: {
      ingresos: ingresosMes,
      egresos: egresosMes,
      balance: ingresosMes - egresosMes,
      cajaFisica: ingresosEfectivoMes - egresosEfectivoMes,
    },
    tercerizacionesEnCurso: tercerizaciones.data?.filter((t) => t.estado === 'ENVIADO' || t.estado === 'EN_PROVEEDOR').length ?? 0,
    trabajosEnProduccion: enProduccion.data?.length ?? 0,
  }
}