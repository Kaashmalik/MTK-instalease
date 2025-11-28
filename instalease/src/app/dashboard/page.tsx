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
import { Footer } from '@/components/ui/footer';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
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
    // If no profile yet, wait for it to be loaded
    if (!profile) {
      setLoadingStats(false);
      return;
    }
    
    // If no shop_id, show empty stats but still render dashboard
    if (!profile.shop_id) {
      setStats({
        totalOutstanding: 0,
        totalReceived: 0,
        activeContracts: 0,
        pendingApplications: 0,
        overdueCount: 0,
        monthlyRevenue: [],
        contractStatusDistribution: [],
        paymentMethodDistribution: [],
      });
      setLoadingStats(false);
      return;
    }

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

  // Role-based access
  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin' || isSuperAdmin;
  const isShopOwner = profile?.role === 'shop_owner' || isAdmin;
  const isSalesRep = profile?.role === 'sales_rep';
  // Note: isCreditManager and isCustomer available for future role-based features
  
  // Check if user needs shop assignment (not super_admin and no shop_id)
  const needsShopAssignment = !isSuperAdmin && !profile?.shop_id;

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">InstalEase</h1>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
                    {profile?.username || user.email}
                  </span>
                </div>
                <ThemeSwitcher variant="icon" />
                <Button variant="outline" size="sm" onClick={() => signOut()} className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">🚪</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {loadingStats || contractsLoading || paymentsLoading ? (
            <LoadingState message="Loading dashboard data..." />
          ) : !profile ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to InstalEase!</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Your profile is being set up. Please wait a moment...
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : isSuperAdmin ? (
            <div className="space-y-6">
              <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-purple-800 dark:text-purple-300 text-lg sm:text-xl">🔐 Super Admin Dashboard</CardTitle>
                  <CardDescription className="text-sm dark:text-gray-400">Full system access - Manage all shops and users</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Button 
                      className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => window.location.href = '/super-admin/applications'}
                    >
                      <span className="text-xl sm:text-2xl">📋</span>
                      <span>Applications</span>
                    </Button>
                    <Button 
                      className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => window.location.href = '/super-admin/payments'}
                    >
                      <span className="text-xl sm:text-2xl">💳</span>
                      <span>Payments</span>
                    </Button>
                    <Button 
                      className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => window.location.href = '/super-admin/shops'}
                    >
                      <span className="text-xl sm:text-2xl">🏪</span>
                      <span>Shops</span>
                    </Button>
                    <Button 
                      className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => window.location.href = '/super-admin/users'}
                    >
                      <span className="text-xl sm:text-2xl">👥</span>
                      <span>Users</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="dark:text-white">System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    As Super Admin, you can approve shop applications, assign users to shops, and manage the entire system.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : needsShopAssignment ? (
            <div className="space-y-6">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-800">⏳ Awaiting Shop Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Your account has been created successfully. To start using InstalEase, you need to be assigned to a shop.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Options:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Apply for a new shop (if you are a business owner)</li>
                      <li>Contact your administrator to be added to an existing shop</li>
                    </ul>
                  </div>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = '/apply-shop'}
                  >
                    Apply for Shop
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-red-50 to-white">
                  <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                    <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                      <span>💸</span> <span className="hidden sm:inline">Total </span>Outstanding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600">
                      <span className="text-xs sm:text-sm font-normal">PKR </span>
                      {stats?.totalOutstanding.toLocaleString('en-PK', { minimumFractionDigits: 0 }) || '0'}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white">
                  <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                    <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                      <span>✅</span> <span className="hidden sm:inline">Total </span>Received
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600">
                      <span className="text-xs sm:text-sm font-normal">PKR </span>
                      {stats?.totalReceived.toLocaleString('en-PK', { minimumFractionDigits: 0 }) || '0'}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                    <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                      <span>📝</span> Active Contracts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {stats?.activeContracts || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                    <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                      <span>⚠️</span> Overdue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                      {stats?.overdueCount || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Charts - Only for shop owners */}
              {isShopOwner && stats && (
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  {/* Monthly Revenue Chart */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Monthly Revenue</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6 pt-0">
                      <ResponsiveContainer width="100%" height={250}>
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
                              `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
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
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
        
        <Footer variant="dashboard" />
      </div>
    </ErrorBoundary>
  );
}
