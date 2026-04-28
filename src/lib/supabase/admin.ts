import { createClient } from '@supabase/supabase-js'

// Cliente com service role — bypassa RLS
// Usar apenas em server components/actions após verificar auth com getUser()
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
