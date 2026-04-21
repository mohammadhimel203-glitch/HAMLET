import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { formatBDT } from '@/lib/formatCurrency.js';
import { StatusBadge } from '@/components/StatusBadge.jsx';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Banknote, History } from 'lucide-react';

export default function WithdrawProfitPage() {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWalletAndTxs = async () => {
    try {
      const brandOwner = await pb.collection('brand_owners').getFirstListItem(`userId="${currentUser.id}"`, { $autoCancel: false });
      
      let w;
      try {
        w = await pb.collection('wallets').getFirstListItem(`brandOwnerId="${brandOwner.id}"`, { $autoCancel: false });
      } catch {
        w = { profitBalance: 0 };
      }
      setWallet(w);

      const txs = await pb.collection('transactions').getFullList({
        filter: `brandOwnerId="${brandOwner.id}" && type="withdraw"`,
        sort: '-created',
        $autoCancel: false
      });
      setTransactions(txs);
    } catch (err) {
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletAndTxs();
  }, [currentUser]);

  const withdrawSchema = z.object({
    amount: z.coerce.number().min(1, "Amount must be at least 1").max(wallet?.profitBalance || 0, "Amount exceeds available profit balance"),
    paymentMethod: z.string().min(1, "Please select a payment method"),
    accountDetails: z.string().min(5, "Please provide valid account details")
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: '', paymentMethod: '', accountDetails: '' }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const brandOwner = await pb.collection('brand_owners').getFirstListItem(`userId="${currentUser.id}"`, { $autoCancel: false });
      
      await pb.collection('transactions').create({
        brandOwnerId: brandOwner.id,
        type: 'withdraw',
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.accountDetails, // Storing account details here for simplicity
        status: 'pending'
      }, { $autoCancel: false });
      
      toast.success("Withdraw request submitted. Awaiting admin approval.");
      reset();
      fetchWalletAndTxs();
    } catch (err) {
      toast.error("Failed to submit withdraw request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const pendingTxs = transactions.filter(t => t.status === 'pending');
  const approvedTxs = transactions.filter(t => t.status === 'approved');
  const rejectedTxs = transactions.filter(t => t.status === 'rejected');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <Helmet><title>Withdraw Profit | Hamlet POD</title></Helmet>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Withdraw Profit</h1>
        <p className="text-muted-foreground mt-1">Request a payout from your available earnings.</p>
      </div>

      <Card className="border-emerald-500/20 shadow-sm">
        <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10">
          <CardTitle className="flex items-center gap-2 text-emerald-700"><Banknote className="h-5 w-5" /> Available Balance</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-4xl font-bold text-emerald-600 mb-6">{formatBDT(wallet?.profitBalance)}</div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (৳)</Label>
                <Input type="number" {...register("amount")} placeholder="0.00" className={errors.amount ? "border-destructive" : ""} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select onValueChange={(v) => setValue("paymentMethod", v)}>
                  <SelectTrigger className={errors.paymentMethod ? "border-destructive" : ""}><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Details</Label>
              <Textarea {...register("accountDetails")} placeholder="Enter your bank account number, bKash number, or Nagad number" className={errors.accountDetails ? "border-destructive" : ""} />
              {errors.accountDetails && <p className="text-sm text-destructive">{errors.accountDetails.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting || wallet?.profitBalance <= 0} className="w-full md:w-auto">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2"><History className="h-5 w-5" /> Withdrawal History</h2>
        
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Pending Requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {pendingTxs.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No pending requests</TableCell></TableRow> : 
                  pendingTxs.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.created).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{t.paymentMethod}</TableCell>
                      <TableCell className="font-medium">{formatBDT(t.amount)}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Approved Payouts</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {approvedTxs.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No approved payouts</TableCell></TableRow> : 
                  approvedTxs.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.updated).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{t.paymentMethod}</TableCell>
                      <TableCell className="font-medium text-emerald-600">{formatBDT(t.amount)}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
