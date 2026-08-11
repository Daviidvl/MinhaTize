import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

// Client com service role — reaproveitado entre invocações da mesma instância serverless
export function getSupabaseAdmin(): SupabaseClient {
  if (!cached) {
    cached = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return cached
}
