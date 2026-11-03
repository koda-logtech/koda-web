import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

function readSupabaseUrl(): string {
  const fromWindow = typeof window !== 'undefined' ? window.__ENV__?.VITE_SUPABASE_URL : undefined;
  return (fromWindow || import.meta.env.VITE_SUPABASE_URL || '').trim();
}

function readSupabaseAnonKey(): string {
  const fromWindow =
    typeof window !== 'undefined' ? window.__ENV__?.VITE_SUPABASE_ANON_KEY : undefined;
  return (fromWindow || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
}

/**
 * Cliente Supabase para Realtime no browser. Retorna null se URL/chave não
 * estiverem configuradas — o app continua só com polling HTTP.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = readSupabaseUrl();
  const anonKey = readSupabaseAnonKey();
  if (!url || !anonKey) {
    client = null;
    return client;
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}

/** Reseta o singleton (útil em testes). */
export function resetSupabaseBrowserClientForTests(): void {
  client = undefined;
}
