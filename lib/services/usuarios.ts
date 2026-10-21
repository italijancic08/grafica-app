'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { crearUsuarioSchema, type CrearUsuarioInput } from '@/lib/validations/usuario'

export async function crearUsuario(input: CrearUsuarioInput) {
  // 1. Verificar que quien llama es un administrador
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: solicitante } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (solicitante?.rol !== 'administrador') {
    return { error: 'Solo un administrador puede crear usuarios' }
  }

  // 2. Validar los datos recibidos
  const parsed = crearUsuarioSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { nombre, email, password, rol } = parsed.data

  // 3. Crear el usuario en Supabase Auth (requiere permisos de administrador)
  const admin = createAdminClient()
  const { data: nuevoAuthUser, error: errorAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (errorAuth || !nuevoAuthUser.user) {
    return { error: errorAuth?.message ?? 'No se pudo crear el usuario' }
  }

  // 4. Vincularlo en nuestra tabla usuarios
  const { error: errorTabla } = await admin.from('usuarios').insert({
    id: nuevoAuthUser.user.id,
    nombre,
    email,
    rol,
    activo: true,
  })

  if (errorTabla) {
    return { error: errorTabla.message }
  }

  // 5. Auditoría
  await admin.from('auditoria').insert({
    usuario_id: user.id,
    accion: 'crear',
    entidad: 'usuario',
    entidad_id: nuevoAuthUser.user.id,
    detalle: { nombre, email, rol },
  })

  return { success: true }
}

export async function listarUsuarios() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function eliminarUsuario(usuarioId: string) {
  // 1. Verificar que quien llama es un administrador
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: solicitante } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (solicitante?.rol !== 'administrador') {
    return { error: 'Solo un administrador puede eliminar usuarios' }
  }

  // 2. No permitir que se elimine a sí mismo
  if (usuarioId === user.id) {
    return { error: 'No puedes eliminar tu propio usuario' }
  }

  const admin = createAdminClient()

  // 3. Buscar el usuario a eliminar
  const { data: objetivo } = await admin
    .from('usuarios')
    .select('nombre, email, rol')
    .eq('id', usuarioId)
    .single()

  if (!objetivo) {
    return { error: 'El usuario no existe' }
  }

  // 4. No dejar el sistema sin administradores
  if (objetivo.rol === 'administrador') {
    const { count } = await admin
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('rol', 'administrador')

    if ((count ?? 0) <= 1) {
      return { error: 'No se puede eliminar al único administrador' }
    }
  }

  // 5. Eliminar de Supabase Auth (la fila de "usuarios" se borra en cascada)
  const { error: errorAuth } = await admin.auth.admin.deleteUser(usuarioId)

  if (errorAuth) {
    console.error('[Eliminar usuario]', errorAuth.message)
    return {
      error:
        'No se pudo eliminar. Si el usuario ya tiene trabajos, pagos, movimientos o liquidaciones registrados, no puede borrarse para no perder el historial.',
    }
  }

  // 6. Auditoría
  await admin.from('auditoria').insert({
    usuario_id: user.id,
    accion: 'eliminar',
    entidad: 'usuario',
    entidad_id: usuarioId,
    detalle: { nombre: objetivo.nombre, email: objetivo.email, rol: objetivo.rol },
  })

  return { success: true }
}