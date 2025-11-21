/**
 * Guarantor Validation Schemas
 * 
 * Zod schemas for validating guarantor form data.
 * 
 * @module lib/validations/guarantor
 */

import { z } from 'zod';

/**
 * CNIC validation regex (13 digits)
 */
const cnicRegex = /^\d{13}$/;

/**
 * Phone validation regex (Pakistani format)
 */
const phoneRegex = /^(\+92|0)?[0-9]{10}$/;

/**
 * Guarantor form validation schema
 */
export const guarantorSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(255, 'Full name must not exceed 255 characters'),
  cnic_number: z
    .string()
    .regex(cnicRegex, 'CNIC must be exactly 13 digits')
    .length(13, 'CNIC must be exactly 13 digits'),
  phone: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits'),
  relationship_to_customer: z
    .string()
    .min(2, 'Relationship must be at least 2 characters')
    .max(100, 'Relationship must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  digital_signature: z
    .string()
    .min(1, 'Digital signature is required')
    .optional(),
});

export type GuarantorFormData = z.infer<typeof guarantorSchema>;

