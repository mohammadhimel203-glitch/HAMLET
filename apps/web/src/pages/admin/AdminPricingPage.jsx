import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { formatBDT } from '@/lib/formatCurrency.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Edit, Settings } from 'lucide-react';

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPricing = async () => {
    try {
      const records = await pb.collection('pricing_config').getFullList({ sort: 'printAreaName', $autoCancel: false });
      setPricing(records);
    } catch (err) {
      toast.error("Failed to load pricing configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const openModal = (item) => {
    setEditingItem(item);
    setNewPrice(item.priceTaka.toString());
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!newPrice || isNaN(newPrice) || Number(newPrice) < 0) {
      return toast.error("Please enter a valid positive price");
    }
    setIsSubmitting(true);
    try {
      await pb.collection('pricing_config').update(editingItem.id, { priceTaka: Number(newPrice) }, { $autoCancel: false });
      toast.success("Price updated successfully");
      setModalOpen(false);
      fetchPricing();
    } catch (err) {
      toast.error("Failed to update price");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <Helmet><title>Pricing Configuration | Admin</title></Helmet>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage additional costs for print areas.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Print Area Costs</CardTitle>
          <CardDescription>These costs are added to the base product price during order placement.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Print Area Name</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={3}><Skeleton className="h-48 w-full" /></TableCell></TableRow> : 
                pricing.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.printAreaName}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatBDT(p.priceTaka)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openModal(p)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
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
            <DialogTitle>Edit Print Area Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Print Area</Label>
              <Input value={editingItem?.printAreaName || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>New Price (৳)</Label>
              <Input type="number" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
