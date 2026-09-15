'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  calcularHoras,
  obtenerSemanaActual,
  formatearFechaHoraArgentina,
} from '@/lib/utils/semana-fichaje'

export async function obtenerUsuarioActual() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol, activo')
    .eq('id', user.id)
    .single()

  return usuario
}

export async function obtenerFichajeAbierto() {
  const usuario = await obtenerUsuarioActual()

  if (!usuario) {
    return { error: 'No autenticado' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fichajes')
    .select('*')
    .eq('usuario_id', usuario.id)
    .is('salida', null)
    .order('entrada', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { error: error.message }

  return { data }
}

export async function ficharEntrada() {
  const usuario = await obtenerUsuarioActual()

  if (!usuario) {
    return { error: 'No autenticado' }
  }

  if (!usuario.activo) {
    return { error: 'El usuario está desactivado' }
  }

  const supabase = await createClient()

  const { data: abierto } = await supabase
    .from('fichajes')
    .select('id, entrada')
    .eq('usuario_id', usuario.id)
    .is('salida', null)
    .maybeSingle()

  if (abierto) {
    return {
      error: `Ya tenés un fichaje abierto desde ${formatearFechaHoraArgentina(abierto.entrada)}`,
    }
  }

  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from('fichajes')
    .insert({
      usuario_id: usuario.id,
      entrada: ahora,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya tenés una entrada abierta.' }
    }

    return { error: error.message }
  }

  revalidatePath('/fichaje')
  revalidatePath('/')

  return {
    success: true,
    data,
  }
}

export async function ficharSalida() {
  const usuario = await obtenerUsuarioActual()

  if (!usuario) {
    return { error: 'No autenticado' }
  }

  const supabase = await createClient()

  const { data: fichaje, error: errorBusqueda } = await supabase
    .from('fichajes')
    .select('*')
    .eq('usuario_id', usuario.id)
    .is('salida', null)
    .order('entrada', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (errorBusqueda) {
    return { error: errorBusqueda.message }
  }

  if (!fichaje) {
    return { error: 'No tenés ninguna entrada abierta.' }
  }

  const salida = new Date()
  const horas = calcularHoras(fichaje.entrada, salida)

  const { data, error } = await supabase
    .from('fichajes')
    .update({
      salida: salida.toISOString(),
      horas_trabajadas: horas,
      modificado_en: salida.toISOString(),
    })
    .eq('id', fichaje.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/fichaje')
  revalidatePath('/paga')
  revalidatePath('/')

  return {
    success: true,
    data,
  }
}

export async function listarFichajesSemana(
  usuarioId?: string
) {
  const usuario = await obtenerUsuarioActual()

  if (!usuario) {
    return { error: 'No autenticado' }
  }

  const supabase = await createClient()
  const semana = obtenerSemanaActual()

  let query = supabase
    .from('fichajes')
    .select(`
      *,
      usuarios (
        id,
        nombre,
        email
      )
    `)
    .gte('entrada', semana.inicioDate.toISOString())
    .lte('entrada', semana.finDate.toISOString())
    .order('entrada', { ascending: false })

  /*
   * Un empleado puede consultar sus propios fichajes.
   * Administradores y supervisores pueden consultar todos.
   */
  if (
    usuario.rol !== 'administrador' &&
    usuario.rol !== 'supervisor'
  ) {
    query = query.eq('usuario_id', usuario.id)
  } else if (usuarioId) {
    query = query.eq('usuario_id', usuarioId)
  }

  const { data, error } = await query

  if (error) return { error: error.message }

  return {
    data,
    semana,
  }
}

export async function listarFichajesRango(
  inicio: Date,
  fin: Date
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fichajes')
    .select(`
      *,
      usuarios (
        id,
        nombre,
        email,
        rol,
        activo
      )
    `)
    .gte('entrada', inicio.toISOString())
    .lte('entrada', fin.toISOString())
    .order('entrada', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data }
}