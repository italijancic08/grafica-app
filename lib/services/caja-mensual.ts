'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CierreMensual {
  id: string
  mes: number
  anio: number
  total_ingresos: number
  total_egresos: number
  saldo: number
  cerrado: boolean
  fecha_cierre: string | null
}

export async function obtenerCierreDelMes(mes: number, anio: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('caja_mensual')
    .select('*')
    .eq('mes', mes)
    .eq('anio', anio)
    .maybeSingle()

  if (error) return { error: error.message }
  return { data: data as CierreMensual | null }
}

export async function cerrarMes(mes: number, anio: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.rpc('cerrar_caja_mensual', { p_mes: mes, p_anio: anio })

  if (error) {
    if (error.message.includes('ya fue cerrado')) {
      return { error: 'Este mes ya fue cerrado anteriormente.' }
    }
    return { error: error.message }
  }

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'cerrar_caja_mensual',
    entidad: 'caja_mensual',
    detalle: { mes, anio },
  })

  revalidatePath('/caja')
  return { success: true }
}