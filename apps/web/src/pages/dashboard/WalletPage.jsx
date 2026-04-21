import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { formatBDT } from '@/lib/formatCurrency.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Banknote, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';

export default function WalletPage() {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const brandOwner = await pb.collection('brand_owners').getFirstListItem(`userId="${currentUser.id}"`, { $autoCancel: false });
        
        let w;
        try {
          w = await pb.collection('wallets').getFirstListItem(`brandOwnerId="${brandOwner.id}"`, { $autoCancel: false });
        } catch {
          w = { orderBalance: 0, profitBalance: 0 };
        }
        setWallet(w);

        const txs = await pb.collection('transactions').getList(1, 20, {
          filter: `brandOwnerId="${brandOwner.id}"`,
          sort: '-created',
          $autoCancel: false
        });
        setTransactions(txs.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, [currentUser]);

  const getTxIcon = (type) => {
    if (type === 'recharge' || type === 'profit_added') return <ArrowDownRight className="h-4 w-4 text-emerald-500" />;
    return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  if (loading) return <div className="p-4 space-y-6"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-2 gap-6"><Skeleton className="h-40" /><Skeleton className="h-40" /></div></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Helmet><title>Wallet & Finances | Hamlet POD</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet & Finances</h1>
        <p className="text-muted-foreground mt-1">Manage your balances and transaction history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Wallet className="h-5 w-5 text-primary" /> Order Balance</CardTitle>
            <CardDescription>Used to automatically pay for base costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-6">{formatBDT(wallet?.orderBalance)}</div>
            <Button className="w-full sm:w-auto" asChild>
              <Link to="/recharge">Recharge Balance</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Banknote className="h-5 w-5 text-emerald-600" /> Profit Balance</CardTitle>
            <CardDescription>Available earnings to withdraw</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-600 mb-6">{formatBDT(wallet?.profitBalance)}</div>
            <Button variant="outline" className="w-full sm:w-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50" asChild>
              <Link to="/withdraw">Withdraw Profit</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transactions found.</TableCell></TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 capitalize">
                        {getTxIcon(tx.type)}
                        <span className="font-medium">{tx.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{tx.paymentMethod?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'approved' ? 'default' : tx.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={tx.type === 'recharge' || tx.type === 'profit_added' ? 'text-emerald-600' : ''}>
                        {tx.type === 'recharge' || tx.type === 'profit_added' ? '+' : '-'}{formatBDT(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(tx.created).toLocaleDateString()}
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
