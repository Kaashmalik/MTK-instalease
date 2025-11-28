/**
 * TanStack Query Key Factory
 *
 * Centralized management of query keys for TanStack Query.
 * This factory ensures consistency and simplifies query invalidation.
 *
 * @module lib/query-keys
 */

export const queryKeys = {
  all: ['all'] as const,
  
  // Contracts
  contracts: {
    all: () => ['contracts'] as const,
    lists: () => [...queryKeys.contracts.all(), 'list'] as const,
    list: (shopId: string) => [...queryKeys.contracts.lists(), { shopId }] as const,
    details: () => [...queryKeys.contracts.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.contracts.details(), id] as const,
  },

  // Customers
  customers: {
    all: () => ['customers'] as const,
    lists: () => [...queryKeys.customers.all(), 'list'] as const,
    list: (shopId: string) => [...queryKeys.customers.lists(), { shopId }] as const,
    details: () => [...queryKeys.customers.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },

  // Guarantors
  guarantors: {
    all: () => ['guarantors'] as const,
    lists: () => [...queryKeys.guarantors.all(), 'list'] as const,
    list: (customerId: string) => [...queryKeys.guarantors.lists(), { customerId }] as const,
    details: () => [...queryKeys.guarantors.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.guarantors.details(), id] as const,
  },

  // Installments
  installments: {
    all: () => ['installments'] as const,
    lists: () => [...queryKeys.installments.all(), 'list'] as const,
    list: (contractId: string) => [...queryKeys.installments.lists(), { contractId }] as const,
    customerLists: () => [...queryKeys.installments.all(), 'customer-list'] as const,
    customerList: (customerId: string, shopId: string) => [...queryKeys.installments.customerLists(), { customerId, shopId }] as const,
  },

  // Payments
  payments: {
    all: () => ['payments'] as const,
    lists: () => [...queryKeys.payments.all(), 'list'] as const,
    list: (shopId: string, options: object) => [...queryKeys.payments.lists(), { shopId, ...options }] as const,
    details: () => [...queryKeys.payments.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    customerLists: () => [...queryKeys.payments.all(), 'customer-list'] as const,
    customerList: (customerId: string, shopId: string) => [...queryKeys.payments.customerLists(), { customerId, shopId }] as const,
  },
};
