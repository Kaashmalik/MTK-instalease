/**
 * Guarantor Form Component
 * 
 * Form for creating/editing guarantors with digital signature support.
 * 
 * @module components/guarantors/GuarantorForm
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guarantorSchema, type GuarantorFormData } from '@/lib/validations/guarantor';
import { useCreateGuarantor, useUpdateGuarantor, useGuarantors } from '@/hooks/use-guarantors';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X } from 'lucide-react';

/**
 * Props for GuarantorForm component
 */
interface GuarantorFormProps {
  customerId: string;
  guarantorId?: string | null;
  onSuccess?: () => void;
}

/**
 * Guarantor form component with digital signature
 * 
 * @param {GuarantorFormProps} props - Component props
 * @returns {JSX.Element} Guarantor form UI
 */
export function GuarantorForm({ customerId, guarantorId, onSuccess }: GuarantorFormProps) {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const { data: guarantors } = useGuarantors(customerId);
  const existingGuarantor = guarantors?.find((g) => g.guarantor_id === guarantorId);
  const createGuarantor = useCreateGuarantor();
  const updateGuarantor = useUpdateGuarantor();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<GuarantorFormData>({
    resolver: zodResolver(guarantorSchema),
    defaultValues: {
      customer_id: customerId,
      full_name: '',
      cnic_number: '',
      phone: '',
      relationship_to_customer: '',
    },
  });

  useEffect(() => {
    if (existingGuarantor) {
      reset({
        customer_id: existingGuarantor.customer_id,
        full_name: existingGuarantor.full_name,
        cnic_number: existingGuarantor.cnic_number,
        phone: existingGuarantor.phone,
        relationship_to_customer: existingGuarantor.relationship_to_customer || '',
      });
      setSignatureData(existingGuarantor.digital_signature_url);
    }
  }, [existingGuarantor, reset]);

  /**
   * Clear signature canvas
   */
  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignatureData(null);
  };

  /**
   * Save signature as image
   */
  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataURL = signatureRef.current.toDataURL();
      setSignatureData(dataURL);
      setValue('digital_signature', dataURL);
    }
  };

  /**
   * Upload signature to Supabase Storage
   */
  const uploadSignature = async (signatureDataUrl: string): Promise<string> => {
    setIsUploadingSignature(true);
    try {
      // Convert data URL to blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      const fileName = `signatures/${Date.now()}_${guarantorId || 'new'}.png`;
      const { error: uploadError } = await supabase.storage
        .from('guarantor-signatures')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('guarantor-signatures').getPublicUrl(fileName);

      return publicUrl;
    } finally {
      setIsUploadingSignature(false);
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: GuarantorFormData) => {
    try {
      let signatureUrl = signatureData;

      // Upload signature if it's a new data URL
      if (signatureData && signatureData.startsWith('data:')) {
        signatureUrl = await uploadSignature(signatureData);
      }

      const guarantorData = {
        customer_id: data.customer_id,
        full_name: data.full_name,
        cnic_number: data.cnic_number,
        phone: data.phone,
        relationship_to_customer: data.relationship_to_customer || undefined,
        digital_signature_url: signatureUrl || undefined,
      };

      if (guarantorId) {
        await updateGuarantor.mutateAsync({
          guarantorId,
          updates: guarantorData,
        });
      } else {
        await createGuarantor.mutateAsync(guarantorData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving guarantor:', error);
      alert('Failed to save guarantor. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('customer_id')} />

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
          <Label htmlFor="relationship_to_customer">Relationship to Customer</Label>
          <Input
            id="relationship_to_customer"
            {...register('relationship_to_customer')}
            placeholder="Father, Brother, etc."
            aria-invalid={errors.relationship_to_customer ? 'true' : 'false'}
          />
          {errors.relationship_to_customer && (
            <p className="text-sm text-destructive">
              {errors.relationship_to_customer.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signature">
          Digital Signature <span className="text-destructive">*</span>
        </Label>
        <div className="rounded-lg border p-4">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: 'w-full h-48 border rounded bg-white',
            }}
            backgroundColor="#ffffff"
            penColor="#000000"
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSignature}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={saveSignature}>
              Save Signature
            </Button>
          </div>
          {signatureData && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Signature saved
            </div>
          )}
        </div>
        {errors.digital_signature && (
          <p className="text-sm text-destructive">{errors.digital_signature.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || isUploadingSignature || !signatureData}
        >
          {isSubmitting || isUploadingSignature ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            guarantorId ? 'Update Guarantor' : 'Create Guarantor'
          )}
        </Button>
      </div>
    </form>
  );
}

