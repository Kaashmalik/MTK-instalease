/**
 * Contracts Query Hooks
 * 
 * TanStack Query hooks for contract data fetching and mutations.
 * 
 * @module hooks/use-contracts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { queryKeys } from '@/lib/query-keys';

/**
 * Contract type from database
 */
export interface Contract {
  contract_id: string;
  customer_id: string;
  guarantor_id: string | null;
  shop_id: string;
  product_name: string;
  product_price: number;
  down_payment: number;
  interest_rate: number;
  monthly_installment: number;
  total_months: number;
  contract_status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'defaulted';
  contract_pdf_url: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all contracts for the current shop
 */
export function useContracts() {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.contracts.list(profile?.shop_id!),
    queryFn: async () => {
      if (!profile?.shop_id) {
        throw new Error('No shop ID available');
      }

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!profile?.shop_id,
  });
}

/**
 * Fetch a single contract by ID
 */
export function useContract(contractId: string | null) {
  return useQuery({
    queryKey: queryKeys.contracts.detail(contractId!),
    queryFn: async () => {
      if (!contractId) return null;

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_id', contractId)
        .single();

      if (error) throw error;
      return data as Contract;
    },
    enabled: !!contractId,
  });
}

/**
 * Create a new contract
 */
export function useCreateContract() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (contractData: {
      customer_id: string;
      guarantor_id?: string | null;
      product_name: string;
      product_price: number;
      down_payment: number;
      interest_rate: number;
      monthly_installment: number;
      total_months: number;
      contract_pdf_url?: string;
    }) => {
      if (!profile?.shop_id) {
        throw new Error('No shop ID available');
      }

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...contractData,
          shop_id: profile.shop_id,
          contract_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.list(profile?.shop_id!) });
    },
  });
}

/**
 * Update contract status (for approval workflow)
 */
export function useUpdateContractStatus() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      contractId,
      status,
      contractPdfUrl,
    }: {
      contractId: string;
      status: Contract['contract_status'];
      contractPdfUrl?: string;
    }) => {
      const updates: any = {
        contract_status: status,
      };

      if (status === 'approved' && contractPdfUrl) {
        updates.contract_pdf_url = contractPdfUrl;
        updates.signed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('contract_id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data as Contract;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.list(profile?.shop_id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(data.contract_id) });
    },
  });
}

