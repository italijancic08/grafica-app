import { createClient } from '@/lib/supabase/server'
import Sidebar from './sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre, rol')
    .eq('id', user?.id)
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="sticky top-0 h-screen shrink-0">
        <Sidebar nombre={perfil?.nombre ?? 'Usuario'} rol={perfil?.rol ?? ''} />
      </div>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}