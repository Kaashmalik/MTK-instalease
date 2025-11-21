/**
 * Guarantors Query Hooks
 * 
 * TanStack Query hooks for guarantor data fetching and mutations.
 * 
 * @module hooks/use-guarantors
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

/**
 * Guarantor type from database
 */
export interface Guarantor {
  guarantor_id: string;
  customer_id: string;
  shop_id: string;
  full_name: string;
  cnic_number: string;
  phone: string;
  relationship_to_customer: string | null;
  digital_signature_url: string | null;
  active_guarantees_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch guarantors for a customer
 */
export function useGuarantors(customerId: string | null) {
  return useQuery({
    queryKey: ['guarantors', customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('guarantors')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Guarantor[];
    },
    enabled: !!customerId,
  });
}

/**
 * Create a new guarantor
 */
export function useCreateGuarantor() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (guarantorData: {
      customer_id: string;
      full_name: string;
      cnic_number: string;
      phone: string;
      relationship_to_customer?: string;
      digital_signature_url?: string;
    }) => {
      if (!profile?.shop_id) {
        throw new Error('No shop ID available');
      }

      const { data, error } = await supabase
        .from('guarantors')
        .insert({
          ...guarantorData,
          shop_id: profile.shop_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Guarantor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guarantors', data.customer_id] });
    },
  });
}

/**
 * Update a guarantor
 */
export function useUpdateGuarantor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guarantorId,
      updates,
    }: {
      guarantorId: string;
      updates: Partial<Guarantor>;
    }) => {
      const { data, error } = await supabase
        .from('guarantors')
        .update(updates)
        .eq('guarantor_id', guarantorId)
        .select()
        .single();

      if (error) throw error;
      return data as Guarantor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guarantors', data.customer_id] });
    },
  });
}

/**
 * Delete a guarantor
 */
export function useDeleteGuarantor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guarantorId: string) => {
      const { error } = await supabase
        .from('guarantors')
        .delete()
        .eq('guarantor_id', guarantorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantors'] });
    },
  });
}

