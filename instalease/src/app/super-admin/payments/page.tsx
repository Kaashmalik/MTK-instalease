'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';

interface PaymentSlip {
  slip_id: string;
  application_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  bank_name: string | null;
  transaction_id: string | null;
  payment_date: string;
  slip_image_url: string;
  notes: string | null;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  // Joined data
  shop_name?: string;
  user_name?: string;
  selected_plan?: string;
}

export default function PaymentVerificationPage() {
  const [payments, setPayments] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedPayment, setSelectedPayment] = useState<PaymentSlip | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payment_slips')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch application details
      if (data && data.length > 0) {
        const appIds = [...new Set(data.map(p => p.application_id))];
        const { data: apps } = await supabase
          .from('shop_applications')
          .select('application_id, shop_name, selected_plan, user_id')
          .in('application_id', appIds);

        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: users } = await supabase
          .from('users')
          .select('user_id, username')
          .in('user_id', userIds);

        const appMap = new Map(apps?.map(a => [a.application_id, a]) || []);
        const userMap = new Map(users?.map(u => [u.user_id, u.username]) || []);

        const enrichedData = data.map(payment => {
          const app = appMap.get(payment.application_id);
          return {
            ...payment,
            shop_name: app?.shop_name || 'Unknown',
            selected_plan: app?.selected_plan || 'basic',
            user_name: userMap.get(payment.user_id) || 'Unknown',
          };
        });

        setPayments(enrichedData);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async () => {
    if (!selectedPayment) return;
    setProcessing(true);

    try {
      const { error } = await supabase.rpc('verify_payment_slip', {
        p_slip_id: selectedPayment.slip_id,
        p_notes: notes || null,
      });

      if (error) throw error;

      alert('Payment verified successfully!');
      setActionDialogOpen(false);
      setSelectedPayment(null);
      setNotes('');
      fetchPayments();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error verifying payment:', error);
      alert(`Error: ${err.message || 'Failed to verify payment'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setProcessing(true);

    try {
      const { error } = await supabase.rpc('reject_payment_slip', {
        p_slip_id: selectedPayment.slip_id,
        p_reason: notes,
      });

      if (error) throw error;

      alert('Payment rejected');
      setActionDialogOpen(false);
      setSelectedPayment(null);
      setNotes('');
      fetchPayments();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error rejecting payment:', error);
      alert(`Error: ${err.message || 'Failed to reject payment'}`);
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (payment: PaymentSlip, action: 'verify' | 'reject') => {
    setSelectedPayment(payment);
    setActionType(action);
    setNotes('');
    setActionDialogOpen(true);
  };

  const openViewDialog = (payment: PaymentSlip) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: '⏳ Pending' },
      verified: { variant: 'default', label: '✅ Verified' },
      rejected: { variant: 'destructive', label: '❌ Rejected' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Verification</h1>
          <p className="text-sm sm:text-base text-gray-600">Review and verify payment slips from shop applications</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Stats Pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              <span>⏳</span>
              {payments.filter(p => p.status === 'pending').length} Pending
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <span>✅</span>
              {payments.filter(p => p.status === 'verified').length} Verified
            </span>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchPayments} variant="outline" size="icon" className="shrink-0">
              🔄
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>💳</span> Total
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{payments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>⏳</span> Pending
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-yellow-600">
              {payments.filter(p => p.status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>✅</span> Verified
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-green-600">
              {payments.filter(p => p.status === 'verified').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>💰</span> Revenue
            </CardDescription>
            <CardTitle className="text-lg sm:text-xl text-purple-600">
              {formatPrice(payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-gray-500">No payment slips found</p>
            <p className="text-sm text-gray-400 mt-1">Payment slips will appear here when users submit them</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Shop</TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="font-semibold">Bank</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.slip_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{payment.shop_name}</TableCell>
                      <TableCell>{payment.user_name}</TableCell>
                      <TableCell className="font-bold text-green-600">{formatPrice(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.selected_plan?.charAt(0).toUpperCase() + payment.selected_plan?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{payment.bank_name || 'N/A'}</p>
                          {payment.transaction_id && (
                            <p className="text-gray-500 text-xs">Ref: {payment.transaction_id}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openViewDialog(payment)}
                          >
                            👁️
                          </Button>
                          {payment.status === 'pending' && (
                            <>
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openActionDialog(payment, 'verify')}
                              >
                                ✅
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => openActionDialog(payment, 'reject')}
                              >
                                ❌
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {payments.map((payment) => (
              <Card key={payment.slip_id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">🏪 {payment.shop_name}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">by {payment.user_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600">{formatPrice(payment.amount)}</p>
                      <Badge variant="outline" className="text-xs">
                        {payment.selected_plan?.charAt(0).toUpperCase() + payment.selected_plan?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-500 block">🏦 Bank</span>
                      <p className="font-medium truncate">{payment.bank_name || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-500 block">📅 Date</span>
                      <p className="font-medium">{new Date(payment.payment_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {payment.transaction_id && (
                    <p className="text-xs text-gray-400 mt-2">Ref: {payment.transaction_id}</p>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => openViewDialog(payment)}
                    >
                      👁️ View Slip
                    </Button>
                    {payment.status === 'pending' && (
                      <>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openActionDialog(payment, 'verify')}
                        >
                          ✅
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionDialog(payment, 'reject')}
                        >
                          ❌
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Results Count */}
          <p className="text-sm text-gray-500 text-center">
            Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </p>
        </>
      )}

      {/* View Payment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Slip Details</DialogTitle>
            <DialogDescription>
              {selectedPayment?.shop_name} - {formatPrice(selectedPayment?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Bank:</span>
                <p className="font-medium">{selectedPayment?.bank_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Transaction ID:</span>
                <p className="font-medium">{selectedPayment?.transaction_id || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Payment Date:</span>
                <p className="font-medium">
                  {selectedPayment?.payment_date && new Date(selectedPayment.payment_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p>{selectedPayment && getStatusBadge(selectedPayment.status)}</p>
              </div>
            </div>
            {selectedPayment?.notes && (
              <div>
                <span className="text-gray-500 text-sm">Notes:</span>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedPayment.notes}</p>
              </div>
            )}
            {selectedPayment?.rejection_reason && (
              <div>
                <span className="text-red-500 text-sm">Rejection Reason:</span>
                <p className="text-sm bg-red-50 p-2 rounded text-red-700">{selectedPayment.rejection_reason}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Payment Slip Image:</span>
              <div className="mt-2 border rounded-lg overflow-hidden">
                {selectedPayment?.slip_image_url && (
                  selectedPayment.slip_image_url.endsWith('.pdf') ? (
                    <a 
                      href={selectedPayment.slip_image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-8 text-center bg-gray-50 hover:bg-gray-100"
                    >
                      📄 Click to view PDF
                    </a>
                  ) : (
                    <Image 
                      src={selectedPayment.slip_image_url} 
                      alt="Payment Slip"
                      width={600}
                      height={400}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  )
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedPayment?.status === 'pending' && (
              <>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setViewDialogOpen(false);
                    openActionDialog(selectedPayment, 'verify');
                  }}
                >
                  ✅ Verify
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false);
                    openActionDialog(selectedPayment, 'reject');
                  }}
                >
                  ❌ Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify/Reject Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'verify' ? '✅ Verify Payment' : '❌ Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'verify' 
                ? 'Confirm that this payment has been received and is valid.'
                : 'Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm"><strong>Shop:</strong> {selectedPayment?.shop_name}</p>
              <p className="text-sm"><strong>Amount:</strong> {formatPrice(selectedPayment?.amount || 0)}</p>
            </div>
            <label className="text-sm font-medium text-gray-700">
              {actionType === 'verify' ? 'Notes (optional)' : 'Rejection Reason (required)'}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'verify' 
                ? 'Add any notes about this verification...'
                : 'Explain why this payment is being rejected...'}
              className="mt-1"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={actionType === 'verify' ? handleVerify : handleReject}
              disabled={processing || (actionType === 'reject' && !notes.trim())}
              className={actionType === 'verify' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : actionType === 'verify' ? 'Verify Payment' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
