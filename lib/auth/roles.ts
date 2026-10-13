import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Rol } from '@/lib/types/usuario'

export async function obtenerRolDelUsuario(): Promise<Rol | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  return (data?.rol as Rol | undefined) ?? null
}

export async function esAdministrador(): Promise<boolean> {
  return (await obtenerRolDelUsuario()) === 'administrador'
}

// Para páginas: si no es administrador, lo manda al panel.
export async function redirigirSiNoEsAdministrador() {
  if (!(await esAdministrador())) {
    redirect('/')
  }
}

// Para acciones del servidor: devuelve { error } si no es administrador,
// o null si tiene permiso. Uso:
//   const sinPermiso = await errorSiNoEsAdministrador()
//   if (sinPermiso) return sinPermiso
export async function errorSiNoEsAdministrador(
  mensaje = 'Solo un administrador puede realizar esta acción.'
): Promise<{ error: string } | null> {
  if (await esAdministrador()) return null
  return { error: mensaje }
}