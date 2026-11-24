import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

let passwordRecoveryEventSeen = false;
if (supabase) {
  supabase.auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY') passwordRecoveryEventSeen = true;
    if (event === 'SIGNED_OUT') passwordRecoveryEventSeen = false;
  });
}

export const hasPasswordRecoveryEvent = () => passwordRecoveryEventSeen;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }
  return supabase;
};

export const runSupabaseConnectionDiagnostic = async (): Promise<'succeeded' | 'failed'> => {
  if (!supabase) return 'failed';

  try {
    const { error } = await supabase.auth.getSession();
    return error ? 'failed' : 'succeeded';
  } catch {
    return 'failed';
  }
};
