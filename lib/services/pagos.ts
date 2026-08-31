'use server'

import { createClient } from '@/lib/supabase/server'
import { pagoSchema, type PagoInput } from '@/lib/validations/pago'
import { revalidatePath } from 'next/cache'

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
    .select('saldo, numero')
    .eq('id', parsed.data.trabajo_id)
    .single()

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

  await supabase.from('auditoria').insert({
    usuario_id: user?.id,
    accion: 'registrar_pago',
    entidad: 'pago',
    entidad_id: data.id,
    detalle: { trabajo_id: parsed.data.trabajo_id, importe: parsed.data.importe },
  })

  revalidatePath(`/trabajos/${parsed.data.trabajo_id}`)
  return { data }
}