/**
 * Supabase Realtime Hooks
 * 
 * Custom hooks for subscribing to real-time database changes.
 * Enables live updates for payments, contracts, and installments.
 * 
 * @module hooks/use-realtime
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { queryKeys } from '@/lib/query-keys';

/**
 * Subscribe to payments table changes
 * 
 * Automatically invalidates payment queries when new payments are added/updated.
 * 
 * @param {string} shopId - Shop ID to filter subscriptions
 * @param {object} options - Subscription options
 * @param {boolean} options.enabled - Whether subscription is enabled
 * 
 * @example
 * ```tsx
 * useRealtimePayments(shopId, { enabled: true });
 * ```
 */
export function useRealtimePayments(
  shopId: string | null,
  options: { enabled?: boolean } = {}
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !shopId) return;

    // Create channel for payments table
    const channel = supabase
      .channel(`payments:${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'payments',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          console.log('Payment change received:', payload);

          // Invalidate payment queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
          queryClient.invalidateQueries({ queryKey: queryKeys.installments.all() });
          queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all() });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shopId, enabled, queryClient]);
}

/**
 * Subscribe to contracts table changes
 * 
 * @param {string} shopId - Shop ID to filter subscriptions
 * @param {object} options - Subscription options
 * @param {boolean} options.enabled - Whether subscription is enabled
 */
export function useRealtimeContracts(
  shopId: string | null,
  options: { enabled?: boolean } = {}
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !shopId) return;

    const channel = supabase
      .channel(`contracts:${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          console.log('Contract change received:', payload);
          queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all() });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shopId, enabled, queryClient]);
}

/**
 * Subscribe to installments table changes
 * 
 * @param {string} shopId - Shop ID to filter subscriptions
 * @param {object} options - Subscription options
 * @param {boolean} options.enabled - Whether subscription is enabled
 */
export function useRealtimeInstallments(
  shopId: string | null,
  options: { enabled?: boolean } = {}
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !shopId) return;

    const channel = supabase
      .channel(`installments:${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'installments',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          console.log('Installment change received:', payload);
          queryClient.invalidateQueries({ queryKey: queryKeys.installments.all() });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shopId, enabled, queryClient]);
}

/**
 * Subscribe to multiple tables at once
 * 
 * Convenience hook for subscribing to all real-time updates.
 * 
 * @param {string} shopId - Shop ID to filter subscriptions
 * @param {object} options - Subscription options
 * @param {boolean} options.enabled - Whether subscription is enabled
 */
export function useRealtimeAll(
  shopId: string | null,
  options: { enabled?: boolean } = {}
) {
  useRealtimePayments(shopId, options);
  useRealtimeContracts(shopId, options);
  useRealtimeInstallments(shopId, options);
}

