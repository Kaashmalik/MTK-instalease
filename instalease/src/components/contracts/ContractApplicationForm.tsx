/**
 * Contract Application Form Component
 * 
 * Form for creating installment applications with payment plan calculations.
 * 
 * @module components/contracts/ContractApplicationForm
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contractSchema, type ContractFormData } from '@/lib/validations/contract';
import { useCreateContract } from '@/hooks/use-contracts';
import { useCustomers } from '@/hooks/use-customers';
import { useGuarantors } from '@/hooks/use-guarantors';
import {
  calculateMonthlyInstallment,
  calculateTotalAmount,
  calculateTotalInterest,
  calculateDebtToIncomeRatio,
  generateInstallmentSchedule,
} from '@/lib/utils/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Props for ContractApplicationForm component
 */
interface ContractApplicationFormProps {
  onSuccess?: () => void;
}

/**
 * Contract application form component
 * 
 * @param {ContractApplicationFormProps} props - Component props
 * @returns {JSX.Element} Contract application form UI
 */
export function ContractApplicationForm({ onSuccess }: ContractApplicationFormProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [calculationPreview, setCalculationPreview] = useState<any>(null);

  const { data: customers } = useCustomers();
  const { data: guarantors } = useGuarantors(selectedCustomerId || null);
  const createContract = useCreateContract();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      product_name: '',
      product_price: 0,
      down_payment: 0,
      interest_rate: 0,
      total_months: 12,
    },
  });

  const productPrice = watch('product_price');
  const downPayment = watch('down_payment');
  const interestRate = watch('interest_rate');
  const totalMonths = watch('total_months');

  // Calculate preview when values change
  const calculatePreview = () => {
    if (productPrice > 0 && totalMonths > 0) {
      const principal = productPrice - (downPayment || 0);
      const monthlyInstallment = calculateMonthlyInstallment(
        principal,
        interestRate || 0,
        totalMonths
      );
      const totalAmount = calculateTotalAmount(downPayment || 0, monthlyInstallment, totalMonths);
      const totalInterest = calculateTotalInterest(productPrice, downPayment || 0, totalAmount);

      setCalculationPreview({
        principal,
        monthlyInstallment,
        totalAmount,
        totalInterest,
      });

      // Auto-set monthly installment
      setValue('monthly_installment', monthlyInstallment);
    }
  };

  // Watch for changes and recalculate
  useState(() => {
    const subscription = watch((value, { name }) => {
      if (name && ['product_price', 'down_payment', 'interest_rate', 'total_months'].includes(name)) {
        calculatePreview();
      }
    });
    return () => subscription.unsubscribe();
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ContractFormData) => {
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    try {
      const monthlyInstallment = calculationPreview?.monthlyInstallment || data.monthly_installment;

      await createContract.mutateAsync({
        customer_id: selectedCustomerId,
        guarantor_id: data.guarantor_id || null,
        product_name: data.product_name,
        product_price: data.product_price,
        down_payment: data.down_payment,
        interest_rate: data.interest_rate,
        monthly_installment: monthlyInstallment,
        total_months: data.total_months,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract. Please try again.');
    }
  };

  const selectedCustomer = customers?.find((c) => c.customer_id === selectedCustomerId);
  const debtToIncomeRatio = selectedCustomer?.monthly_income
    ? calculateDebtToIncomeRatio(
        calculationPreview?.monthlyInstallment || 0,
        selectedCustomer.monthly_income
      )
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customer_id">
          Customer <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedCustomerId}
          onValueChange={(value) => {
            setSelectedCustomerId(value);
            setValue('customer_id', value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers?.map((customer) => (
              <SelectItem key={customer.customer_id} value={customer.customer_id}>
                {customer.full_name} - {customer.cnic_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customer_id && (
          <p className="text-sm text-destructive">{errors.customer_id.message}</p>
        )}
      </div>

      {selectedCustomerId && (
        <div className="space-y-2">
          <Label htmlFor="guarantor_id">Guarantor (Optional)</Label>
          <Select
            onValueChange={(value) => setValue('guarantor_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a guarantor (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {guarantors?.map((guarantor) => (
                <SelectItem key={guarantor.guarantor_id} value={guarantor.guarantor_id}>
                  {guarantor.full_name} - {guarantor.relationship_to_customer || 'Guarantor'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product_name">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product_name"
            {...register('product_name')}
            placeholder="Samsung Galaxy S24"
            aria-invalid={errors.product_name ? 'true' : 'false'}
          />
          {errors.product_name && (
            <p className="text-sm text-destructive">{errors.product_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_price">
            Product Price (PKR) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product_price"
            type="number"
            step="0.01"
            {...register('product_price', { valueAsNumber: true })}
            placeholder="150000"
            onChange={(e) => {
              register('product_price').onChange(e);
              calculatePreview();
            }}
            aria-invalid={errors.product_price ? 'true' : 'false'}
          />
          {errors.product_price && (
            <p className="text-sm text-destructive">{errors.product_price.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="down_payment">Down Payment (PKR)</Label>
          <Input
            id="down_payment"
            type="number"
            step="0.01"
            {...register('down_payment', { valueAsNumber: true })}
            placeholder="30000"
            onChange={(e) => {
              register('down_payment').onChange(e);
              calculatePreview();
            }}
            aria-invalid={errors.down_payment ? 'true' : 'false'}
          />
          {errors.down_payment && (
            <p className="text-sm text-destructive">{errors.down_payment.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest_rate">Interest Rate (%)</Label>
          <Input
            id="interest_rate"
            type="number"
            step="0.01"
            {...register('interest_rate', { valueAsNumber: true })}
            placeholder="12"
            onChange={(e) => {
              register('interest_rate').onChange(e);
              calculatePreview();
            }}
            aria-invalid={errors.interest_rate ? 'true' : 'false'}
          />
          {errors.interest_rate && (
            <p className="text-sm text-destructive">{errors.interest_rate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_months">
            Total Months <span className="text-destructive">*</span>
          </Label>
          <Input
            id="total_months"
            type="number"
            {...register('total_months', { valueAsNumber: true })}
            placeholder="12"
            onChange={(e) => {
              register('total_months').onChange(e);
              calculatePreview();
            }}
            aria-invalid={errors.total_months ? 'true' : 'false'}
          />
          {errors.total_months && (
            <p className="text-sm text-destructive">{errors.total_months.message}</p>
          )}
        </div>
      </div>

      {calculationPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Plan Preview</CardTitle>
            <CardDescription>Calculated based on your inputs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Principal Amount:</span>
              <span className="font-medium">
                PKR {calculationPreview.principal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Installment:</span>
              <span className="font-medium">
                PKR {calculationPreview.monthlyInstallment.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">
                PKR {calculationPreview.totalAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Interest:</span>
              <span className="font-medium">
                PKR {calculationPreview.totalInterest.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {debtToIncomeRatio !== null && (
              <div className="flex justify-between pt-2 border-t">
                <span>Debt-to-Income Ratio:</span>
                <span
                  className={`font-medium ${
                    debtToIncomeRatio > 40 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {debtToIncomeRatio.toFixed(2)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <input type="hidden" {...register('monthly_installment', { valueAsNumber: true })} />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || !selectedCustomerId}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Application'
          )}
        </Button>
      </div>
    </form>
  );
}

