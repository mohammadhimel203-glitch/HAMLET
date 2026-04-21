import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatBDT } from '@/lib/formatCurrency.js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Banknote, ShoppingBag, Users, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiServerClient.fetch('/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Helmet><title>Admin Dashboard | Hamlet POD</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">High-level financial and operational metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBDT(stats?.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposits</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBDT(stats?.totalDeposits)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit Paid</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBDT(stats?.totalProfitPaid)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{formatBDT(stats?.pendingWithdrawals)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats?.pendingApprovals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Brand owners awaiting review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
