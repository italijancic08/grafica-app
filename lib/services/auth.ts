'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function cambiarContrasena(
  contrasenaActual: string,
  contrasenaNueva: string
) {
  if (contrasenaNueva.length < 8) {
    return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' }
  }

  if (contrasenaNueva === contrasenaActual) {
    return { error: 'La nueva contraseña debe ser distinta de la actual.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: 'No hay una sesión activa.' }
  }

  // Verificamos que conozca la contraseña actual antes de cambiarla.
  const { error: errorActual } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: contrasenaActual,
  })

  if (errorActual) {
    return { error: 'La contraseña actual es incorrecta.' }
  }

  const { error } = await supabase.auth.updateUser({
    password: contrasenaNueva,
  })

  if (error) {
    console.error('[Cambiar contraseña]', error.message)
    return { error: 'No se pudo cambiar la contraseña. Probá de nuevo.' }
  }

  return { success: true }
}