import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { formatBDT } from '@/lib/formatCurrency.js';
import { StatusBadge } from '@/components/StatusBadge.jsx';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCcw, Edit } from 'lucide-react';

export default function AdminReturnsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnCharge, setReturnCharge] = useState(0);
  const [shippingLoss, setShippingLoss] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReturns = async () => {
    try {
      const records = await pb.collection('orders').getFullList({
        filter: 'status="cancelled" || status="returned"',
        sort: '-updated',
        expand: 'brandOwnerId,productId',
        $autoCancel: false
      });
      setOrders(records);
    } catch (err) {
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setReturnCharge(0);
    setShippingLoss(0);
    setModalOpen(true);
  };

  const handleProcessReturn = async () => {
    setIsSubmitting(true);
    try {
      const finalDeduction = selectedOrder.profit - Number(returnCharge) - Number(shippingLoss);
      
      // Update order
      await pb.collection('orders').update(selectedOrder.id, { profitStatus: 'deducted' }, { $autoCancel: false });
      
      // Deduct from wallet
      const wallet = await pb.collection('wallets').getFirstListItem(`brandOwnerId="${selectedOrder.brandOwnerId}"`, { $autoCancel: false });
      await pb.collection('wallets').update(wallet.id, { profitBalance: wallet.profitBalance - finalDeduction }, { $autoCancel: false });
      
      // Create transaction
      await pb.collection('transactions').create({
        brandOwnerId: selectedOrder.brandOwnerId,
        type: 'deduction',
        amount: finalDeduction,
        paymentMethod: 'bank_transfer', // System deduction
        status: 'approved',
        reason: `Return deduction for order ${selectedOrder.id}`
      }, { $autoCancel: false });

      toast.success("Return processed and deducted successfully");
      setModalOpen(false);
      fetchReturns();
    } catch (err) {
      toast.error("Failed to process return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Helmet><title>Manage Returns | Admin</title></Helmet>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Returns & Cancellations</h1>
          <p className="text-muted-foreground mt-1">Process deductions for returned or cancelled orders.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Original Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profit Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7}><Skeleton className="h-48 w-full" /></TableCell></TableRow> : 
                orders.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8">No returns found.</TableCell></TableRow> :
                orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id.slice(0,8)}</TableCell>
                    <TableCell className="font-medium">{o.expand?.brandOwnerId?.brandName}</TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell className="font-medium text-primary">{formatBDT(o.profit)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{o.profitStatus}</Badge></TableCell>
                    <TableCell className="text-right">
                      {o.profitStatus !== 'deducted' && (
                        <Button size="sm" variant="outline" onClick={() => openModal(o)}>
                          <Edit className="h-4 w-4 mr-2" /> Process Deduction
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Return Deduction</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Original Profit:</span> <span className="font-medium">{formatBDT(selectedOrder.profit)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Return Charge (৳)</Label>
                  <Input type="number" min="0" value={returnCharge} onChange={(e) => setReturnCharge(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Loss (৳)</Label>
                  <Input type="number" min="0" value={shippingLoss} onChange={(e) => setShippingLoss(e.target.value)} />
                </div>
              </div>
              <div className="p-4 bg-red-50 text-red-900 rounded-lg flex justify-between items-center border border-red-100">
                <span className="font-semibold">Final Deduction:</span>
                <span className="font-bold text-lg">{formatBDT(selectedOrder.profit - Number(returnCharge) - Number(shippingLoss))}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleProcessReturn} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Deduction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
