/**
 * Staff Applications Page
 * 
 * RBAC-protected page for sales_rep role.
 * Shows only applications (contracts) that the staff member can view/manage.
 * 
 * @module app/applications/staff/page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useContracts } from '@/hooks/use-contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorBoundary } from '@/components/ErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

/**
 * Staff Applications component
 * 
 * Displays applications (contracts) that sales_rep can view.
 * Limited to pending and approved contracts only.
 * 
 * @returns {JSX.Element} Staff applications UI
 */
export default function StaffApplicationsPage() {
  const router = useRouter();
  const { user, profile, loading, initialized } = useAuthStore();
  const { data: contracts, isLoading: contractsLoading } = useContracts();

  // Filter contracts: sales_rep can only see pending and approved
  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter(
      (c) => c.contract_status === 'pending' || c.contract_status === 'approved'
    );
  }, [contracts]);

  useEffect(() => {
    // Redirect if not authenticated or not sales_rep
    if (initialized && !loading && (!user || profile?.role !== 'sales_rep')) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, initialized, router]);

  if (loading || !initialized) {
    return <LoadingState message="Loading applications..." />;
  }

  if (!user || profile?.role !== 'sales_rep') {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
                <p className="text-gray-600">View and manage applications</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {contractsLoading ? (
            <LoadingState message="Loading applications..." />
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Applications</CardTitle>
                  <CardDescription>
                    Applications you can view and manage (Pending and Approved only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredContracts.length > 0 ? (
                    <div className="space-y-4">
                      {filteredContracts.map((contract) => (
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
                                contract.contract_status === 'approved'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {contract.contract_status}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Monthly:</span>{' '}
                              <span className="font-medium">
                                PKR {Number(contract.monthly_installment).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Months:</span>{' '}
                              <span className="font-medium">{contract.total_months}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No applications found</p>
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

