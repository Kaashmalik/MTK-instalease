/**
 * Installments Query Hooks
 * 
 * TanStack Query hooks for installment data fetching.
 * Includes optimized queries for payment schedules.
 * 
 * @module hooks/use-installments
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { queryKeys } from '@/lib/query-keys';

/**
 * Installment type from database
 */
export interface Installment {
  installment_id: string;
  contract_id: string;
  shop_id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  payment_status: 'pending' | 'paid' | 'overdue' | 'waived';
  late_fee: number;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Installment with contract details
 */
export interface InstallmentWithDetails extends Installment {
  contracts?: {
    contract_id: string;
    product_name: string;
    customers?: {
      customer_id: string;
      full_name: string;
    };
  };
}

/**
 * Fetch installments for a contract
 * 
 * @param {string} contractId - Contract ID
 * @returns {UseQueryResult<Installment[]>} Query result
 */
export function useInstallments(contractId: string | null) {
  return useQuery({
    queryKey: queryKeys.installments.list(contractId!),
    queryFn: async () => {
      if (!contractId) return [];

      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('contract_id', contractId)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      return data as Installment[];
    },
    enabled: !!contractId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch installments for a customer (across all contracts)
 * 
 * @param {string} customerId - Customer ID
 * @returns {UseQueryResult<InstallmentWithDetails[]>} Query result
 */
export function useCustomerInstallments(customerId: string | null) {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.installments.customerList(customerId!, profile?.shop_id!),
    queryFn: async () => {
      if (!customerId || !profile?.shop_id) {
        return [];
      }

      // Get contracts for this customer
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('contract_id')
        .eq('customer_id', customerId)
        .eq('shop_id', profile.shop_id);

      if (contractsError) throw contractsError;
      if (!contracts || contracts.length === 0) return [];

      const contractIds = contracts.map((c) => c.contract_id);

      // Get installments for these contracts
      const { data, error } = await supabase
        .from('installments')
        .select(`
          *,
          contracts!inner(
            contract_id,
            product_name,
            customers!inner(
              customer_id,
              full_name
            )
          )
        `)
        .in('contract_id', contractIds)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as InstallmentWithDetails[];
    },
    enabled: !!customerId && !!profile?.shop_id,
    staleTime: 60 * 1000,
  });
}

/**
 * Calculate customer balance (outstanding installments)
 * 
 * @param {string} customerId - Customer ID
 * @returns {UseQueryResult<{total: number, overdue: number, pending: number}>} Query result
 */
export function useCustomerBalance(customerId: string | null) {
  const { data: installments } = useCustomerInstallments(customerId);

  return {
    data: installments
      ? {
          total: installments
            .filter((i) => i.payment_status === 'pending' || i.payment_status === 'overdue')
            .reduce((sum, i) => sum + Number(i.amount_due) + Number(i.late_fee), 0),
          overdue: installments
            .filter((i) => i.payment_status === 'overdue')
            .reduce((sum, i) => sum + Number(i.amount_due) + Number(i.late_fee), 0),
          pending: installments
            .filter((i) => i.payment_status === 'pending')
            .reduce((sum, i) => sum + Number(i.amount_due), 0),
        }
      : null,
    isLoading: !installments,
  };
}

