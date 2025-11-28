/**
 * Authentication Store (Zustand)
 * 
 * Global state management for user authentication and session.
 * Integrates with Supabase Auth to manage user sessions, roles, and shop associations.
 * 
 * @module store/auth-store
 */

import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/**
 * User roles in order of hierarchy
 */
export type UserRole = 'super_admin' | 'admin' | 'shop_owner' | 'credit_manager' | 'sales_rep' | 'customer';

/**
 * User profile data from the users table
 */
export interface UserProfile {
  user_id: string;
  shop_id: string | null;
  username: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication store state interface
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/**
 * Authentication store using Zustand
 * 
 * Provides global state for:
 * - Current user session
 * - User profile (role, shop_id, etc.)
 * - Loading states
 * - Auth actions (sign in, sign out, refresh)
 * 
 * @example
 * ```ts
 * import { useAuthStore } from '@/store/auth-store';
 * 
 * function MyComponent() {
 *   const { user, profile, loading, signOut } = useAuthStore();
 *   if (loading) return <div>Loading...</div>;
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  /**
   * Set the current user
   */
  setUser: (user) => set({ user }),

  /**
   * Set the current session
   */
  setSession: (session) => set({ session }),

  /**
   * Set the user profile
   */
  setProfile: (profile) => set({ profile }),

  /**
   * Set loading state
   */
  setLoading: (loading) => set({ loading }),

  /**
   * Initialize auth state by checking for existing session
   */
  initialize: async () => {
    try {
      set({ loading: true });

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session?.user) {
        set({ user: session.user, session });

        // Fetch user profile (allow missing profile without errors)
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError && (profileError.message || profileError.code)) {
          console.error('Error fetching user profile:', {
            message: profileError.message || 'Unknown error',
            code: profileError.code || 'NO_CODE',
            details: profileError.details || 'No details',
            hint: profileError.hint || 'No hint',
          });
        }

        set({ profile: profile || null });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user, session });
          await get().refreshProfile();
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  /**
   * Refresh user profile from database
   */
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && (error.message || error.code)) {
        console.error('Error refreshing profile:', {
          message: error.message || 'Unknown error',
          code: error.code || 'NO_CODE',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
        });
        return;
      }

      set({ profile: profile || null });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null, profile: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
}));

