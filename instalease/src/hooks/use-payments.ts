/**
 * Payments Query Hooks
 * 
 * TanStack Query hooks for payment data fetching and mutations.
 * Includes optimized queries with proper caching.
 * 
 * @module hooks/use-payments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

/**
 * Payment type from database
 */
export interface Payment {
  payment_id: string;
  contract_id: string;
  installment_id: string | null;
  shop_id: string;
  amount: number;
  payment_date: string;
  paid_by_type: 'customer' | 'guarantor';
  gateway: 'jazzcash' | 'easypaisa' | 'raast' | 'manual' | 'cash';
  transaction_id: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Payment with related contract and customer info
 */
export interface PaymentWithDetails extends Payment {
  contracts?: {
    contract_id: string;
    product_name: string;
    customers?: {
      customer_id: string;
      full_name: string;
      phone: string;
    };
  };
  installments?: {
    installment_id: string;
    installment_number: number;
    due_date: string;
  };
}

/**
 * Fetch all payments for the current shop
 * 
 * @param {object} options - Query options
 * @param {string} options.contractId - Filter by contract ID
 * @param {number} options.limit - Limit number of results
 * @returns {UseQueryResult<PaymentWithDetails[]>} Query result
 */
export function usePayments(options?: {
  contractId?: string;
  limit?: number;
}) {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['payments', profile?.shop_id, options?.contractId, options?.limit],
    queryFn: async () => {
      if (!profile?.shop_id) {
        throw new Error('No shop ID available');
      }

      let query = supabase
        .from('payments')
        .select(`
          *,
          contracts!inner(
            contract_id,
            product_name,
            customers!inner(
              customer_id,
              full_name,
              phone
            )
          ),
          installments(
            installment_id,
            installment_number,
            due_date
          )
        `)
        .eq('shop_id', profile.shop_id)
        .order('payment_date', { ascending: false });

      if (options?.contractId) {
        query = query.eq('contract_id', options.contractId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PaymentWithDetails[];
    },
    enabled: !!profile?.shop_id,
    staleTime: 30 * 1000, // 30 seconds for payment data (more dynamic)
  });
}

/**
 * Fetch payments for a specific customer
 * 
 * @param {string} customerId - Customer ID
 * @returns {UseQueryResult<PaymentWithDetails[]>} Query result
 */
export function useCustomerPayments(customerId: string | null) {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['customer-payments', customerId, profile?.shop_id],
    queryFn: async () => {
      if (!customerId || !profile?.shop_id) {
        return [];
      }

      // Get contracts for this customer first
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('contract_id')
        .eq('customer_id', customerId)
        .eq('shop_id', profile.shop_id);

      if (contractsError) throw contractsError;
      if (!contracts || contracts.length === 0) return [];

      const contractIds = contracts.map((c) => c.contract_id);

      // Get payments for these contracts
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          contracts!inner(
            contract_id,
            product_name,
            customers!inner(
              customer_id,
              full_name,
              phone
            )
          ),
          installments(
            installment_id,
            installment_number,
            due_date
          )
        `)
        .in('contract_id', contractIds)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as PaymentWithDetails[];
    },
    enabled: !!customerId && !!profile?.shop_id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single payment by ID
 * 
 * @param {string} paymentId - Payment ID
 * @returns {UseQueryResult<PaymentWithDetails>} Query result
 */
export function usePayment(paymentId: string | null) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          contracts!inner(
            contract_id,
            product_name,
            customers!inner(
              customer_id,
              full_name,
              phone
            )
          ),
          installments(
            installment_id,
            installment_number,
            due_date
          )
        `)
        .eq('payment_id', paymentId)
        .single();

      if (error) throw error;
      return data as PaymentWithDetails;
    },
    enabled: !!paymentId,
  });
}

/**
 * Create a new payment record
 * 
 * @returns {UseMutationResult} Mutation result
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (paymentData: {
      contract_id: string;
      installment_id?: string | null;
      amount: number;
      paid_by_type: 'customer' | 'guarantor';
      gateway: Payment['gateway'];
      transaction_id?: string;
      receipt_url?: string;
    }) => {
      if (!profile?.shop_id) {
        throw new Error('No shop ID available');
      }

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          shop_id: profile.shop_id,
          payment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

