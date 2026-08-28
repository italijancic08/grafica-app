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