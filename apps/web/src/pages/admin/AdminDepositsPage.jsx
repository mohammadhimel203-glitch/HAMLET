import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatBDT } from '@/lib/formatCurrency.js';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function AdminDepositsPage() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTxs = async () => {
    try {
      const records = await pb.collection('transactions').getFullList({
        filter: 'type="recharge"',
        sort: '-created',
        expand: 'brandOwnerId',
        $autoCancel: false
      });
      setTxs(records);
    } catch (err) {
      toast.error("Failed to load deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await apiServerClient.fetch(`/transactions/${id}/${action}`, { method: 'PATCH' });
      toast.success(`Transaction ${action}d successfully`);
      fetchTxs();
    } catch (err) {
      toast.error(`Failed to ${action} transaction`);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Manage Deposits | Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deposit Requests</h1>
        <p className="text-muted-foreground mt-1">Review and approve brand owner wallet recharges.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Brand Owner</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method & TxID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
              ) : txs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No deposits found.</TableCell></TableRow>
              ) : (
                txs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.created).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{t.expand?.brandOwnerId?.brandName}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{formatBDT(t.amount)}</TableCell>
                    <TableCell>
                      <div className="capitalize text-sm font-medium">{t.paymentMethod}</div>
                      <div className="text-xs text-muted-foreground">{t.transactionId || 'No TxID'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'approved' ? 'default' : t.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {t.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleAction(t.id, 'approve')}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleAction(t.id, 'reject')}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
