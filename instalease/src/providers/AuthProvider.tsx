/**
 * Authentication Provider Component
 * 
 * Initializes the auth store and provides authentication context to the app.
 * Should wrap the entire application in the root layout.
 * 
 * @module providers/AuthProvider
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component
 * 
 * Initializes auth state on mount and provides it to child components.
 * 
 * @param {AuthProviderProps} props - Component props
 * @returns {JSX.Element} Provider component with children
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return <>{children}</>;
}

