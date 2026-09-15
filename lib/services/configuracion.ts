'use server'

import { createClient } from '@/lib/supabase/server'
import { umbralCajaBajaSchema } from '@/lib/validations/configuracion'
import { registrarAuditoria } from '@/lib/services/auditoria'
import { revalidatePath } from 'next/cache'

const UMBRAL_CAJA_BAJA_DEFAULT = 10000
const VALOR_HORA_DEFAULT = 0

export async function obtenerUmbralCajaBaja(): Promise<number> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'umbral_caja_baja')
    .maybeSingle()

  const valor = data?.valor

  return typeof valor === 'number'
    ? valor
    : UMBRAL_CAJA_BAJA_DEFAULT
}

export async function actualizarUmbralCajaBaja(
  input: { monto: number }
) {
  const parsed =
    umbralCajaBajaSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
    }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('configuracion')
    .upsert(
      {
        clave: 'umbral_caja_baja',
        valor: parsed.data.monto,
      },
      {
        onConflict: 'clave',
      }
    )

  if (error) {
    return { error: error.message }
  }

  await registrarAuditoria({
    usuarioId: user?.id,
    accion: 'editar',
    entidad: 'configuracion',
    entidadId: 'umbral_caja_baja',
    detalle: {
      valor: parsed.data.monto,
    },
  })

  revalidatePath('/configuracion')
  revalidatePath('/')

  return { success: true }
}


/* ============================================================
   VALOR HORA
   ============================================================ */

export async function obtenerValorHora(): Promise<number> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'valor_hora_trabajador')
    .maybeSingle()

  const valor = data?.valor

  return typeof valor === 'number'
    ? valor
    : VALOR_HORA_DEFAULT
}

export async function actualizarValorHora(
  valorHora: number
) {
  if (
    !Number.isFinite(valorHora) ||
    valorHora < 0
  ) {
    return {
      error:
        'Ingresá un valor por hora válido.',
    }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'No autenticado.',
    }
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'administrador') {
    return {
      error:
        'Solo un administrador puede modificar el valor de la hora.',
    }
  }

  const { error } = await supabase
    .from('configuracion')
    .upsert(
      {
        clave: 'valor_hora_trabajador',
        valor: valorHora,
      },
      {
        onConflict: 'clave',
      }
    )

  if (error) {
    return {
      error: error.message,
    }
  }

  await registrarAuditoria({
    usuarioId: user.id,
    accion: 'editar',
    entidad: 'configuracion',
    entidadId: 'valor_hora_trabajador',
    detalle: {
      valor: valorHora,
    },
  })

  revalidatePath('/configuracion')
  revalidatePath('/paga')

  return {
    success: true,
  }
}