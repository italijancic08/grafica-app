import { listarUsuarios } from '@/lib/services/usuarios'
import FormularioUsuario from './formulario-usuario'
import { redirigirSiNoEsAdministrador } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import FilaUsuario from './fila-usuario'

export default async function UsuariosPage() {
  await redirigirSiNoEsAdministrador()

  const { data: usuarios, error } = await listarUsuarios()

  const supabase = await createClient()
  const { data: { user: usuarioActual } } = await supabase.auth.getUser()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Usuarios</h1>

      <FormularioUsuario />

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Rol</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Activo</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {error && (
              <tr><td colSpan={5} className="px-4 py-3 text-red-600">{error}</td></tr>
            )}
            {usuarios?.map((u) => (
              <FilaUsuario
                key={u.id}
                usuario={u}
                esPropio={u.id === usuarioActual?.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}