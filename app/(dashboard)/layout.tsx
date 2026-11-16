import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from './sidebar'
import AlertaTercerizaciones from './alerta-tercerizaciones'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se lee con el cliente admin (solo el perfil del usuario ya autenticado) para
  // que el nombre y el rol se vean aunque las políticas RLS de "usuarios"
  // no permitan a un empleado leer su propia fila.
  let perfil: { nombre: string; rol: string } | null = null
  if (user) {
    const { data } = await createAdminClient()
      .from('usuarios')
      .select('nombre, rol')
      .eq('id', user.id)
      .single()
    perfil = data
  }

  // Trabajos tercerizados que todavía no volvieron (para el aviso de arriba)
  let tercerizacionesEnCurso = 0
  if (user) {
    const { count } = await supabase
      .from('tercerizaciones')
      .select('id', { count: 'exact', head: true })
      .neq('estado', 'VUELTO')
    tercerizacionesEnCurso = count ?? 0
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="md:sticky md:top-0 md:h-screen md:shrink-0">
        <Sidebar nombre={perfil?.nombre ?? 'Usuario'} rol={perfil?.rol ?? ''} />
      </div>
      <main className="min-w-0 flex-1 pt-14 md:pt-0">
        {tercerizacionesEnCurso > 0 && (
          <AlertaTercerizaciones cantidad={tercerizacionesEnCurso} />
        )}
        {children}
      </main>
    </div>
  )
}