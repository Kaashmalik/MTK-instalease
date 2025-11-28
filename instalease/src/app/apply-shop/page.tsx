'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/ui/footer';
import Link from 'next/link';

interface ExistingApplication {
  application_id: string;
  shop_name: string;
  status: string;
  payment_status: string;
  selected_plan: string;
  review_notes: string | null;
  created_at: string;
}

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  max_users: number;
  max_customers: number;
  features: string[];
}

export default function ApplyShopPage() {
  const { user, profile, loading, initialized } = useAuthStore();
  const router = useRouter();
  
  const [existingApplication, setExistingApplication] = useState<ExistingApplication | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Plan Selection, 3: Payment
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    shop_name: '',
    business_type: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    owner_cnic: '',
  });

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    bank_name: '',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');
      
      if (data) setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }, []);

  const checkExistingApplicationCallback = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shop_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data && (data.status === 'pending' || data.status === 'under_review')) {
        setExistingApplication(data);
      } else if (data && data.status === 'rejected') {
        setExistingApplication(data);
      }
    } catch (error) {
      console.error('Error checking application:', error);
    } finally {
      setCheckingApplication(false);
    }
  }, [user]);

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        router.push('/auth/login?redirect=/apply-shop');
        return;
      }
      
      // If user already has a shop, redirect to dashboard
      if (profile?.shop_id) {
        router.push('/dashboard');
        return;
      }

      // Check for existing applications
      checkExistingApplicationCallback();
      fetchPlans();
    }
  }, [user, profile, loading, initialized, router, checkExistingApplicationCallback, fetchPlans]);

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.shop_name.trim()) {
      alert('Please enter a shop name');
      return;
    }
    if (!formData.business_phone.trim()) {
      alert('Please enter a business phone number');
      return;
    }

    setStep(2); // Move to plan selection
  };

  const handleSubmitStep2 = () => {
    if (!selectedPlan) {
      alert('Please select a subscription plan');
      return;
    }
    setStep(3); // Move to payment
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG, WebP) or PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingSlip(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(fileName);

      setPaymentSlipUrl(urlData.publicUrl);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error uploading file:', error);
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      alert('Please log in to submit an application');
      return;
    }

    if (!paymentSlipUrl) {
      alert('Please upload your payment slip');
      return;
    }

    setSubmitting(true);

    try {
      // Get selected plan price
      const plan = plans.find(p => p.plan_name === selectedPlan);
      const amount = plan?.price_monthly || 2999;

      // Create application
      const { data: appData, error: appError } = await supabase
        .from('shop_applications')
        .insert({
          user_id: user.id,
          shop_name: formData.shop_name.trim(),
          business_type: formData.business_type || null,
          business_address: formData.business_address || null,
          business_phone: formData.business_phone.trim(),
          business_email: formData.business_email || null,
          owner_cnic: formData.owner_cnic || null,
          selected_plan: selectedPlan,
          payment_status: 'pending',
          payment_amount: amount,
          status: 'pending',
        })
        .select()
        .single();

      if (appError) throw appError;

      setSubmittedAppId(appData.application_id);

      // Create payment slip record
      const { error: slipError } = await supabase
        .from('payment_slips')
        .insert({
          application_id: appData.application_id,
          user_id: user.id,
          amount: amount,
          payment_method: 'bank_transfer',
          bank_name: paymentData.bank_name || null,
          transaction_id: paymentData.transaction_id || null,
          payment_date: paymentData.payment_date,
          slip_image_url: paymentSlipUrl,
          notes: paymentData.notes || null,
          status: 'pending',
        });

      if (slipError) throw slipError;

      setSubmitted(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error submitting application:', error);
      alert(`Error: ${err.message || 'Failed to submit application'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: '⏳ Pending Review' },
      under_review: { variant: 'outline', label: '🔍 Under Review' },
      approved: { variant: 'default', label: '✅ Approved' },
      rejected: { variant: 'destructive', label: '❌ Rejected' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading || !initialized || checkingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show success message after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-green-600">Application Submitted!</CardTitle>
            <CardDescription>
              Your shop application has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Application Reference:</p>
              <p className="font-mono text-sm bg-white px-3 py-2 rounded border">
                {submittedAppId?.slice(0, 8).toUpperCase() || 'N/A'}
              </p>
            </div>
            <p className="text-gray-600">
              Your payment slip has been uploaded and is pending verification.
              Our team will review your application and payment within 1-2 business days.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show existing application status
  if (existingApplication && existingApplication.status !== 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>
              You already have a pending application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shop Name:</span>
                <span className="font-medium">{existingApplication.shop_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                {getStatusBadge(existingApplication.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Submitted:</span>
                <span className="text-sm">
                  {new Date(existingApplication.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Please wait while our team reviews your application.
              This usually takes 1-2 business days.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Apply for a Shop</h1>
          <p className="text-gray-600 mt-2">
            Register your business to start using InstalEase
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Business Info</span>
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Select Plan</span>
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Payment</span>
          </div>
        </div>

        {/* Rejected Application Notice */}
        {existingApplication && existingApplication.status === 'rejected' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Previous Application Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                Your previous application for &quot;{existingApplication.shop_name}&quot; was rejected.
              </p>
              {existingApplication.review_notes && (
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm text-gray-600">Reason:</p>
                  <p className="text-gray-800">{existingApplication.review_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 1: Business Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Business Information</CardTitle>
              <CardDescription>
                Please provide accurate information about your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitStep1} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      placeholder="Enter your shop/business name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type
                    </label>
                    <Select 
                      value={formData.business_type} 
                      onValueChange={(v) => setFormData({ ...formData, business_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics Store</SelectItem>
                        <SelectItem value="furniture">Furniture Store</SelectItem>
                        <SelectItem value="appliances">Home Appliances</SelectItem>
                        <SelectItem value="mobile">Mobile Shop</SelectItem>
                        <SelectItem value="general">General Store</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={formData.business_phone}
                      onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                      placeholder="03XX-XXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Email
                    </label>
                    <Input
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                      placeholder="shop@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner CNIC Number
                    </label>
                    <Input
                      value={formData.owner_cnic}
                      onChange={(e) => setFormData({ ...formData, owner_cnic: e.target.value })}
                      placeholder="XXXXX-XXXXXXX-X"
                      maxLength={15}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address
                    </label>
                    <Textarea
                      value={formData.business_address}
                      onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                      placeholder="Enter complete business address"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" size="lg">
                    Next: Select Plan →
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Plan Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>💎 Select Your Plan</CardTitle>
                <CardDescription>
                  Choose the plan that best fits your business needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {plans.length > 0 ? plans.map((plan) => (
                    <div
                      key={plan.plan_id}
                      onClick={() => setSelectedPlan(plan.plan_name)}
                      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPlan === plan.plan_name
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {plan.plan_name === 'professional' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900">{plan.display_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatPrice(plan.price_monthly)}
                          </span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        <ul className="mt-6 space-y-2 text-left">
                          <li className="flex items-center text-sm">
                            <span className="text-green-500 mr-2">✓</span>
                            Up to {plan.max_users} users
                          </li>
                          <li className="flex items-center text-sm">
                            <span className="text-green-500 mr-2">✓</span>
                            Up to {plan.max_customers} customers
                          </li>
                          {Array.isArray(plan.features) && plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center text-sm">
                              <span className="text-green-500 mr-2">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {selectedPlan === plan.plan_name && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  )) : (
                    // Default plans if none loaded
                    <>
                      <div
                        onClick={() => setSelectedPlan('basic')}
                        className={`p-6 rounded-xl border-2 cursor-pointer ${
                          selectedPlan === 'basic' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <h3 className="text-xl font-bold">Basic</h3>
                        <p className="text-3xl font-bold mt-4">PKR 2,999<span className="text-sm font-normal">/mo</span></p>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li>✓ 3 Users</li>
                          <li>✓ 50 Customers</li>
                          <li>✓ Basic Reports</li>
                        </ul>
                      </div>
                      <div
                        onClick={() => setSelectedPlan('professional')}
                        className={`p-6 rounded-xl border-2 cursor-pointer ${
                          selectedPlan === 'professional' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <Badge className="mb-2">Popular</Badge>
                        <h3 className="text-xl font-bold">Professional</h3>
                        <p className="text-3xl font-bold mt-4">PKR 5,999<span className="text-sm font-normal">/mo</span></p>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li>✓ 10 Users</li>
                          <li>✓ 200 Customers</li>
                          <li>✓ WhatsApp Notifications</li>
                        </ul>
                      </div>
                      <div
                        onClick={() => setSelectedPlan('enterprise')}
                        className={`p-6 rounded-xl border-2 cursor-pointer ${
                          selectedPlan === 'enterprise' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <h3 className="text-xl font-bold">Enterprise</h3>
                        <p className="text-3xl font-bold mt-4">PKR 9,999<span className="text-sm font-normal">/mo</span></p>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li>✓ 50 Users</li>
                          <li>✓ 1000 Customers</li>
                          <li>✓ API Access</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button onClick={handleSubmitStep2} size="lg">
                Next: Payment →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>💳 Payment Details</CardTitle>
                <CardDescription>
                  Upload your payment slip to complete the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Summary */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Order Summary</h4>
                  <div className="mt-2 flex justify-between">
                    <span className="text-gray-600">Plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</span>
                    <span className="font-bold">
                      {formatPrice(plans.find(p => p.plan_name === selectedPlan)?.price_monthly || 2999)}
                    </span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">📍 Bank Account Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Bank:</strong> Meezan Bank</p>
                    <p><strong>Account Title:</strong> InstalEase Technologies</p>
                    <p><strong>Account Number:</strong> 0123456789012</p>
                    <p><strong>IBAN:</strong> PK00MEZN0000000123456789</p>
                  </div>
                </div>

                {/* Payment Form */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <Input
                      value={paymentData.bank_name}
                      onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                      placeholder="e.g., Meezan Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID / Reference
                    </label>
                    <Input
                      value={paymentData.transaction_id}
                      onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                      placeholder="Enter transaction reference"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date
                    </label>
                    <Input
                      type="date"
                      value={paymentData.payment_date}
                      onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <Input
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="Any additional notes"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Slip <span className="text-red-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    paymentSlipUrl ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}>
                    {paymentSlipUrl ? (
                      <div className="space-y-2">
                        <div className="text-green-600 text-4xl">✅</div>
                        <p className="text-green-700 font-medium">Payment slip uploaded!</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPaymentSlipUrl(null)}
                        >
                          Upload Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-gray-400 text-4xl">📄</div>
                        <p className="text-gray-600">
                          Drag & drop your payment slip here, or click to browse
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="payment-slip"
                          disabled={uploadingSlip}
                        />
                        <label htmlFor="payment-slip">
                          <Button 
                            variant="outline" 
                            disabled={uploadingSlip}
                            asChild
                          >
                            <span>
                              {uploadingSlip ? 'Uploading...' : 'Choose File'}
                            </span>
                          </Button>
                        </label>
                        <p className="text-xs text-gray-500">
                          Supported: JPEG, PNG, WebP, PDF (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button 
                onClick={handleFinalSubmit} 
                size="lg"
                disabled={submitting || !paymentSlipUrl}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : '✅ Submit Application'}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <Footer variant="dashboard" />
    </div>
  );
}
