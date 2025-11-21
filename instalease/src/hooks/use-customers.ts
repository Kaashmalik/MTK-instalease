/**
 * Customers Query Hooks
 * 
 * TanStack Query hooks for customer data fetching and mutations.
 * Includes optimistic updates for better UX.
 * 
 * @module hooks/use-customers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

/**
 * Customer type from database
 */
export interface Customer {
  customer_id: string;
  shop_id: string;
  full_name: string;
  cnic_number: string;
  cnic_front_image_url: string | null;
  cnic_back_image_url: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  monthly_income: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all customers for the current shop
 */
export function useCustomers() {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['customers', profile?.shop_id],
    queryFn: async () => {
      if (!profile?.shop_id) {
        throw new Error('No shop ID available');
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!profile?.shop_id,
  });
}

/**
 * Fetch a single customer by ID
 */
export function useCustomer(customerId: string | null) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error) throw error;
      return data as Customer;
    },
    enabled: !!customerId,
  });
}

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (customerData: {
      full_name: string;
      cnic_number: string;
      phone: string;
      email?: string;
      address?: string;
      monthly_income?: number;
      cnic_front_image_url?: string;
      cnic_back_image_url?: string;
    }) => {
      if (!profile?.shop_id) {
        throw new Error('No shop ID available');
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          shop_id: profile.shop_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onMutate: async (newCustomer) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers', profile?.shop_id] });

      // Snapshot previous value
      const previousCustomers = queryClient.getQueryData<Customer[]>([
        'customers',
        profile?.shop_id,
      ]);

      // Optimistically update
      if (previousCustomers && profile?.shop_id) {
        const optimisticCustomer: Customer = {
          customer_id: crypto.randomUUID(),
          shop_id: profile.shop_id,
          full_name: newCustomer.full_name,
          cnic_number: newCustomer.cnic_number,
          phone: newCustomer.phone,
          email: newCustomer.email || null,
          address: newCustomer.address || null,
          monthly_income: newCustomer.monthly_income || null,
          cnic_front_image_url: newCustomer.cnic_front_image_url || null,
          cnic_back_image_url: newCustomer.cnic_back_image_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Customer[]>(
          ['customers', profile.shop_id],
          [optimisticCustomer, ...previousCustomers]
        );
      }

      return { previousCustomers };
    },
    onError: (err, newCustomer, context) => {
      // Rollback on error
      if (context?.previousCustomers && profile?.shop_id) {
        queryClient.setQueryData(
          ['customers', profile.shop_id],
          context.previousCustomers
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', profile?.shop_id] });
    },
  });
}

/**
 * Update an existing customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      customerId,
      updates,
    }: {
      customerId: string;
      updates: Partial<Customer>;
    }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('customer_id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onMutate: async ({ customerId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['customers', profile?.shop_id] });
      await queryClient.cancelQueries({ queryKey: ['customer', customerId] });

      const previousCustomers = queryClient.getQueryData<Customer[]>([
        'customers',
        profile?.shop_id,
      ]);
      const previousCustomer = queryClient.getQueryData<Customer>([
        'customer',
        customerId,
      ]);

      if (previousCustomers && profile?.shop_id) {
        queryClient.setQueryData<Customer[]>(
          ['customers', profile.shop_id],
          previousCustomers.map((c) =>
            c.customer_id === customerId ? { ...c, ...updates } : c
          )
        );
      }

      if (previousCustomer) {
        queryClient.setQueryData<Customer>(['customer', customerId], {
          ...previousCustomer,
          ...updates,
        });
      }

      return { previousCustomers, previousCustomer };
    },
    onError: (err, variables, context) => {
      if (context?.previousCustomers && profile?.shop_id) {
        queryClient.setQueryData(
          ['customers', profile.shop_id],
          context.previousCustomers
        );
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(
          ['customer', variables.customerId],
          context.previousCustomer
        );
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers', profile?.shop_id] });
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['customer', data.customer_id] });
      }
    },
  });
}

/**
 * Delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('customer_id', customerId);

      if (error) throw error;
    },
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: ['customers', profile?.shop_id] });

      const previousCustomers = queryClient.getQueryData<Customer[]>([
        'customers',
        profile?.shop_id,
      ]);

      if (previousCustomers && profile?.shop_id) {
        queryClient.setQueryData<Customer[]>(
          ['customers', profile.shop_id],
          previousCustomers.filter((c) => c.customer_id !== customerId)
        );
      }

      return { previousCustomers };
    },
    onError: (err, customerId, context) => {
      if (context?.previousCustomers && profile?.shop_id) {
        queryClient.setQueryData(
          ['customers', profile.shop_id],
          context.previousCustomers
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', profile?.shop_id] });
    },
  });
}

