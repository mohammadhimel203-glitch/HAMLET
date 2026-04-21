import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Wallet, TrendingUp, ArrowRight, PlusCircle, CreditCard, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BrandOwnerDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const brandOwner = await pb.collection('brand_owners').getFirstListItem(`userId="${currentUser.id}"`, { $autoCancel: false });
        
        let wallet;
        try {
          wallet = await pb.collection('wallets').getFirstListItem(`brandOwnerId="${brandOwner.id}"`, { $autoCancel: false });
        } catch (e) {
          wallet = { orderBalance: 0, profitBalance: 0 };
        }

        const orders = await pb.collection('orders').getList(1, 5, {
          filter: `brandOwnerId="${brandOwner.id}"`,
          sort: '-created',
          expand: 'productId',
          $autoCancel: false
        });

        // Calculate pending profit from orders
        const pendingOrders = await pb.collection('orders').getFullList({
          filter: `brandOwnerId="${brandOwner.id}" && profitStatus="pending"`,
          $autoCancel: false
        });
        const pendingProfit = pendingOrders.reduce((sum, order) => sum + order.profit, 0);

        setStats({
          totalOrders: orders.totalItems,
          orderBalance: wallet.orderBalance,
          profitBalance: wallet.profitBalance,
          pendingProfit: pendingProfit
        });
        setRecentOrders(orders.items);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const formatBDT = (amount) => {
    return new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      approved: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      printing: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      shipped: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
      delivered: "bg-green-100 text-green-800 hover:bg-green-100",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
      returned: "bg-orange-100 text-orange-800 hover:bg-orange-100"
    };
    return <Badge className={`${styles[status] || 'bg-gray-100 text-gray-800'} capitalize border-none shadow-none`}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-8 space-y-6"><Skeleton className="h-12 w-64" /><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Helmet>
        <title>Dashboard | Hamlet POD</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {currentUser?.name}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your brand today.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="rounded-full">
            <Link to="/dashboard/place-order"><PlusCircle className="mr-2 h-4 w-4" /> Place Order</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBDT(stats?.orderBalance)}</div>
            <Button variant="link" className="px-0 h-auto text-xs mt-2 text-primary" asChild>
              <Link to="/dashboard/wallet">Recharge Wallet <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{formatBDT(stats?.profitBalance)}</div>
            <Button variant="link" className="px-0 h-auto text-xs mt-2 text-secondary" asChild>
              <Link to="/dashboard/wallet">Withdraw Funds <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{formatBDT(stats?.pendingProfit)}</div>
            <p className="text-xs text-muted-foreground mt-2">Unlocks on delivery</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No orders yet. Place your first order!</TableCell></TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0,8)}</TableCell>
                    <TableCell className="font-medium">{order.expand?.productId?.name || 'Unknown'}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right font-medium text-secondary">{formatBDT(order.profit)}</TableCell>
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
