'use server'

import { createClient } from '@/lib/supabase/server'
import { trabajoSchema, trabajoEditSchema, type TrabajoInput, type TrabajoEditInput } from '@/lib/validations/trabajo'
import { revalidatePath } from 'next/cache'
import type { EstadoOperativo } from '@/lib/types/trabajo'
import { fechaHoyArgentina } from '@/lib/utils/formato'
import { generarComprobante } from '@/lib/services/facturas'

export async function listarTrabajos(estados?: EstadoOperativo[]) {
  const supabase = await createClient()

  let query = supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono)')
    .order('creado_en', { ascending: false })

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
    .select('*, clientes(nombre_razon_social, telefono)')
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

  // Todo trabajo nace como presupuesto. precio_final = 0 significa "sin definir".
  const { data, error } = await supabase
    .from('trabajos')
    .insert({
      cliente_id: parsed.data.cliente_id,
      descripcion: parsed.data.descripcion,
      rubro: parsed.data.rubro ?? null,
      precio_final: parsed.data.precio_final ?? 0,
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
    detalle: { numero: data.numero, estado: 'PRESUPUESTO', precio_final: data.precio_final },
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
    .select('estado_operativo, cliente_id, descripcion, rubro, fecha_maxima, precio_final, ancho_cm, largo_cm')
    .eq('id', trabajoId)
    .single()

  if (!trabajoAnterior) return { error: 'No se encontró el trabajo' }

  if (trabajoAnterior.estado_operativo === 'RECHAZADO') {
    return { error: 'Un presupuesto rechazado no se puede modificar.' }
  }

  const esPresupuesto = trabajoAnterior.estado_operativo === 'PRESUPUESTO'

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

    if (conSaldo && parsed.data.precio_final < conSaldo.total_pagado) {
      return {
        error: `El precio final ($${parsed.data.precio_final}) no puede ser menor a lo ya pagado ($${conSaldo.total_pagado}) en el trabajo ${conSaldo.numero}.`,
      }
    }
  }

  const { error } = await supabase
    .from('trabajos')
    .update({
      // El cliente solo se puede reasignar mientras es presupuesto
      ...(esPresupuesto && parsed.data.cliente_id ? { cliente_id: parsed.data.cliente_id } : {}),
      descripcion: parsed.data.descripcion,
      rubro: parsed.data.rubro ?? null,
      fecha_maxima: parsed.data.fecha_maxima || null,
      precio_final: parsed.data.precio_final,
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
    detalle: { antes: trabajoAnterior, despues: parsed.data },
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
    .select('estado_operativo')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !trabajoActual) {
    return { error: 'No se encontró el trabajo' }
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

export async function listarParaRetirar() {
  return listarTrabajos(['TERMINADO', 'PARA_RETIRAR'])
}

export async function listarConDeuda() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trabajos_con_saldo')
    .select('*, clientes(nombre_razon_social, telefono, whatsapp)')
    .gt('saldo', 0)
    .not('estado_operativo', 'in', '(CANCELADO,PRESUPUESTO,RECHAZADO)')
    .order('saldo', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
export async function aceptarPresupuesto(trabajoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: actual, error: errorActual } = await supabase
    .from('trabajos')
    .select('estado_operativo, precio_final, rubro, numero, requiere_turno')
    .eq('id', trabajoId)
    .single()

  if (errorActual || !actual) return { error: 'No se encontró el presupuesto' }

  if (actual.estado_operativo !== 'PRESUPUESTO') {
    return { error: 'Este trabajo ya no está en fase de presupuesto.' }
  }
  if (!actual.precio_final || Number(actual.precio_final) <= 0) {
    return { error: 'Para aceptar el presupuesto tenés que cargar un precio mayor a $0.' }
  }
  if (!actual.rubro) {
    return { error: 'Para aceptar el presupuesto tenés que elegir un rubro.' }
  }

  // El número TR-... lo asigna un trigger de la base al cambiar el estado
  const { data, error } = await supabase
    .from('trabajos')
    .update({
      estado_operativo: 'INGRESADO',
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
    .select('id, trabajo_id, fecha, hora, estado, notas, instalador_id, instaladores(id, nombre), trabajos!inner(id, numero, descripcion, precio_final, estado_operativo, requiere_turno, clientes(nombre_razon_social, telefono))')
    .eq('trabajos.requiere_turno', true)
    .not('trabajos.estado_operativo', 'in', '(PRESUPUESTO,RECHAZADO)')
    .order('fecha', { ascending: true, nullsFirst: true })
    .order('hora', { ascending: true, nullsFirst: true })
  if (error) return { error: error.message }
  return { data: data ?? [] }
}


export async function actualizarTurno(input: {
  id: string
  trabajo_id: string
  fecha: string
  hora: string
  instalador_id: string
  estado: string
}) {
  const estadosPermitidos: EstadoOperativo[] = [
    'INGRESADO',
    'EN_PRODUCCION',
    'TERCERIZADO',
    'TERMINADO',
    'PARA_RETIRAR',
    'RETIRADO',
    'CANCELADO',
  ]

  if (!estadosPermitidos.includes(input.estado as EstadoOperativo)) {
    return { error: 'Estado de trabajo inválido.' }
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

  // Guardar los datos propios del turno.
  const { error: errorTurno } = await supabase
    .from('turnos')
    .update({
      fecha: input.fecha || null,
      hora: input.hora || null,
      instalador_id: input.instalador_id || null,
      modificado_en: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (errorTurno) {
    return { error: errorTurno.message }
  }

  // El estado se modifica en el trabajo asociado.
  // Turnos mostrará ese mismo estado.
  const resultadoEstado = await cambiarEstadoTrabajo(
    input.trabajo_id,
    input.estado as EstadoOperativo
  )

  if (resultadoEstado.error) {
    return { error: resultadoEstado.error }
  }

  if (resultadoEstado.requiereConfirmacion) {
    return {
      error:
        'El trabajo tiene saldo pendiente. Gestioná el retiro desde la ficha del trabajo para confirmar si corresponde.',
    }
  }

  revalidatePath('/turnos')
  revalidatePath('/trabajos')
  revalidatePath(`/trabajos/${input.trabajo_id}`)

  return { success: true }
}
