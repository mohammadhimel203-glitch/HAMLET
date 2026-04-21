import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatBDT } from '@/lib/formatCurrency.js';
import { StatusBadge } from '@/components/StatusBadge.jsx';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle2, XCircle, Eye } from 'lucide-react';

export default function AdminBrandOwnersPage() {
  const [brandOwners, setBrandOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBrandOwners = async () => {
    try {
      // Fetching from API to get calculated stats (totalOrders, totalProfit)
      const res = await apiServerClient.fetch('/admin/brand-owners');
      const data = await res.json();
      setBrandOwners(data);
    } catch (err) {
      toast.error("Failed to load brand owners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandOwners();
  }, []);

  const handleApprove = async (id) => {
    try {
      await pb.collection('brand_owners').update(id, { status: 'approved', approved: true }, { $autoCancel: false });
      
      // Ensure wallet exists
      try {
        await pb.collection('wallets').getFirstListItem(`brandOwnerId="${id}"`, { $autoCancel: false });
      } catch {
        await pb.collection('wallets').create({ brandOwnerId: id, orderBalance: 0, profitBalance: 0 }, { $autoCancel: false });
      }
      
      toast.success("Brand owner approved successfully");
      fetchBrandOwners();
    } catch (err) {
      toast.error("Failed to approve brand owner");
    }
  };

  const openRejectModal = (brand) => {
    setSelectedBrand(brand);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return toast.error("Please provide a reason");
    setIsSubmitting(true);
    try {
      await pb.collection('brand_owners').update(selectedBrand.id, { 
        status: 'rejected', 
        approved: false,
        rejectionReason 
      }, { $autoCancel: false });
      toast.success("Brand owner rejected");
      setRejectModalOpen(false);
      fetchBrandOwners();
    } catch (err) {
      toast.error("Failed to reject brand owner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBrands = brandOwners.filter(b => statusFilter === 'all' || b.status === statusFilter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Helmet><title>Manage Brand Owners | Admin</title></Helmet>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Owners</h1>
          <p className="text-muted-foreground mt-1">Manage registrations and view performance.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-background"><SelectValue placeholder="Filter Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Brand Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6}><Skeleton className="h-48 w-full" /></TableCell></TableRow> : 
                filteredBrands.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8">No brand owners found.</TableCell></TableRow> :
                filteredBrands.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-bold">{b.brandName}</TableCell>
                    <TableCell>{b.userId?.name || b.fullName}</TableCell>
                    <TableCell>
                      <div className="text-sm">{b.email}</div>
                      <div className="text-xs text-muted-foreground">{b.mobile}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{b.totalOrders} Orders</div>
                      <div className="text-xs text-emerald-600">{formatBDT(b.totalProfit)} Profit</div>
                    </TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-right">
                      {b.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove(b.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => openRejectModal(b)}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Brand Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g., Invalid contact details" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
