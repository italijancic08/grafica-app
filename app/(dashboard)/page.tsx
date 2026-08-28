import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getSession()

  return (
    <div>
      <h1>Conexión con Supabase</h1>
      <p>{error ? `Error: ${error.message}` : 'Conexión establecida correctamente ✅'}</p>
    </div>
  )
}