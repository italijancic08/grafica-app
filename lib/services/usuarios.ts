'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  type CrearUsuarioInput,
  type EditarUsuarioInput,
} from '@/lib/validations/usuario'

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

export async function editarUsuario(usuarioId: string, input: EditarUsuarioInput) {
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
    return { error: 'Solo un administrador puede editar usuarios' }
  }

  // 2. Validar los datos recibidos
  const parsed = editarUsuarioSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { nombre, email, rol, activo, password } = parsed.data

  // 3. Buscar el estado actual del usuario
  const admin = createAdminClient()
  const { data: actual } = await admin
    .from('usuarios')
    .select('nombre, email, rol, activo')
    .eq('id', usuarioId)
    .single()

  if (!actual) {
    return { error: 'El usuario no existe' }
  }

  // 4. Protecciones
  if (usuarioId === user.id && !activo) {
    return { error: 'No puedes desactivar tu propio usuario' }
  }

  // No dejar el sistema sin administradores activos
  if (
    actual.rol === 'administrador' &&
    actual.activo &&
    (rol !== 'administrador' || !activo)
  ) {
    const { count } = await admin
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('rol', 'administrador')
      .eq('activo', true)

    if ((count ?? 0) <= 1) {
      return { error: 'Debe quedar al menos un administrador activo' }
    }
  }

  // 5. Actualizar Supabase Auth solo si cambió algo que le corresponde
  const cambiosAuth: {
    email?: string
    email_confirm?: boolean
    password?: string
    ban_duration?: string
  } = {}

  if (email !== actual.email) {
    cambiosAuth.email = email
    cambiosAuth.email_confirm = true
  }

  if (password) {
    cambiosAuth.password = password
  }

  // Bloquea (o habilita) el inicio de sesión según "activo".
  // Si no quieres este comportamiento, borra estas 3 líneas.
  if (activo !== actual.activo) {
    cambiosAuth.ban_duration = activo ? 'none' : '876000h'
  }

  if (Object.keys(cambiosAuth).length > 0) {
    const { error: errorAuth } = await admin.auth.admin.updateUserById(
      usuarioId,
      cambiosAuth
    )

    if (errorAuth) {
      console.error('[Editar usuario]', errorAuth.message)

      if (errorAuth.message.toLowerCase().includes('already')) {
        return { error: 'Ya existe un usuario con ese email' }
      }

      return { error: 'No se pudo actualizar el usuario' }
    }
  }

  // 6. Actualizar nuestra tabla usuarios
  const { error: errorTabla } = await admin
    .from('usuarios')
    .update({ nombre, email, rol, activo })
    .eq('id', usuarioId)

  if (errorTabla) {
    return { error: errorTabla.message }
  }

  // 7. Auditoría (nunca se guarda la contraseña)
  await admin.from('auditoria').insert({
    usuario_id: user.id,
    accion: 'editar',
    entidad: 'usuario',
    entidad_id: usuarioId,
    detalle: {
      antes: {
        nombre: actual.nombre,
        email: actual.email,
        rol: actual.rol,
        activo: actual.activo,
      },
      despues: { nombre, email, rol, activo },
      cambio_contrasena: Boolean(password),
    },
  })

  return { success: true }
}