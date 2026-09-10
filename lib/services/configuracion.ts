'use server'

import { createClient } from '@/lib/supabase/server'
import { umbralCajaBajaSchema } from '@/lib/validations/configuracion'
import { revalidatePath } from 'next/cache'

const UMBRAL_CAJA_BAJA_DEFAULT = 10000

// El valor se guarda como jsonb crudo (un número), no como texto.
export async function obtenerUmbralCajaBaja(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'umbral_caja_baja')
    .maybeSingle()

  const valor = data?.valor
  return typeof valor === 'number' ? valor : UMBRAL_CAJA_BAJA_DEFAULT
}

export async function actualizarUmbralCajaBaja(input: { monto: number }) {
  const parsed = umbralCajaBajaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('configuracion')
    .upsert({ clave: 'umbral_caja_baja', valor: parsed.data.monto }, { onConflict: 'clave' })

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  revalidatePath('/') // por si el dashboard vive en home
  return { success: true }
}