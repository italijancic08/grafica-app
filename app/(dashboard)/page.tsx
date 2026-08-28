import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

const { data: perfil, error: errorPerfil } = await supabase
  .from('usuarios')
  .select('nombre, rol')
  .eq('id', user?.id)
  .single()

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Hola, {perfil?.nombre ?? 'usuario'} 👋
      </h1>
      <p className="mt-1 text-sm text-gray-500 capitalize">
        Rol: {perfil?.rol}
      </p>
    </div>
  )
}