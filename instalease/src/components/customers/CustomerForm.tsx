/**
 * Customer Form Component
 * 
 * Form for creating/editing customers with CNIC OCR validation.
 * 
 * @module components/customers/CustomerForm
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerFormData } from '@/lib/validations/customer';
import { useCreateCustomer, useUpdateCustomer, useCustomer } from '@/hooks/use-customers';
import { processCNICImage } from '@/lib/utils/ocr';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Props for CustomerForm component
 */
interface CustomerFormProps {
  customerId?: string | null;
  onSuccess?: () => void;
}

/**
 * Customer form component with OCR support
 * 
 * @param {CustomerFormProps} props - Component props
 * @returns {JSX.Element} Customer form UI
 */
export function CustomerForm({ customerId, onSuccess }: CustomerFormProps) {
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ success: boolean; message: string } | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const { data: existingCustomer } = useCustomer(customerId || null);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: '',
      cnic_number: '',
      phone: '',
      email: '',
      address: '',
      monthly_income: undefined,
    },
  });

  // Load existing customer data when editing
  useEffect(() => {
    if (existingCustomer) {
      reset({
        full_name: existingCustomer.full_name,
        cnic_number: existingCustomer.cnic_number,
        phone: existingCustomer.phone,
        email: existingCustomer.email || '',
        address: existingCustomer.address || '',
        monthly_income: existingCustomer.monthly_income || undefined,
      });
    }
  }, [existingCustomer, reset]);

  /**
   * Handle CNIC image upload and OCR processing
   */
  const handleCNICImageUpload = async (
    file: File | undefined,
    type: 'front' | 'back'
  ) => {
    if (!file) return;

    setIsProcessingOCR(true);
    setOcrResult(null);

    try {
      // Process OCR
      const extractedCNIC = await processCNICImage(file);

      if (extractedCNIC) {
        setValue('cnic_number', extractedCNIC);
        setOcrResult({
          success: true,
          message: `CNIC extracted: ${extractedCNIC}`,
        });
      } else {
        setOcrResult({
          success: false,
          message: 'Could not extract CNIC number from image. Please enter manually.',
        });
      }

      // Upload image to Supabase Storage
      setUploadingImages(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${type}.${fileExt}`;
      const filePath = `customers/cnic/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('customer-documents').getPublicUrl(filePath);

      if (type === 'front') {
        setValue('cnic_front_image', file);
        // Store URL for submission
        (window as any).__cnicFrontUrl = publicUrl;
      } else {
        setValue('cnic_back_image', file);
        (window as any).__cnicBackUrl = publicUrl;
      }
    } catch (error) {
      console.error('OCR/Upload error:', error);
      setOcrResult({
        success: false,
        message: 'Failed to process image. Please try again.',
      });
    } finally {
      setIsProcessingOCR(false);
      setUploadingImages(false);
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: CustomerFormData) => {
    try {
      const customerData = {
        full_name: data.full_name,
        cnic_number: data.cnic_number,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
        monthly_income: data.monthly_income || undefined,
        cnic_front_image_url: (window as any).__cnicFrontUrl || existingCustomer?.cnic_front_image_url,
        cnic_back_image_url: (window as any).__cnicBackUrl || existingCustomer?.cnic_back_image_url,
      };

      if (customerId) {
        await updateCustomer.mutateAsync({
          customerId,
          updates: customerData,
        });
      } else {
        await createCustomer.mutateAsync(customerData);
      }

      // Clean up
      delete (window as any).__cnicFrontUrl;
      delete (window as any).__cnicBackUrl;

      onSuccess?.();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    }
  };

  const cnicFrontFile = watch('cnic_front_image');
  const cnicBackFile = watch('cnic_back_image');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full_name"
            {...register('full_name')}
            placeholder="John Doe"
            aria-invalid={errors.full_name ? 'true' : 'false'}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnic_number">
            CNIC Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cnic_number"
            {...register('cnic_number')}
            placeholder="1234512345671"
            maxLength={13}
            aria-invalid={errors.cnic_number ? 'true' : 'false'}
          />
          {errors.cnic_number && (
            <p className="text-sm text-destructive">{errors.cnic_number.message}</p>
          )}
          {ocrResult && (
            <div
              className={`flex items-center gap-2 text-sm ${
                ocrResult.success ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              {ocrResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{ocrResult.message}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+92 300 1234567"
            aria-invalid={errors.phone ? 'true' : 'false'}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register('address')}
          placeholder="Street address, City, Province"
          rows={3}
          aria-invalid={errors.address ? 'true' : 'false'}
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly_income">Monthly Income (PKR)</Label>
        <Input
          id="monthly_income"
          type="number"
          step="0.01"
          {...register('monthly_income', { valueAsNumber: true })}
          placeholder="50000"
          aria-invalid={errors.monthly_income ? 'true' : 'false'}
        />
        {errors.monthly_income && (
          <p className="text-sm text-destructive">{errors.monthly_income.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cnic_front_image">
            CNIC Front Image <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cnic_front_image"
            type="file"
            accept="image/*"
            disabled={isProcessingOCR || uploadingImages}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleCNICImageUpload(file, 'front');
              }
            }}
          />
          {cnicFrontFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {cnicFrontFile.name}
            </p>
          )}
          {isProcessingOCR && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing OCR...
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnic_back_image">
            CNIC Back Image <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cnic_back_image"
            type="file"
            accept="image/*"
            disabled={isProcessingOCR || uploadingImages}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleCNICImageUpload(file, 'back');
              }
            }}
          />
          {cnicBackFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {cnicBackFile.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || isProcessingOCR || uploadingImages}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            customerId ? 'Update Customer' : 'Create Customer'
          )}
        </Button>
      </div>
    </form>
  );
}

