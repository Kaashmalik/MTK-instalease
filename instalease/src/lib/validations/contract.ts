/**
 * Contract Validation Schemas
 * 
 * Zod schemas for validating contract and installment application data.
 * 
 * @module lib/validations/contract
 */

import { z } from 'zod';

/**
 * Contract application validation schema
 */
export const contractSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  guarantor_id: z.string().uuid('Invalid guarantor ID').optional().or(z.null()),
  product_name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(255, 'Product name must not exceed 255 characters'),
  product_price: z
    .number()
    .positive('Product price must be positive')
    .min(0.01, 'Product price must be at least 0.01'),
  down_payment: z
    .number()
    .nonnegative('Down payment cannot be negative')
    .refine((val) => val >= 0, 'Down payment must be non-negative'),
  interest_rate: z
    .number()
    .nonnegative('Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%'),
  total_months: z
    .number()
    .int('Total months must be an integer')
    .positive('Total months must be positive')
    .min(1, 'Total months must be at least 1')
    .max(120, 'Total months cannot exceed 120'),
}).refine(
  (data) => data.down_payment <= data.product_price,
  {
    message: 'Down payment cannot exceed product price',
    path: ['down_payment'],
  }
);

export type ContractFormData = z.infer<typeof contractSchema>;

/**
 * Payment validation schema
 */
export const paymentSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID'),
  installment_id: z.string().uuid('Invalid installment ID').optional().or(z.null()),
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01'),
  paid_by_type: z.enum(['customer', 'guarantor'], {
    errorMap: () => ({ message: 'Must be either customer or guarantor' }),
  }),
  gateway: z.enum(['jazzcash', 'easypaisa', 'raast', 'manual', 'cash'], {
    errorMap: () => ({ message: 'Invalid payment gateway' }),
  }),
  transaction_id: z.string().optional().or(z.literal('')),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

