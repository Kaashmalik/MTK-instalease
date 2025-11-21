/**
 * Customer Validation Schemas
 * 
 * Zod schemas for validating customer form data.
 * 
 * @module lib/validations/customer
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
 * Customer form validation schema
 */
export const customerSchema = z.object({
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
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .optional()
    .or(z.literal('')),
  monthly_income: z
    .number()
    .positive('Monthly income must be positive')
    .min(0, 'Monthly income cannot be negative')
    .optional()
    .or(z.null()),
  cnic_front_image: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
    .refine(
      (file) => !file || file.type.startsWith('image/'),
      'File must be an image'
    ),
  cnic_back_image: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
    .refine(
      (file) => !file || file.type.startsWith('image/'),
      'File must be an image'
    ),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

