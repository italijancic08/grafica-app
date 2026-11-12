'use server'

import { createClient } from '@/lib/supabase/server'
import { trabajoSchema, trabajoEditSchema, type TrabajoInput, type TrabajoEditInput } from '@/lib/validations/trabajo'
import { revalidatePath } from 'next/cache'
import type { EstadoOperativo } from '@/lib/types/trabajo'
import { fechaHoyArgentina } from '@/lib/utils/formato'
import { calcularPrecioConDescuento } from '@/lib/utils/descuento'
import { generarComprobante } from '@/lib/services/facturas'

export async function listarTrabajos(
  estados?: EstadoOperativo[],
  antiguosPrimero: boolean = false
) {
  const supabase = await createClient()

  let query = supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono), empresas_clientes(nombre)')
    .order('creado_en', { ascending: antiguosPrimero })

  if (estados && estados.length > 0) {
    query = query.in('estado_operativo', estados)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export async function obtenerTrabajo(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono), empresas_clientes(nombre)')
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function crearTrabajo(input: TrabajoInput) {
  const parsed = trabajoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // El descuento se aplica sobre el precio cargado. precio_final es lo que
  // efectivamente paga el cliente (por eso saldo, pagos y reportes no cambian).
  const calculo = calcularPrecioConDescuento(
    parsed.data.precio_base ?? 0,
    parsed.data.descuento_tipo,
    parsed.data.descuento_valor
  )
  if (calculo.error) return { error: calculo.error }
  const conDescuento = calculo.descuento > 0

  // Todo trabajo nace como presupuesto. precio_final = 0 significa "sin definir".
  const { data, error } = await supabase
    .from('trabajos')
    .insert({
      cliente_id: parsed.data.cliente_id || null,
      empresa_cliente_id: parsed.data.empresa_cliente_id || null,
      descripcion: parsed.data.descripcion,
      rubro: parsed.data.rubro ?? null,
      precio_final: calculo.precioFinal,
      precio_base: conDescuento ? parsed.data.precio_base : null,
      descuento_tipo: conDescuento ? parsed.data.descuento_tipo : null,
      descuento_valor: conDescuento ? parsed.data.descuento_valor : 0,
      ancho_cm: parsed.data.ancho_cm ?? null,
      largo_cm: parsed.data.largo_cm ?? null,
      fecha_maxima: parsed.data.fecha_maxima || null,
      requiere_turno: parsed.data.requiere_turno ?? false,
      estado_operativo: 'PRESUPUESTO',
      usuario_carga_id: user?.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (parsed.data.requiere_turno) {
    const { error: errorTurno } = await supabase.from('turnos').insert({
      trabajo_id: data.id,
      fecha: parsed.data.turno_fecha || null,
      hora: parsed.data.turno_hora || null,
      instalador_id: parsed.data.instalador_id || null,
    })
    if (errorTurno) {
      await supabase.from('trabajos').delete().eq('id', data.id)
      return { error: `No se pudo crear el turno: ${errorTurno.message}` }
    }
  }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'crear',
    entidad: 'trabajo',
    entidad_id: data.id,
    detalle: {
      numero: data.numero,
      estado: 'PRESUPUESTO',
      precio_final: data.precio_final,
      ...(conDescuento ? { precio_base: parsed.data.precio_base, descuento: calculo.descuento } : {}),
    },
  })

  revalidatePath('/presupuestos')
  revalidatePath('/trabajos')
  revalidatePath('/turnos')
  return { data }
}

export async function actualizarTrabajo(trabajoId: string, input: TrabajoEditInput) {
  const parsed = trabajoEditSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trabajoAnterior } = await supabase
    .from('trabajos')
    .select('estado_operativo, cliente_id, empresa_cliente_id, descripcion, rubro, fecha_maxima, precio_final, precio_base, descuento_tipo, descuento_valor, ancho_cm, largo_cm')
    .eq('id', trabajoId)
    .single()

  if (!trabajoAnterior) return { error: 'No se encontró el trabajo' }

  // precio_base llega SIN descuento; precio_final es lo que paga el cliente.
  const calculo = calcularPrecioConDescuento(
    parsed.data.precio_base,
    parsed.data.descuento_tipo,
    parsed.data.descuento_valor
  )
  if (calculo.error) return { error: calculo.error }
  const conDescuento = calculo.descuento > 0

  if (trabajoAnterior.estado_operativo === 'RECHAZADO') {
    return { error: 'Un presupuesto rechazado no se puede modificar.' }
  }

  const esPresupuesto = trabajoAnterior.estado_operativo === 'PRESUPUESTO'

  // Todo trabajo necesita un cliente o una empresa (o los dos)
  const clienteFinal = esPresupuesto && parsed.data.cliente_id !== undefined
    ? parsed.data.cliente_id || null
    : trabajoAnterior.cliente_id
  const empresaFinal = parsed.data.empresa_cliente_id !== undefined
    ? parsed.data.empresa_cliente_id || null
    : trabajoAnterior.empresa_cliente_id
  if (!clienteFinal && !empresaFinal) {
    return { error: 'Seleccioná un cliente o una empresa.' }
  }

  // Un precio cero solo está permitido para clientes o empresas autorizados.
  // La base de datos verifica el permiso también en el momento de guardar.
  if (!esPresupuesto && calculo.precioFinal === 0) {
    const empresaId = parsed.data.empresa_cliente_id !== undefined
      ? parsed.data.empresa_cliente_id || null
      : trabajoAnterior.empresa_cliente_id
    const { data: autorizado, error: errorAutorizacion } = await supabase.rpc(
      'cliente_puede_recibir_gratis', {
        p_cliente_id: trabajoAnterior.cliente_id,
        p_empresa_id: empresaId,
      }
    )
    if (errorAutorizacion) return { error: errorAutorizacion.message }
    // No bloquear la edición de un trabajo que ya tenía precio cero.
    if (!autorizado && Number(trabajoAnterior.precio_final) !== 0) {
      return { error: 'El cliente o empresa no está autorizado para trabajos gratuitos.' }
    }
  }

  // El rubro puede quedar sin definir solo mientras es presupuesto
  if (!esPresupuesto && !parsed.data.rubro) {
    return { error: 'Seleccioná un rubro' }
  }

  // Evitar que el precio final quede por debajo de lo ya pagado (saldo negativo)
  if (!esPresupuesto) {
    const { data: conSaldo } = await supabase
      .from('trabajos_con_saldo')
      .select('total_pagado, numero')
      .eq('id', trabajoId)
      .single()

    if (conSaldo && calculo.precioFinal < conSaldo.total_pagado) {
      return {
        error: `El precio final ($${calculo.precioFinal}) no puede ser menor a lo ya pagado ($${conSaldo.total_pagado}) en el trabajo ${conSaldo.numero}.`,
      }
    }
  }

  const { error } = await supabase
    .from('trabajos')
    .update({
      // El cliente solo se puede reasignar mientras es presupuesto
      ...(esPresupuesto && parsed.data.cliente_id !== undefined ? { cliente_id: parsed.data.cliente_id || null } : {}),
      // La empresa se puede cambiar en cualquier momento (vacío = a nombre del cliente)
      ...(parsed.data.empresa_cliente_id !== undefined
        ? { empresa_cliente_id: parsed.data.empresa_cliente_id || null }
        : {}),
      descripcion: parsed.data.descripcion,
      rubro: parsed.data.rubro ?? null,
      fecha_maxima: parsed.data.fecha_maxima || null,
      precio_final: calculo.precioFinal,
      precio_base: conDescuento ? parsed.data.precio_base : null,
      descuento_tipo: conDescuento ? parsed.data.descuento_tipo : null,
      descuento_valor: conDescuento ? parsed.data.descuento_valor : 0,
      ancho_cm: parsed.data.ancho_cm ?? null,
      largo_cm: parsed.data.largo_cm ?? null,
      modificado_en: new Date().toISOString(),
    })
    .eq('id', trabajoId)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'editar',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: { antes: trabajoAnterior, despues: { ...parsed.data, precio_final: calculo.precioFinal } },
  })

  revalidatePath('/presupuestos')
  revalidatePath('/trabajos')
  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}

export async function cambiarEstadoTrabajo(
  trabajoId: string,
  nuevoEstado: EstadoOperativo,
  confirmarRetiroConDeuda: boolean = false
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trabajoActual, error: errorActual } = await supabase
    .from('trabajos')
    .select('estado_operativo, requiere_turno')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !trabajoActual) {
    return { error: 'No se encontró el trabajo' }
  }

  // Guardar el mismo estado no cambia nada
  if (nuevoEstado === trabajoActual.estado_operativo) {
    return { success: true }
  }

  // Estados cerrados: ya no admiten cambios
  if (['FINALIZADO', 'RETIRADO', 'CANCELADO'].includes(trabajoActual.estado_operativo)) {
    return { error: 'Este trabajo ya está cerrado y no admite cambios de estado.' }
  }

  // Finalizar tiene su propio flujo (pregunta si se notificó al cliente)
  if (nuevoEstado === 'FINALIZADO' || nuevoEstado === 'PENDIENTE_NOTIFICACION') {
    return { error: 'Para finalizar un trabajo usá el botón "Finalizado" de su ficha.' }
  }

  if (trabajoActual.estado_operativo === 'PENDIENTE_NOTIFICACION' && nuevoEstado !== 'CANCELADO') {
    return { error: 'Este trabajo espera la notificación al cliente. Usá "Notificar al cliente" en su ficha.' }
  }

  // "A coordinar" y "Turno agendado" solo tienen sentido en trabajos con turno
  if (
    (nuevoEstado === 'A_COORDINAR' || nuevoEstado === 'TURNO_AGENDADO') &&
    !trabajoActual.requiere_turno
  ) {
    return { error: 'Este estado solo se puede usar en trabajos con turno.' }
  }

  // Un presupuesto solo avanza aceptándolo (aceptarPresupuesto);
  // uno rechazado no admite más cambios.
  if (trabajoActual.estado_operativo === 'PRESUPUESTO' || trabajoActual.estado_operativo === 'RECHAZADO') {
    return { error: 'Este trabajo todavía no fue aceptado, o fue rechazado.' }
  }

  // Si se intenta retirar, verificar el saldo antes de aplicar el cambio
  if (nuevoEstado === 'RETIRADO') {
    const { data: conSaldo } = await supabase
      .from('trabajos_con_saldo')
      .select('saldo')
      .eq('id', trabajoId)
      .single()

    const saldo = conSaldo?.saldo ?? 0

    if (saldo > 0 && !confirmarRetiroConDeuda) {
      return { requiereConfirmacion: true, saldo }
    }
  }

  const camposExtra: Record<string, string> = {}
  if (nuevoEstado === 'TERMINADO') {
    camposExtra.fecha_finalizacion = fechaHoyArgentina()
  }
  if (nuevoEstado === 'RETIRADO') {
    camposExtra.fecha_retiro = fechaHoyArgentina()
  }

  const { error } = await supabase
    .from('trabajos')
    .update({
      estado_operativo: nuevoEstado,
      modificado_en: new Date().toISOString(),
      ...camposExtra,
    })
    .eq('id', trabajoId)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'cambiar_estado',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: {
      de: trabajoActual.estado_operativo,
      a: nuevoEstado,
      ...(nuevoEstado === 'RETIRADO' && confirmarRetiroConDeuda ? { retirado_con_deuda: true } : {}),
    },
  })

  revalidatePath('/trabajos')
  revalidatePath(`/trabajos/${trabajoId}`)

  // Generar el comprobante automáticamente al retirar. Si falla (por
  // ejemplo, sin datos de empresa aún cargados) no revertimos el cambio
  // de estado: el trabajo ya quedó como Retirado, solo avisamos.
  if (nuevoEstado === 'RETIRADO') {
    const resultadoComprobante = await generarComprobante(trabajoId)
    if (resultadoComprobante.error) {
      return { success: true, avisoComprobante: resultadoComprobante.error }
    }
  }

  return { success: true }
}

// Estados desde los que se puede finalizar un trabajo
const ESTADOS_FINALIZABLES: EstadoOperativo[] = [
  'INGRESADO',
  'EN_PRODUCCION',
  'TERCERIZADO',
  'TERMINADO',
  'A_COORDINAR',
  'TURNO_AGENDADO',
  'PARA_RETIRAR',
]

// Botón "Finalizado" de la ficha. notificado = respuesta a "¿Notificaste al cliente?"
//   SÍ -> queda FINALIZADO con la fecha de notificación y se genera el recibo
//   NO -> queda PENDIENTE_NOTIFICACION (sigue visible en Trabajos)
export async function finalizarTrabajo(trabajoId: string, notificado: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: actual, error: errorActual } = await supabase
    .from('trabajos')
    .select('estado_operativo, fecha_finalizacion')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !actual) return { error: 'No se encontró el trabajo' }

  if (!ESTADOS_FINALIZABLES.includes(actual.estado_operativo as EstadoOperativo)) {
    return { error: 'Este trabajo no se puede finalizar desde su estado actual.' }
  }

  const hoy = fechaHoyArgentina()
  const nuevoEstado: EstadoOperativo = notificado ? 'FINALIZADO' : 'PENDIENTE_NOTIFICACION'

  const { error } = await supabase
    .from('trabajos')
    .update({
      estado_operativo: nuevoEstado,
      // Si ya tenía fecha de finalización (trabajos viejos), se respeta
      fecha_finalizacion: actual.fecha_finalizacion ?? hoy,
      ...(notificado ? { fecha_notificacion: hoy } : {}),
      modificado_en: new Date().toISOString(),
    })
    .eq('id', trabajoId)
    .eq('estado_operativo', actual.estado_operativo)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'cambiar_estado',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: { de: actual.estado_operativo, a: nuevoEstado, cliente_notificado: notificado },
  })

  revalidatePath('/')
  revalidatePath('/trabajos')
  revalidatePath('/deudas')
  revalidatePath(`/trabajos/${trabajoId}`)

  // El recibo se genera cuando el cliente ya fue notificado. Si falla no
  // revertimos el cambio de estado: solo avisamos.
  if (notificado) {
    const resultadoComprobante = await generarComprobante(trabajoId)
    if (resultadoComprobante.error) {
      return { success: true, avisoComprobante: resultadoComprobante.error }
    }
  }

  return { success: true }
}

// Botón "Notificar al cliente" de un trabajo en PENDIENTE_NOTIFICACION
export async function notificarCliente(trabajoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: actual, error: errorActual } = await supabase
    .from('trabajos')
    .select('estado_operativo')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !actual) return { error: 'No se encontró el trabajo' }

  if (actual.estado_operativo !== 'PENDIENTE_NOTIFICACION') {
    return { error: 'Este trabajo no está pendiente de notificación.' }
  }

  const { error } = await supabase
    .from('trabajos')
    .update({
      estado_operativo: 'FINALIZADO',
      fecha_notificacion: fechaHoyArgentina(),
      modificado_en: new Date().toISOString(),
    })
    .eq('id', trabajoId)
    .eq('estado_operativo', 'PENDIENTE_NOTIFICACION')

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'cambiar_estado',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: { de: 'PENDIENTE_NOTIFICACION', a: 'FINALIZADO', cliente_notificado: true },
  })

  revalidatePath('/')
  revalidatePath('/trabajos')
  revalidatePath('/deudas')
  revalidatePath(`/trabajos/${trabajoId}`)

  const resultadoComprobante = await generarComprobante(trabajoId)
  if (resultadoComprobante.error) {
    return { success: true, avisoComprobante: resultadoComprobante.error }
  }

  return { success: true }
}

// "Muestra enviada": guarda la fecha en que se le mandó la muestra al cliente.
// fecha = null quita la marca.
export async function marcarMuestraEnviada(trabajoId: string, fecha: string | null) {
  if (fecha !== null && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: 'Fecha inválida.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('trabajos')
    .update({
      fecha_muestra_enviada: fecha,
      modificado_en: new Date().toISOString(),
    })
    .eq('id', trabajoId)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'editar',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: { muestra_enviada: fecha },
  })

  revalidatePath('/trabajos')
  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}

// Marca cuándo se envió el presupuesto al cliente. fecha = null quita el envío.
// A los 10 días sin respuesta el presupuesto se archiva solo (se calcula al listar).
export async function marcarPresupuestoEnviado(trabajoId: string, fecha: string | null) {
  if (fecha !== null && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: 'Fecha inválida.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: actual, error: errorActual } = await supabase
    .from('trabajos')
    .select('estado_operativo')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !actual) return { error: 'No se encontró el presupuesto' }

  if (actual.estado_operativo !== 'PRESUPUESTO') {
    return { error: 'Solo se puede marcar como enviado un presupuesto pendiente.' }
  }

  const { error } = await supabase
    .from('trabajos')
    .update({
      fecha_envio_presupuesto: fecha,
      modificado_en: new Date().toISOString(),
    })
    .eq('id', trabajoId)

  if (error) return { error: error.message }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'editar',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: { presupuesto_enviado: fecha },
  })

  revalidatePath('/presupuestos')
  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}

export async function listarParaRetirar() {
  return listarTrabajos(['TERMINADO', 'PARA_RETIRAR'])
}

export async function listarConDeuda() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono, whatsapp), empresas_clientes(nombre, telefono)')
    .gt('saldo', 0)
    .in('estado_operativo', ['FINALIZADO', 'RETIRADO'])
    .order('saldo', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
export async function aceptarPresupuesto(trabajoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: actual, error: errorActual } = await supabase
    .from('trabajos')
    .select('estado_operativo, precio_final, rubro, numero, requiere_turno, cliente_id, empresa_cliente_id')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !actual) return { error: 'No se encontró el presupuesto' }

  if (actual.estado_operativo !== 'PRESUPUESTO') {
    return { error: 'Este trabajo ya no está en fase de presupuesto.' }
  }
  if (Number(actual.precio_final) === 0) {
    const { data: autorizado, error: errorAutorizacion } = await supabase.rpc(
      'cliente_puede_recibir_gratis', {
        p_cliente_id: actual.cliente_id,
        p_empresa_id: actual.empresa_cliente_id,
      }
    )
    if (errorAutorizacion) return { error: errorAutorizacion.message }
    if (!autorizado) {
      return { error: 'El cliente o empresa no está autorizado para trabajos gratuitos.' }
    }
  }
  if (!actual.rubro) {
    return { error: 'Para aceptar el presupuesto tenés que elegir un rubro.' }
  }

  // El número TR-... lo asigna un trigger de la base al cambiar el estado
  const { data, error } = await supabase
    .from('trabajos')
    .update({
      estado_operativo: 'EN_PRODUCCION',
      fecha_entrada: fechaHoyArgentina(),
      modificado_en: new Date().toISOString(),
    })
    .eq('id', trabajoId)
    .eq('estado_operativo', 'PRESUPUESTO')
    .select('id, numero')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo aceptar el presupuesto.' }

  if (actual.requiere_turno) {
    const { error: errorTurno } = await supabase.from('turnos').upsert({ trabajo_id: trabajoId }, { onConflict: 'trabajo_id', ignoreDuplicates: true })
    if (errorTurno) return { error: `El presupuesto se aceptó, pero no se pudo registrar el turno: ${errorTurno.message}` }
  }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'aceptar_presupuesto',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: { numero_presupuesto: actual.numero, numero: data.numero },
  })

  revalidatePath('/presupuestos')
  revalidatePath('/trabajos')
  revalidatePath('/turnos')
  revalidatePath(`/trabajos/${trabajoId}`)
  return { data }
}

export async function rechazarPresupuesto(trabajoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('trabajos')
    .update({
      estado_operativo: 'RECHAZADO',
      modificado_en: new Date().toISOString(),
    })
    .eq('id', trabajoId)
    .eq('estado_operativo', 'PRESUPUESTO')
    .select('id, numero')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Este trabajo ya no está en fase de presupuesto.' }
  }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'rechazar_presupuesto',
    entidad: 'trabajo',
    entidad_id: trabajoId,
    detalle: { numero: data.numero },
  })

  revalidatePath('/presupuestos')
  revalidatePath(`/trabajos/${trabajoId}`)
  return { success: true }
}

export async function listarInstaladoresActivos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('instaladores')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function crearInstalador(nombre: string) {
  const nombreLimpio = nombre.trim()
  if (!nombreLimpio) return { error: 'Ingresá el nombre del instalador.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('instaladores').insert({ nombre: nombreLimpio }).select('id, nombre').single()
  if (error) return { error: error.message }
  revalidatePath('/turnos')
  revalidatePath('/trabajos/nuevo')
  return { data }
}

export async function listarTurnos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('turnos')
    .select('id, trabajo_id, fecha, hora, estado, notas, instalador_id, instaladores(id, nombre), trabajos!inner(id, numero, descripcion, precio_final, estado_operativo, requiere_turno, clientes(nombre_razon_social, telefono), empresas_clientes(nombre, telefono))')
    .eq('trabajos.requiere_turno', true)
    .not('trabajos.estado_operativo', 'in', '(PRESUPUESTO,RECHAZADO)')
    .order('fecha', { ascending: true, nullsFirst: true })
    .order('hora', { ascending: true, nullsFirst: true })
  if (error) return { error: error.message }
  // Normalizar relaciones que Supabase tipa como arrays sin un esquema generado.
  const turnos = (data ?? []).map((turno) => {
    const trabajo = Array.isArray(turno.trabajos) ? turno.trabajos[0] : turno.trabajos
    const clienteDirecto = trabajo && (Array.isArray(trabajo.clientes) ? trabajo.clientes[0] : trabajo.clientes)
    const empresa = trabajo && (Array.isArray(trabajo.empresas_clientes) ? trabajo.empresas_clientes[0] : trabajo.empresas_clientes)
    // Si el trabajo ingresó solo por una empresa, se muestran los datos de la empresa
    const cliente = clienteDirecto ?? (empresa ? { nombre_razon_social: empresa.nombre, telefono: empresa.telefono } : null)
    const instalador = Array.isArray(turno.instaladores) ? turno.instaladores[0] : turno.instaladores
    return {
      ...turno,
      instaladores: instalador ?? null,
      trabajos: {
        ...trabajo,
        estado_operativo: trabajo?.estado_operativo as EstadoOperativo,
        clientes: cliente ?? null,
      },
    }
  })
  return { data: turnos }
}

// Estados propios del turno (independientes del estado del trabajo)
const ESTADOS_DE_TURNO = ['PENDIENTE', 'CONFIRMADO', 'REALIZADO', 'CANCELADO']

export async function actualizarTurno(input: {
  id: string
  trabajo_id: string
  fecha: string
  hora: string
  instalador_id: string
  estado: string
}) {
  if (!ESTADOS_DE_TURNO.includes(input.estado)) {
    return { error: 'Estado de turno inválido.' }
  }

  if (
    (input.fecha && !input.hora) ||
    (!input.fecha && input.hora)
  ) {
    return {
      error:
        'Para asignar una fecha también tenés que indicar la hora, y viceversa.',
    }
  }

  const supabase = await createClient()

  // Se guardan solo los datos del turno: el estado del trabajo no se toca.
  const { error: errorTurno } = await supabase
    .from('turnos')
    .update({
      fecha: input.fecha || null,
      hora: input.hora || null,
      instalador_id: input.instalador_id || null,
      estado: input.estado,
      modificado_en: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (errorTurno) {
    return { error: errorTurno.message }
  }

  revalidatePath('/')
  revalidatePath('/turnos')
  revalidatePath(`/trabajos/${input.trabajo_id}`)

  return { success: true }
}
