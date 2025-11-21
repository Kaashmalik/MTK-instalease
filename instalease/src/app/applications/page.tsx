/**
 * Installment Applications Page
 * 
 * Page for creating and managing installment applications and contracts.
 * 
 * @module app/applications/page
 */

'use client';

import { useState } from 'react';
import { useCustomers } from '@/hooks/use-customers';
import { useGuarantors } from '@/hooks/use-guarantors';
import { useContracts, useCreateContract, useUpdateContractStatus } from '@/hooks/use-contracts';
import { ContractApplicationForm } from '@/components/contracts/ContractApplicationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Applications page component
 * 
 * @returns {JSX.Element} Applications management UI
 */
export default function ApplicationsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profile } = useAuthStore();

  const { data: contracts, isLoading } = useContracts();
  const createContract = useCreateContract();
  const updateContractStatus = useUpdateContractStatus();

  const handleApprove = async (contractId: string) => {
    if (confirm('Approve this contract?')) {
      try {
        // In a real app, you'd generate the PDF here and upload it
        // For now, we'll just update the status
        await updateContractStatus.mutateAsync({
          contractId,
          status: 'approved',
        });
      } catch (error) {
        console.error('Error approving contract:', error);
        alert('Failed to approve contract');
      }
    }
  };

  const handleReject = async (contractId: string) => {
    if (confirm('Reject this contract?')) {
      try {
        await updateContractStatus.mutateAsync({
          contractId,
          status: 'cancelled',
        });
      } catch (error) {
        console.error('Error rejecting contract:', error);
        alert('Failed to reject contract');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Installment Applications</h1>
          <p className="text-muted-foreground">
            Create and manage installment contracts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Installment Application</DialogTitle>
              <DialogDescription>
                Fill in the product details and payment plan
              </DialogDescription>
            </DialogHeader>
            <ContractApplicationForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Applications</CardTitle>
          <CardDescription>
            {contracts?.length || 0} contract(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts && contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Monthly Installment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.contract_id}>
                      <TableCell className="font-medium">
                        {contract.product_name}
                      </TableCell>
                      <TableCell>{contract.customer_id}</TableCell>
                      <TableCell>
                        PKR {contract.product_price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        PKR {contract.monthly_installment.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contract.contract_status)}>
                          {contract.contract_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {contract.contract_status === 'pending' &&
                            profile?.role === 'credit_manager' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(contract.contract_id)}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(contract.contract_id)}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          {contract.contract_pdf_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={contract.contract_pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No contracts found. Create your first application to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

