/**
 * Customer Portal Page
 * 
 * Customer-facing portal for viewing balances, payment history, and contracts.
 * Protected route - only accessible to users with 'customer' role.
 * 
 * @module app/portal/customer/page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useCustomerBalance, useCustomerInstallments } from '@/hooks/use-installments';
import { useCustomerPayments } from '@/hooks/use-payments';
import { useContracts } from '@/hooks/use-contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorBoundary } from '@/components/ErrorBoundary';
import { Badge } from '@/components/ui/badge';
// Date formatting utility (using native Date methods)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Customer Portal component
 * 
 * Displays:
 * - Account balance (total, overdue, pending)
 * - Payment history
 * - Upcoming installments
 * - Active contracts
 * 
 * @returns {JSX.Element} Customer portal UI
 */
export default function CustomerPortalPage() {
  const router = useRouter();
  const { user, profile, loading, initialized } = useAuthStore();

  // Get customer ID from profile (assuming customer_id is stored in users table or derived)
  // For now, we'll use the user_id as customer identifier
  const customerId = profile?.user_id || null;

  // Fetch customer data
  const { data: balance, isLoading: balanceLoading } = useCustomerBalance(customerId);
  const { data: installments, isLoading: installmentsLoading } = useCustomerInstallments(customerId);
  const { data: payments, isLoading: paymentsLoading } = useCustomerPayments(customerId);
  const { data: contracts, isLoading: contractsLoading } = useContracts();

  // Filter contracts for this customer
  const customerContracts = contracts?.filter(
    (c) => c.customer_id === customerId || c.customer_id === profile?.user_id
  ) || [];

  useEffect(() => {
    // Redirect if not authenticated or not a customer
    if (initialized && !loading && (!user || profile?.role !== 'customer')) {
      router.push('/auth/login');
    }
  }, [user, profile, loading, initialized, router]);

  if (loading || !initialized) {
    return <LoadingState message="Loading portal..." />;
  }

  if (!user || profile?.role !== 'customer') {
    return null;
  }

  const isLoading = balanceLoading || installmentsLoading || paymentsLoading || contractsLoading;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-gray-600">Welcome, {profile?.username || user.email}</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {isLoading ? (
            <LoadingState message="Loading your account information..." />
          ) : (
            <div className="space-y-6">
              {/* Balance Overview */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Outstanding</CardTitle>
                    <CardDescription>All pending and overdue amounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      PKR {balance?.total.toLocaleString('en-PK', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Overdue Amount</CardTitle>
                    <CardDescription>Past due installments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      PKR {balance?.overdue.toLocaleString('en-PK', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Amount</CardTitle>
                    <CardDescription>Upcoming installments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      PKR {balance?.pending.toLocaleString('en-PK', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Installments */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Installments</CardTitle>
                  <CardDescription>Your payment schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  {installments && installments.length > 0 ? (
                    <div className="space-y-4">
                      {installments
                        .filter((i) => i.payment_status === 'pending' || i.payment_status === 'overdue')
                        .slice(0, 10)
                        .map((installment) => (
                          <div
                            key={installment.installment_id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div>
                              <div className="font-medium">
                                Installment #{installment.installment_number}
                                {installment.contracts && (
                                  <span className="ml-2 text-sm text-gray-500">
                                    - {installment.contracts.product_name}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                Due: {formatDate(installment.due_date)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                PKR {(Number(installment.amount_due) + Number(installment.late_fee)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </div>
                              <Badge
                                variant={
                                  installment.payment_status === 'overdue' ? 'destructive' : 'default'
                                }
                                className="mt-1"
                              >
                                {installment.payment_status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No upcoming installments</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Your recent payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {payments && payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.slice(0, 10).map((payment) => (
                        <div
                          key={payment.payment_id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <div className="font-medium">
                              {payment.contracts?.product_name || 'Payment'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(payment.payment_date)} via {payment.gateway}
                            </div>
                            {payment.transaction_id && (
                              <div className="text-xs text-gray-400">
                                Txn: {payment.transaction_id}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              PKR {Number(payment.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {payment.gateway}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No payment history</p>
                  )}
                </CardContent>
              </Card>

              {/* Active Contracts */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Contracts</CardTitle>
                  <CardDescription>Your installment agreements</CardDescription>
                </CardHeader>
                <CardContent>
                  {customerContracts.length > 0 ? (
                    <div className="space-y-4">
                      {customerContracts.map((contract) => (
                        <div
                          key={contract.contract_id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{contract.product_name}</div>
                              <div className="text-sm text-gray-500">
                                PKR {Number(contract.product_price).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <Badge
                              variant={
                                contract.contract_status === 'active'
                                  ? 'default'
                                  : contract.contract_status === 'completed'
                                  ? 'outline'
                                  : 'secondary'
                              }
                            >
                              {contract.contract_status}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Monthly Payment:</span>{' '}
                              <span className="font-medium">
                                PKR {Number(contract.monthly_installment).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Remaining:</span>{' '}
                              <span className="font-medium">
                                {contract.total_months} months
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No active contracts</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

