/**
 * React Query Provider Component
 * 
 * Wraps the application with TanStack Query provider for server state management.
 * Implements optimized caching strategies for performance and user experience.
 * 
 * @module providers/QueryProvider
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Props for QueryProvider component
 */
interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Creates a QueryClient with optimized caching configuration
 * 
 * Caching Strategy:
 * - Static data (shops, users): 5 minutes stale time
 * - Dynamic data (payments, contracts): 30 seconds stale time
 * - Real-time data: 0 stale time (always fresh)
 * 
 * @returns {QueryClient} Configured QueryClient instance
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time: data is considered fresh for 1 minute
        staleTime: 60 * 1000,
        
        // Cache time: keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000, // Previously cacheTime
        
        // Retry configuration for network failures
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch behavior
        refetchOnWindowFocus: false, // Don't refetch on window focus to reduce unnecessary requests
        refetchOnReconnect: true, // Refetch when network reconnects
        refetchOnMount: true, // Refetch when component mounts
        
        // Network mode: prefer online, but allow offline queries if cached
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once on network failure
        retry: 1,
        retryDelay: 1000,
        
        // Network mode for mutations
        networkMode: 'online',
      },
    },
  });
}

/**
 * React Query provider component
 * 
 * Provides QueryClient instance to all child components with optimized caching.
 * Uses singleton pattern to ensure single QueryClient instance across app.
 * 
 * @param {QueryProviderProps} props - Component props
 * @returns {JSX.Element} QueryClientProvider with children
 * 
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Use useState with lazy initialization to create QueryClient only once
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

