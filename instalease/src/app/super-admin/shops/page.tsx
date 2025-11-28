'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Shop {
  shop_id: string;
  shop_name: string;
  shop_code: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscription_plan: 'basic' | 'professional' | 'enterprise';
  subscription_expires_at: string | null;
  max_users: number;
  max_customers: number;
  created_at: string;
  user_count?: number;
  customer_count?: number;
}

export default function ManageShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    shop_name: '',
    subscription_status: '',
    subscription_plan: '',
    max_users: 5,
    max_customers: 100,
  });

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user and customer counts for each shop
      if (data && data.length > 0) {
        const shopIds = data.map(s => s.shop_id);
        
        // Get user counts
        const { data: userCounts } = await supabase
          .from('users')
          .select('shop_id')
          .in('shop_id', shopIds);

        // Get customer counts
        const { data: customerCounts } = await supabase
          .from('customers')
          .select('shop_id')
          .in('shop_id', shopIds);

        const userCountMap = new Map<string, number>();
        const customerCountMap = new Map<string, number>();

        userCounts?.forEach(u => {
          userCountMap.set(u.shop_id, (userCountMap.get(u.shop_id) || 0) + 1);
        });

        customerCounts?.forEach(c => {
          customerCountMap.set(c.shop_id, (customerCountMap.get(c.shop_id) || 0) + 1);
        });

        const enrichedData = data.map(shop => ({
          ...shop,
          user_count: userCountMap.get(shop.shop_id) || 0,
          customer_count: customerCountMap.get(shop.shop_id) || 0,
        }));

        setShops(enrichedData);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const openEditDialog = (shop: Shop) => {
    setSelectedShop(shop);
    setEditForm({
      shop_name: shop.shop_name,
      subscription_status: shop.subscription_status,
      subscription_plan: shop.subscription_plan,
      max_users: shop.max_users,
      max_customers: shop.max_customers,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateShop = async () => {
    if (!selectedShop) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          shop_name: editForm.shop_name,
          subscription_status: editForm.subscription_status,
          subscription_plan: editForm.subscription_plan,
          max_users: editForm.max_users,
          max_customers: editForm.max_customers,
        })
        .eq('shop_id', selectedShop.shop_id);

      if (error) throw error;

      alert('Shop updated successfully!');
      setEditDialogOpen(false);
      fetchShops();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error updating shop:', error);
      alert(`Error: ${err.message || 'Failed to update shop'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      trial: { variant: 'secondary', label: '🆓 Trial' },
      active: { variant: 'default', label: '✅ Active' },
      suspended: { variant: 'destructive', label: '⚠️ Suspended' },
      cancelled: { variant: 'outline', label: '❌ Cancelled' },
    };
    const config = variants[status] || variants.trial;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[plan] || colors.basic}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  const filteredShops = shops.filter(shop =>
    shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Shops</h1>
          <p className="text-gray-600">View and manage all registered shops</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={fetchShops} variant="outline">
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shops</CardDescription>
            <CardTitle className="text-3xl">{shops.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {shops.filter(s => s.subscription_status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trial</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {shops.filter(s => s.subscription_status === 'trial').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Suspended</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {shops.filter(s => s.subscription_status === 'suspended').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Shops Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredShops.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No shops found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.map((shop) => (
                <TableRow key={shop.shop_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{shop.shop_name}</p>
                      {shop.shop_code && (
                        <p className="text-xs text-gray-500">Code: {shop.shop_code}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {shop.email && <p>{shop.email}</p>}
                      {shop.phone && <p className="text-gray-500">{shop.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(shop.subscription_status)}</TableCell>
                  <TableCell>{getPlanBadge(shop.subscription_plan)}</TableCell>
                  <TableCell>
                    <span className={shop.user_count! >= shop.max_users ? 'text-red-600 font-medium' : ''}>
                      {shop.user_count} / {shop.max_users}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={shop.customer_count! >= shop.max_customers ? 'text-red-600 font-medium' : ''}>
                      {shop.customer_count} / {shop.max_customers}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(shop.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditDialog(shop)}
                    >
                      ✏️ Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit Shop Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
            <DialogDescription>
              Update shop settings and subscription details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Shop Name</label>
              <Input
                value={editForm.shop_name}
                onChange={(e) => setEditForm({ ...editForm, shop_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subscription Status</label>
              <Select 
                value={editForm.subscription_status} 
                onValueChange={(v) => setEditForm({ ...editForm, subscription_status: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Subscription Plan</label>
              <Select 
                value={editForm.subscription_plan} 
                onValueChange={(v) => setEditForm({ ...editForm, subscription_plan: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Max Users</label>
                <Input
                  type="number"
                  value={editForm.max_users}
                  onChange={(e) => setEditForm({ ...editForm, max_users: parseInt(e.target.value) || 5 })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Customers</label>
                <Input
                  type="number"
                  value={editForm.max_customers}
                  onChange={(e) => setEditForm({ ...editForm, max_customers: parseInt(e.target.value) || 100 })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShop} disabled={processing}>
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
