/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function createClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mcnviqaheqzlvlrsllfi.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_8BCE0HNr_3-06HsJWAdaFg_S_YPl4I4'
    client = createBrowserClient(url, key)
  }
  return client
}

