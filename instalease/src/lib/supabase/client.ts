/**
 * Supabase Client Configuration
 * 
 * Creates and exports a singleton Supabase client instance for use throughout the application.
 * This client is configured with the public anon key and is safe to use in browser environments.
 * 
 * @module lib/supabase/client
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase project URL - Get this from your Supabase project settings
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Supabase anonymous key - Get this from your Supabase project settings
 * This key is safe to expose in client-side code as Row Level Security (RLS) policies protect data
 */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.warn(
      'Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }
}

/**
 * Singleton Supabase client instance
 * 
 * @example
 * ```ts
 * import { supabase } from '@/lib/supabase/client';
 * const { data, error } = await supabase.from('customers').select('*');
 * ```
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

