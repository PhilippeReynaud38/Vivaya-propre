import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ===> Expose pour le débug
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase
}