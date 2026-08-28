import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Este cliente usa la Secret key: se salta RLS y puede crear usuarios.
// SOLO se importa desde Server Actions o Route Handlers. Nunca desde un componente de cliente.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}