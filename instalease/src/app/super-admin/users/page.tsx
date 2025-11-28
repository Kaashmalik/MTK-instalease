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

interface User {
  user_id: string;
  shop_id: string | null;
  username: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  email?: string;
  shop_name?: string;
}

interface Shop {
  shop_id: string;
  shop_name: string;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignShopDialogOpen, setAssignShopDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    role: '',
    is_active: true,
  });

  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [assignRole, setAssignRole] = useState<string>('admin');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch emails from auth.users and shop names
      if (data && data.length > 0) {
        // Get shop names
        const shopIds = [...new Set(data.filter(u => u.shop_id).map(u => u.shop_id))];
        let shopMap = new Map<string, string>();
        
        if (shopIds.length > 0) {
          const { data: shopsData } = await supabase
            .from('shops')
            .select('shop_id, shop_name')
            .in('shop_id', shopIds);
          
          shopMap = new Map(shopsData?.map(s => [s.shop_id, s.shop_name]) || []);
        }

        const enrichedData = data.map(user => ({
          ...user,
          shop_name: user.shop_id ? shopMap.get(user.shop_id) || 'Unknown' : null,
        }));

        setUsers(enrichedData);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  const fetchShops = async () => {
    const { data } = await supabase
      .from('shops')
      .select('shop_id, shop_name')
      .eq('subscription_status', 'active')
      .order('shop_name');
    
    setShops(data || []);
  };

  useEffect(() => {
    fetchUsers();
    fetchShops();
  }, [fetchUsers]);

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      is_active: user.is_active,
    });
    setEditDialogOpen(true);
  };

  const openAssignShopDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedShopId(user.shop_id || '');
    setAssignRole(user.role === 'super_admin' ? 'admin' : user.role);
    setAssignShopDialogOpen(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    setProcessing(true);

    try {
      // Use RPC function for role change
      const { error } = await supabase.rpc('change_user_role', {
        p_user_id: selectedUser.user_id,
        p_new_role: editForm.role,
      });

      if (error) throw error;

      // Update is_active separately
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: editForm.is_active })
        .eq('user_id', selectedUser.user_id);

      if (updateError) throw updateError;

      alert('User updated successfully!');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error updating user:', error);
      alert(`Error: ${err.message || 'Failed to update user'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignShop = async () => {
    if (!selectedUser || !selectedShopId) {
      alert('Please select a shop');
      return;
    }
    setProcessing(true);

    try {
      const { error } = await supabase.rpc('assign_user_to_shop', {
        p_user_id: selectedUser.user_id,
        p_shop_id: selectedShopId,
        p_role: assignRole,
      });

      if (error) throw error;

      alert('User assigned to shop successfully!');
      setAssignShopDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error assigning user to shop:', error);
      alert(`Error: ${err.message || 'Failed to assign user to shop'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveFromShop = async (user: User) => {
    if (!confirm(`Remove ${user.username} from their shop?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ shop_id: null, role: 'customer' })
        .eq('user_id', user.user_id);

      if (error) throw error;

      alert('User removed from shop');
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error removing user from shop:', error);
      alert(`Error: ${err.message || 'Failed to remove user from shop'}`);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      super_admin: { color: 'bg-purple-100 text-purple-800', label: '🔐 Super Admin' },
      admin: { color: 'bg-red-100 text-red-800', label: '👑 Admin' },
      shop_owner: { color: 'bg-blue-100 text-blue-800', label: '🏪 Shop Owner' },
      credit_manager: { color: 'bg-green-100 text-green-800', label: '💳 Credit Manager' },
      sales_rep: { color: 'bg-yellow-100 text-yellow-800', label: '📊 Sales Rep' },
      customer: { color: 'bg-gray-100 text-gray-800', label: '👤 Customer' },
    };
    const config = variants[role] || variants.customer;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage all system users</p>
        </div>
        
        {/* Filters - Responsive */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="shop_owner">Shop Owner</SelectItem>
                <SelectItem value="credit_manager">Credit Manager</SelectItem>
                <SelectItem value="sales_rep">Sales Rep</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchUsers} variant="outline" size="icon" className="shrink-0">
              🔄
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>👥</span> Total
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>👑</span> Admins
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-red-600">
              {users.filter(u => u.role === 'admin').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>🏪</span> Owners
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-blue-600">
              {users.filter(u => u.role === 'shop_owner').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>💼</span> Staff
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-green-600">
              {users.filter(u => ['credit_manager', 'sales_rep'].includes(u.role)).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>👤</span> Customers
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-gray-600">
              {users.filter(u => u.role === 'customer').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
              <span>⚠️</span> Unassigned
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-yellow-600">
              {users.filter(u => !u.shop_id && u.role !== 'super_admin').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-500">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
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
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Shop</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Last Login</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.username}</p>
                            {user.full_name && (
                              <p className="text-sm text-gray-500">{user.full_name}</p>
                            )}
                            {user.phone && (
                              <p className="text-xs text-gray-400">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.shop_name ? (
                          <span className="text-sm font-medium text-gray-700">{user.shop_name}</span>
                        ) : user.role === 'super_admin' ? (
                          <span className="text-xs text-purple-600 font-medium">🔐 System Level</span>
                        ) : (
                          <span className="text-xs text-yellow-600">⚠️ Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? '✅ Active' : '⏸️ Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          {user.role !== 'super_admin' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditDialog(user)}
                                title="Edit User"
                              >
                                ✏️
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openAssignShopDialog(user)}
                                title="Assign to Shop"
                              >
                                🏪
                              </Button>
                              {user.shop_id && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRemoveFromShop(user)}
                                  title="Remove from Shop"
                                >
                                  ❌
                                </Button>
                              )}
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
            {filteredUsers.map((user) => (
              <Card key={user.user_id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 truncate">{user.username}</p>
                          {user.full_name && (
                            <p className="text-sm text-gray-500 truncate">{user.full_name}</p>
                          )}
                        </div>
                        <Badge variant={user.is_active ? 'default' : 'secondary'} className="shrink-0 text-xs">
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      {/* Role & Shop */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {getRoleBadge(user.role)}
                        {user.shop_name ? (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">🏪 {user.shop_name}</span>
                        ) : user.role === 'super_admin' ? (
                          <span className="text-xs text-purple-600">🔐 System</span>
                        ) : (
                          <span className="text-xs text-yellow-600">⚠️ Unassigned</span>
                        )}
                      </div>
                      
                      {/* Phone & Last Login */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        {user.phone && <span>📞 {user.phone}</span>}
                        <span>📅 {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never logged in'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {user.role !== 'super_admin' && (
                    <div className="mt-4 pt-3 border-t flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(user)}
                      >
                        ✏️ Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => openAssignShopDialog(user)}
                      >
                        🏪 Assign
                      </Button>
                      {user.shop_id && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleRemoveFromShop(user)}
                        >
                          ❌
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Results Count */}
          <p className="text-sm text-gray-500 text-center">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Change user role and status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select 
                value={editForm.role} 
                onValueChange={(v) => setEditForm({ ...editForm, role: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="shop_owner">Shop Owner</SelectItem>
                  <SelectItem value="credit_manager">Credit Manager</SelectItem>
                  <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active Account
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={processing}>
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Shop Dialog */}
      <Dialog open={assignShopDialogOpen} onOpenChange={setAssignShopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Shop: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Select a shop and role for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Shop</label>
              <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.shop_id} value={shop.shop_id}>
                      {shop.shop_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Role in Shop</label>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="shop_owner">Shop Owner</SelectItem>
                  <SelectItem value="credit_manager">Credit Manager</SelectItem>
                  <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignShopDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignShop} disabled={processing || !selectedShopId}>
              {processing ? 'Assigning...' : 'Assign to Shop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
