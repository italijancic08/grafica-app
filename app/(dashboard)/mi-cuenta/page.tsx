import { createClient } from '@/lib/supabase/server'

export default async function MiCuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre, rol')
    .eq('id', user?.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Mi cuenta</h1>

      <div className="max-w-sm space-y-3 rounded-lg border border-gray-200 p-4 text-sm">
        <div>
          <p className="text-xs font-medium text-gray-500">Nombre</p>
          <p className="text-gray-900">{perfil?.nombre ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Email</p>
          <p className="text-gray-900">{user?.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Rol</p>
          <p className="capitalize text-gray-900">{perfil?.rol ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}