'use server'

import { createClient } from '@/lib/supabase/server'
import { pagoSchema, pagoEditSchema, type PagoInput, type PagoEditInput } from '@/lib/validations/pago'
import { revalidatePath } from 'next/cache'
import { registrarAuditoria } from '@/lib/services/auditoria'
import { errorSiNoEsAdministrador } from '@/lib/auth/roles'
import { formatearMoneda } from '@/lib/utils/formato'

export async function listarPagosDeTrabajo(trabajoId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('trabajo_id', trabajoId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function registrarPago(input: PagoInput) {
  const parsed = pagoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar que el pago no exceda el saldo pendiente (evita pagos de más por error)
  const { data: trabajo } = await supabase
    .from('trabajos_con_saldo')
    .select('saldo, numero, estado_operativo')
    .eq('id', parsed.data.trabajo_id)
    .single()

  if (trabajo && (trabajo.estado_operativo === 'PRESUPUESTO' || trabajo.estado_operativo === 'RECHAZADO')) {
    return { error: 'No se pueden registrar pagos hasta que el presupuesto sea aceptado.' }
  }

  if (trabajo && parsed.data.importe > trabajo.saldo) {
    return {
      error: `El importe ($${parsed.data.importe}) supera el saldo pendiente ($${trabajo.saldo}) del trabajo ${trabajo.numero}.`,
    }
  }

  const { data, error } = await supabase
    .from('pagos')
    .insert({ ...parsed.data, usuario_id: user?.id })
    .select()
    .single()

  if (error) return { error: error.message }

    await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'registrar_pago',
    entidad: 'pago',
    entidadId: data.id,
    detalle: { trabajo_id: parsed.data.trabajo_id, importe: parsed.data.importe },
  })

  revalidatePath(`/trabajos/${parsed.data.trabajo_id}`)
  return { data }
}

// Pago mixto: se registran DOS pagos (uno en efectivo y otro por transferencia)
// para que la caja física y los comprobantes queden bien.
export async function registrarPagoMixto(input: {
  trabajo_id: string
  cliente_id?: string | null
  importe_efectivo: number
  importe_transferencia: number
  observacion?: string
}) {
  const efectivo = Number(input.importe_efectivo)
  const transferencia = Number(input.importe_transferencia)

  if (!(efectivo > 0) || !(transferencia > 0)) {
    return { error: 'En un pago mixto ingresá tanto el importe en efectivo como el de transferencia.' }
  }

  const supabase = await createClient()

  const { data: trabajo } = await supabase
    .from('trabajos_con_saldo')
    .select('saldo, numero')
    .eq('id', input.trabajo_id)
    .single()

  if (trabajo && efectivo + transferencia > trabajo.saldo) {
    return {
      error: `La suma de los importes (${formatearMoneda(efectivo + transferencia)}) supera el saldo pendiente (${formatearMoneda(trabajo.saldo)}) del trabajo ${trabajo.numero}.`,
    }
  }

  const nota = `Pago mixto: efectivo ${formatearMoneda(efectivo)} + transferencia ${formatearMoneda(transferencia)}`
  const observacion = input.observacion?.trim() ? `${nota}. ${input.observacion.trim()}` : nota

  const pagoEfectivo = await registrarPago({
    trabajo_id: input.trabajo_id,
    cliente_id: input.cliente_id,
    importe: efectivo,
    medio_pago: 'efectivo',
    observacion,
  })

  if (pagoEfectivo.error || !pagoEfectivo.data) {
    return { error: pagoEfectivo.error ?? 'No se pudo registrar el pago en efectivo.' }
  }

  const pagoTransferencia = await registrarPago({
    trabajo_id: input.trabajo_id,
    cliente_id: input.cliente_id,
    importe: transferencia,
    medio_pago: 'transferencia',
    observacion,
  })

  if (pagoTransferencia.error || !pagoTransferencia.data) {
    return {
      error: `Se registró el pago en efectivo (${formatearMoneda(efectivo)}), pero falló la transferencia: ${pagoTransferencia.error ?? 'error desconocido'}. Registrala por separado.`,
    }
  }

  return { data: { efectivo: pagoEfectivo.data, transferencia: pagoTransferencia.data } }
}

export async function actualizarPago(pagoId: string, input: PagoEditInput) {
  const parsed = pagoEditSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pagoActual, error: errorPago } = await supabase
    .from('pagos')
    .select('*, trabajos(numero)')
    .eq('id', pagoId)
    .single()

  if (errorPago || !pagoActual) {
    return { error: 'No se encontró el pago' }
  }

  // Bloquear la edición si el mes de caja correspondiente a la fecha
  // del pago ya fue cerrado (mismo criterio que ya usa el módulo de Caja)
  const [anio, mes] = pagoActual.fecha.split('-').map(Number)
  const { data: cierre } = await supabase
    .from('caja_mensual')
    .select('cerrado')
    .eq('mes', mes)
    .eq('anio', anio)
    .maybeSingle()

  if (cierre?.cerrado) {
    return { error: 'No se puede editar: el mes de caja de este pago ya está cerrado.' }
  }

  // El saldo del trabajo (vista trabajos_con_saldo) ya descuenta el importe
  // ACTUAL de este pago, así que el máximo permitido para el nuevo importe
  // es ese saldo más lo que este pago ya aportaba.
  const { data: trabajo } = await supabase
    .from('trabajos_con_saldo')
    .select('saldo, numero')
    .eq('id', pagoActual.trabajo_id)
    .single()

  const maximoPermitido = (trabajo?.saldo ?? 0) + pagoActual.importe
  if (parsed.data.importe > maximoPermitido) {
    return {
      error: `El importe ($${parsed.data.importe}) supera el máximo permitido ($${maximoPermitido}) para no exceder el precio del trabajo ${trabajo?.numero ?? pagoActual.trabajos?.numero}.`,
    }
  }

  const { error } = await supabase
    .from('pagos')
    .update(parsed.data)
    .eq('id', pagoId)

  if (error) return { error: error.message }

  // Mantener sincronizado el movimiento de caja que este pago generó
  // automáticamente (vinculado por pago_id, migración 0011)
  const { error: errorCaja } = await supabase
    .from('caja_movimientos')
    .update({
      monto: parsed.data.importe,
      medio_pago: parsed.data.medio_pago,
    })
    .eq('pago_id', pagoId)

  if (errorCaja) {
    return { error: `El pago se actualizó pero falló la sincronización con caja: ${errorCaja.message}` }
  }

    await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'editar_pago',
    entidad: 'pago',
    entidadId: pagoId,
    detalle: {
      antes: { importe: pagoActual.importe, medio_pago: pagoActual.medio_pago, detalle_medio_pago: pagoActual.detalle_medio_pago },
      despues: parsed.data,
    },
  })

  revalidatePath(`/trabajos/${pagoActual.trabajo_id}`)
  revalidatePath('/caja')
  return { success: true }
}

// Elimina un pago de un trabajo y el movimiento de caja que generó. Solo
// administrador. No permite borrar pagos de un mes de caja ya cerrado.
// El saldo del trabajo se recalcula solo (vista trabajos_con_saldo).
export async function eliminarPago(pagoId: string) {
  const sinPermiso = await errorSiNoEsAdministrador()
  if (sinPermiso) return { error: sinPermiso.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pago, error: errorPago } = await supabase
    .from('pagos')
    .select('id, trabajo_id, importe, medio_pago, detalle_medio_pago, fecha, comprobante_url')
    .eq('id', pagoId)
    .single()

  if (errorPago || !pago) return { error: 'No se encontró el pago' }

  // Se revisa la fecha del pago y la del movimiento de caja asociado
  const { data: movimientos } = await supabase
    .from('caja_movimientos')
    .select('fecha')
    .eq('pago_id', pagoId)

  const meses = new Set<string>([
    String(pago.fecha).slice(0, 7),
    ...(movimientos ?? []).map((m) => String(m.fecha).slice(0, 7)),
  ])

  for (const mesAnio of meses) {
    const [anio, mes] = mesAnio.split('-').map(Number)
    const { data: cierre } = await supabase
      .from('caja_mensual')
      .select('cerrado')
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle()

    if (cierre?.cerrado) {
      return { error: 'No se puede eliminar: el mes de caja de este pago ya está cerrado.' }
    }
  }

  const { error } = await supabase.rpc('eliminar_pago', { p_pago_id: pagoId })
  if (error) return { error: error.message }

  // Si tenía comprobante adjunto, se borra el archivo (si falla, no importa)
  if (pago.comprobante_url) {
    await supabase.storage.from('comprobantes').remove([pago.comprobante_url])
  }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'eliminar_pago',
    entidad: 'pago',
    entidadId: pagoId,
    detalle: {
      trabajo_id: pago.trabajo_id,
      importe: pago.importe,
      medio_pago: pago.medio_pago,
      detalle_medio_pago: pago.detalle_medio_pago,
    },
  })

  revalidatePath(`/trabajos/${pago.trabajo_id}`)
  revalidatePath('/caja')
  revalidatePath('/deudas')
  revalidatePath('/alertas')
  return { success: true }
}

// Guarda en el pago la ruta del comprobante que el navegador ya subió al
// bucket "comprobantes" (carpeta pagos/<trabajo_id>/). No modifica importes,
// por eso se puede usar aunque el mes de caja esté cerrado.
export async function adjuntarComprobantePago(pagoId: string, ruta: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Debés iniciar sesión.' }

  const { data: pago } = await supabase
    .from('pagos')
    .select('trabajo_id')
    .eq('id', pagoId)
    .single()

  if (!pago) return { error: 'No se encontró el pago' }

  if (!ruta.startsWith(`pagos/${pago.trabajo_id}/`)) {
    return { error: 'Ruta de comprobante inválida.' }
  }

  const { error } = await supabase
    .from('pagos')
    .update({ comprobante_url: ruta })
    .eq('id', pagoId)

  if (error) return { error: error.message }

  await registrarAuditoria({
    usuarioId: user.id,
    accion: 'adjuntar_comprobante_pago',
    entidad: 'pago',
    entidadId: pagoId,
    detalle: { trabajo_id: pago.trabajo_id },
  })

  revalidatePath(`/trabajos/${pago.trabajo_id}`)
  revalidatePath('/alertas')
  revalidatePath('/caja')
  return { success: true }
}