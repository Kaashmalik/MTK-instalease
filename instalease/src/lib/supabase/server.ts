/**
 * Supabase Server Client Configuration
 * 
 * Creates a Supabase client for server-side operations (Server Components, API routes, etc.)
 * This uses the service role key when available for elevated permissions.
 * 
 * @module lib/supabase/server
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Supabase project URL
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Supabase service role key - Only use this in server-side code
 * This key bypasses RLS and should NEVER be exposed to the client
 */
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

/**
 * Creates a Supabase client for server-side operations
 * 
 * @param {boolean} useServiceRole - Whether to use service role key (bypasses RLS)
 * @returns {Promise<SupabaseClient>} Configured Supabase client instance
 * 
 * @example
 * ```ts
 * // In a Server Component
 * import { createServerClient } from '@/lib/supabase/server';
 * const supabase = await createServerClient();
 * const { data } = await supabase.from('customers').select('*');
 * ```
 */
export async function createServerClient(useServiceRole = false) {
  if (useServiceRole && supabaseServiceKey && supabaseServiceKey !== 'placeholder-service-key') {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Use cookie-based auth for server components
  // Note: In Next.js 16, cookies() returns a Promise
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });
}

