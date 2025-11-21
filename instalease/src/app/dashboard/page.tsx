/**
 * Enhanced Dashboard Page
 * 
 * Main dashboard for shop owners and staff with:
 * - Analytics and reports (Recharts)
 * - CRUD quick actions
 * - Outstanding totals via SQL aggregates
 * - Role-based access (sales_rep sees limited view)
 * 
 * @module app/dashboard/page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useContracts } from '@/hooks/use-contracts';
import { usePayments } from '@/hooks/use-payments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRealtimeAll } from '@/hooks/use-realtime';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Dashboard statistics
 */
interface DashboardStats {
  totalOutstanding: number;
  totalReceived: number;
  activeContracts: number;
  pendingApplications: number;
  overdueCount: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  contractStatusDistribution: Array<{ name: string; value: number }>;
  paymentMethodDistribution: Array<{ name: string; value: number }>;
}

/**
 * Dashboard page component with analytics
 * 
 * @returns {JSX.Element} Enhanced dashboard UI
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, initialized, signOut } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const { data: contracts, isLoading: contractsLoading } = useContracts();
  const { isLoading: paymentsLoading } = usePayments({ limit: 100 });

  // Enable real-time subscriptions for live updates
  useRealtimeAll(profile?.shop_id || null, { enabled: !!profile?.shop_id });

  // Fetch dashboard statistics
  useEffect(() => {
    if (!profile?.shop_id) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        // Get outstanding total (sum of pending installments)
        const { data: outstandingData } = await supabase
          .from('installments')
          .select('amount_due, late_fee')
          .eq('shop_id', profile.shop_id)
          .in('payment_status', ['pending', 'overdue']);

        const totalOutstanding =
          outstandingData?.reduce(
            (sum, i) => sum + Number(i.amount_due) + Number(i.late_fee || 0),
            0
          ) || 0;

        // Get total received (sum of all payments)
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount')
          .eq('shop_id', profile.shop_id);

        const totalReceived =
          paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        // Get active contracts count
        const { data: activeContracts } = await supabase
          .from('contracts')
          .select('contract_id', { count: 'exact', head: true })
          .eq('shop_id', profile.shop_id)
          .eq('contract_status', 'active');

        // Get pending applications count
        const { data: pendingApps } = await supabase
          .from('contracts')
          .select('contract_id', { count: 'exact', head: true })
          .eq('shop_id', profile.shop_id)
          .eq('contract_status', 'pending');

        // Get overdue count
        const { data: overdueData } = await supabase
          .from('installments')
          .select('installment_id', { count: 'exact', head: true })
          .eq('shop_id', profile.shop_id)
          .eq('payment_status', 'overdue');

        // Get monthly revenue (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: monthlyPayments } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .eq('shop_id', profile.shop_id)
          .gte('payment_date', sixMonthsAgo.toISOString())
          .order('payment_date', { ascending: true });

        // Aggregate monthly revenue
        const monthlyRevenueMap = new Map<string, number>();
        monthlyPayments?.forEach((payment) => {
          const month = new Date(payment.payment_date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          monthlyRevenueMap.set(
            month,
            (monthlyRevenueMap.get(month) || 0) + Number(payment.amount)
          );
        });

        const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
          month,
          revenue,
        }));

        // Contract status distribution
        const { data: contractStatuses } = await supabase
          .from('contracts')
          .select('contract_status')
          .eq('shop_id', profile.shop_id);

        const statusCounts = new Map<string, number>();
        contractStatuses?.forEach((c) => {
          statusCounts.set(c.contract_status, (statusCounts.get(c.contract_status) || 0) + 1);
        });

        const contractStatusDistribution = Array.from(statusCounts.entries()).map(
          ([name, value]) => ({ name, value })
        );

        // Payment method distribution
        const { data: paymentMethods } = await supabase
          .from('payments')
          .select('gateway')
          .eq('shop_id', profile.shop_id);

        const methodCounts = new Map<string, number>();
        paymentMethods?.forEach((p) => {
          methodCounts.set(p.gateway, (methodCounts.get(p.gateway) || 0) + 1);
        });

        const paymentMethodDistribution = Array.from(methodCounts.entries()).map(
          ([name, value]) => ({ name, value })
        );

        setStats({
          totalOutstanding,
          totalReceived,
          activeContracts: activeContracts?.length || 0,
          pendingApplications: pendingApps?.length || 0,
          overdueCount: overdueData?.length || 0,
          monthlyRevenue,
          contractStatusDistribution,
          paymentMethodDistribution,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [profile?.shop_id]);

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, initialized, router]);

  if (loading || !initialized) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!user) {
    return null;
  }

  // Role-based access: sales_rep sees limited view
  const isSalesRep = profile?.role === 'sales_rep';
  const isShopOwner = profile?.role === 'shop_owner' || profile?.role === 'admin';

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">InstalEase Dashboard</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {profile?.username || user.email} ({profile?.role})
                </span>
                <Button variant="outline" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loadingStats || contractsLoading || paymentsLoading ? (
            <LoadingState message="Loading dashboard data..." />
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Outstanding</CardTitle>
                    <CardDescription>Pending and overdue amounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      PKR {stats?.totalOutstanding.toLocaleString('en-PK', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Received</CardTitle>
                    <CardDescription>All-time payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      PKR {stats?.totalReceived.toLocaleString('en-PK', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Contracts</CardTitle>
                    <CardDescription>Currently active</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats?.activeContracts || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Overdue</CardTitle>
                    <CardDescription>Past due installments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {stats?.overdueCount || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Charts - Only for shop owners */}
              {isShopOwner && stats && (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Monthly Revenue Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Revenue</CardTitle>
                      <CardDescription>Last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#0088FE"
                            strokeWidth={2}
                            name="Revenue (PKR)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Contract Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contract Status</CardTitle>
                      <CardDescription>Distribution by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stats.contractStatusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.contractStatusDistribution.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Payment Method Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                      <CardDescription>Distribution by gateway</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.paymentMethodDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#00C49F" name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Button className="w-full" variant="outline" asChild>
                      <a href="/customers">Manage Customers</a>
                    </Button>
                    <Button className="w-full" variant="outline" asChild>
                      <a href="/applications">Create Application</a>
                    </Button>
                    {isShopOwner && (
                      <>
                        <Button className="w-full" variant="outline" asChild>
                          <a href="/payments">View Payments</a>
                        </Button>
                        <Button className="w-full" variant="outline" asChild>
                          <a href="/reports">View Reports</a>
                        </Button>
                      </>
                    )}
                    {isSalesRep && (
                      <Button className="w-full" variant="outline" asChild>
                        <a href="/applications">View Applications</a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity - Only for shop owners */}
              {isShopOwner && contracts && contracts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Contracts</CardTitle>
                    <CardDescription>Latest activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contracts.slice(0, 5).map((contract) => (
                        <div
                          key={contract.contract_id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <div className="font-medium">{contract.product_name}</div>
                            <div className="text-sm text-gray-500">
                              Status: {contract.contract_status}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              PKR {Number(contract.product_price).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
