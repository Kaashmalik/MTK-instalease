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

interface ShopApplication {
  application_id: string;
  user_id: string;
  shop_name: string;
  business_type: string | null;
  business_address: string | null;
  business_phone: string | null;
  business_email: string | null;
  owner_cnic: string | null;
  documents: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function ShopApplicationsPage() {
  const [applications, setApplications] = useState<ShopApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<ShopApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('shop_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user emails for each application
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(app => app.user_id))];
        const { data: users } = await supabase
          .from('users')
          .select('user_id, username')
          .in('user_id', userIds);

        const userMap = new Map(users?.map(u => [u.user_id, u.username]) || []);
        
        const enrichedData = data.map(app => ({
          ...app,
          user_name: userMap.get(app.user_id) || 'Unknown',
        }));

        setApplications(enrichedData);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async () => {
    if (!selectedApp) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.rpc('approve_shop_application', {
        p_application_id: selectedApp.application_id,
        p_notes: reviewNotes || null,
      });

      if (error) throw error;

      alert(`Shop approved successfully! New shop ID: ${data}`);
      setDialogOpen(false);
      setSelectedApp(null);
      setReviewNotes('');
      fetchApplications();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error approving application:', error);
      alert(`Error: ${err.message || 'Failed to approve application'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !reviewNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setProcessing(true);

    try {
      const { error } = await supabase.rpc('reject_shop_application', {
        p_application_id: selectedApp.application_id,
        p_notes: reviewNotes,
      });

      if (error) throw error;

      alert('Application rejected');
      setDialogOpen(false);
      setSelectedApp(null);
      setReviewNotes('');
      fetchApplications();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error rejecting application:', error);
      alert(`Error: ${err.message || 'Failed to reject application'}`);
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (app: ShopApplication, action: 'approve' | 'reject') => {
    setSelectedApp(app);
    setActionType(action);
    setReviewNotes('');
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: '⏳ Pending' },
      under_review: { variant: 'outline', label: '🔍 Under Review' },
      approved: { variant: 'default', label: '✅ Approved' },
      rejected: { variant: 'destructive', label: '❌ Rejected' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shop Applications</h1>
          <p className="text-sm sm:text-base text-gray-600">Review and approve shop registration requests</p>
        </div>
        
        {/* Stats & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              <span>⏳</span>
              {applications.filter(a => a.status === 'pending').length} Pending
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <span>✅</span>
              {applications.filter(a => a.status === 'approved').length} Approved
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              <span>❌</span>
              {applications.filter(a => a.status === 'rejected').length} Rejected
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
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchApplications} variant="outline" size="icon" className="shrink-0">
              🔄
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No applications found</p>
            <p className="text-sm text-gray-400 mt-1">New shop applications will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {applications.map((app) => (
            <Card key={app.application_id} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">🏪 {app.shop_name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Applied by: </span>
                      <span className="font-medium">{app.user_name}</span>
                      <span className="mx-1.5">•</span>
                      {new Date(app.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(app.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
                {/* Info Grid - Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">🏭 Business Type</span>
                    <p className="font-medium text-gray-900 truncate">{app.business_type || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">📞 Phone</span>
                    <p className="font-medium text-gray-900 truncate">{app.business_phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">📧 Email</span>
                    <p className="font-medium text-gray-900 truncate">{app.business_email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">🆔 CNIC</span>
                    <p className="font-medium text-gray-900 truncate">{app.owner_cnic || 'N/A'}</p>
                  </div>
                </div>
                
                {app.business_address && (
                  <div className="mt-3 bg-gray-50 p-2 sm:p-3 rounded-lg text-sm">
                    <span className="text-xs text-gray-500 block">📍 Address</span>
                    <p className="font-medium text-gray-900">{app.business_address}</p>
                  </div>
                )}
                
                {app.review_notes && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                    <span className="text-xs text-blue-600 font-medium block mb-1">📝 Review Notes</span>
                    <p className="text-blue-900">{app.review_notes}</p>
                  </div>
                )}
                
                {app.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={() => openDialog(app, 'approve')}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                    >
                      ✅ Approve
                    </Button>
                    <Button 
                      onClick={() => openDialog(app, 'reject')}
                      variant="destructive"
                      className="flex-1 sm:flex-none"
                    >
                      ❌ Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? '✅ Approve Application' : '❌ Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `This will create a new shop "${selectedApp?.shop_name}" and assign the applicant as admin.`
                : 'Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700">
              {actionType === 'approve' ? 'Notes (optional)' : 'Rejection Reason (required)'}
            </label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={actionType === 'approve' 
                ? 'Add any notes about this approval...'
                : 'Explain why this application is being rejected...'}
              className="mt-1"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={actionType === 'approve' ? handleApprove : handleReject}
              disabled={processing || (actionType === 'reject' && !reviewNotes.trim())}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
