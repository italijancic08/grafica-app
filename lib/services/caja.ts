'use server'

import { createClient } from '@/lib/supabase/server'
import { movimientoCajaSchema, type MovimientoCajaInput } from '@/lib/validations/caja'
import { revalidatePath } from 'next/cache'
import { mesActualArgentina } from '@/lib/utils/formato'
import { registrarAuditoria } from '@/lib/services/auditoria'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'

function rangoDelMes(mes: string) {
  const [anio, mesNum] = mes.split('-').map(Number)
  const inicio = `${mes}-01`
  const finExclusive =
    mesNum === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mesNum + 1).padStart(2, '0')}-01`
  return { inicio, finExclusive }
}

export async function listarMovimientosDelMes(mes?: string) {
  const supabase = await createClient()
  const mesFiltro = mes ?? mesActualArgentina()
  const { inicio, finExclusive } = rangoDelMes(mesFiltro)

  const { data, error } = await supabase
    .from('caja_movimientos')
    .select('*, trabajos(numero), pagos(comprobante_url, comprobante_exento)')
    .gte('fecha', `${inicio}T00:00:00`)
    .lt('fecha', `${finExclusive}T00:00:00`)
    .order('fecha', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

// Meses (YYYY-MM, más reciente primero) que tienen al menos un movimiento
// cargado, para la página /documentos donde se puede descargar el Excel
// de cualquier mes, esté cerrado o no.
export async function listarMesesConMovimientos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('caja_movimientos')
    .select('fecha')
    .order('fecha', { ascending: false })

  if (error) return { error: error.message }

  const meses = Array.from(new Set((data ?? []).map((m) => m.fecha.slice(0, 7))))
  return { data: meses }
}

export async function registrarMovimientoManual(input: MovimientoCajaInput) {
  const parsed = movimientoCajaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('caja_movimientos')
    .insert({ ...parsed.data, usuario_id: user?.id })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'registrar_movimiento_caja',
    entidad: 'caja',
    entidad_id: data.id,
    detalle: { tipo: parsed.data.tipo, monto: parsed.data.monto, concepto: parsed.data.concepto, rubro: parsed.data.rubro },
  })

  revalidatePath('/caja')
  return { data }
}

export async function actualizarMovimientoCaja(id: string, input: MovimientoCajaInput) {
  // Editar movimientos de caja es exclusivo del administrador
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return { error: sinPermiso.error }

  const parsed = movimientoCajaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('caja_movimientos')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'editar_movimiento_caja',
    entidad: 'caja',
    entidad_id: id,
    detalle: { tipo: parsed.data.tipo, monto: parsed.data.monto, concepto: parsed.data.concepto, rubro: parsed.data.rubro },
  })

  revalidatePath('/caja')
  return { success: true }
}

// Elimina un movimiento de caja. Solo administrador.
// No permite borrar movimientos que vienen de un pago de trabajo (dejaría el
// pago y la caja desincronizados) ni movimientos de un mes de caja ya cerrado.
export async function eliminarMovimientoCaja(id: string) {
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return { error: sinPermiso.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: movimiento, error: errorMovimiento } = await supabase
    .from('caja_movimientos')
    .select('id, tipo, monto, concepto, rubro, fecha, pago_id, comprobante_url')
    .eq('id', id)
    .single()

  if (errorMovimiento || !movimiento) return { error: 'No se encontró el movimiento' }

  if (movimiento.pago_id) {
    return { error: 'Este movimiento viene de un pago de trabajo. Se administra desde el trabajo, no desde la caja.' }
  }

  const [anio, mes] = String(movimiento.fecha).slice(0, 7).split('-').map(Number)
  const { data: cierre } = await supabase
    .from('caja_mensual')
    .select('cerrado')
    .eq('mes', mes)
    .eq('anio', anio)
    .maybeSingle()

  if (cierre?.cerrado) {
    return { error: 'No se puede eliminar: el mes de caja ya está cerrado.' }
  }

  const { data: eliminados, error } = await supabase
    .from('caja_movimientos')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) return { error: error.message }
  if (!eliminados || eliminados.length === 0) {
    return { error: 'No se pudo eliminar el movimiento.' }
  }

  // Si tenía comprobante adjunto, se borra el archivo (si falla, no importa)
  if (movimiento.comprobante_url) {
    await supabase.storage.from('comprobantes').remove([movimiento.comprobante_url])
  }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'eliminar_movimiento_caja',
    entidad: 'caja',
    entidadId: id,
    detalle: {
      tipo: movimiento.tipo,
      monto: movimiento.monto,
      concepto: movimiento.concepto,
      rubro: movimiento.rubro,
    },
  })

  revalidatePath('/caja')
  return { success: true }
}

// Guarda en el movimiento manual la ruta del comprobante que el navegador ya
// subió al bucket "comprobantes" (carpeta caja/<movimiento_id>/). No modifica
// importes, por eso se puede usar aunque el mes de caja esté cerrado.
// Los movimientos que vienen de un pago de trabajo guardan su comprobante en
// el pago (ver adjuntarComprobantePago en lib/services/pagos.ts).
export async function adjuntarComprobanteMovimiento(movimientoId: string, ruta: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Debés iniciar sesión.' }

  if (!ruta.startsWith(`caja/${movimientoId}/`)) {
    return { error: 'Ruta de comprobante inválida.' }
  }

  const { data: movimiento } = await supabase
    .from('caja_movimientos')
    .select('id, pago_id')
    .eq('id', movimientoId)
    .single()

  if (!movimiento) return { error: 'No se encontró el movimiento' }

  if (movimiento.pago_id) {
    return { error: 'Este movimiento viene de un pago de trabajo: su comprobante se guarda en el pago.' }
  }

  const { error } = await supabase
    .from('caja_movimientos')
    .update({ comprobante_url: ruta })
    .eq('id', movimientoId)

  if (error) return { error: error.message }

  await registrarAuditoria({
    usuarioId: user.id,
    accion: 'adjuntar_comprobante_caja',
    entidad: 'caja',
    entidadId: movimientoId,
  })

  revalidatePath('/caja')
  return { success: true }
}