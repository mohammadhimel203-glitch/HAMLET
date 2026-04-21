import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatBDT } from '@/lib/formatCurrency.js';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Banknote, ArrowDownToLine, ArrowUpFromLine, ShoppingBag } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#ff7300'];

export default function AdminReportsPage() {
  const [reports, setReports] = useState({ revenue: null, deposits: null, withdrawals: null, orders: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [revRes, depRes, withRes, ordRes] = await Promise.all([
          apiServerClient.fetch('/admin/reports/revenue'),
          apiServerClient.fetch('/admin/reports/deposits'),
          apiServerClient.fetch('/admin/reports/withdrawals'),
          apiServerClient.fetch('/admin/reports/orders')
        ]);
        
        setReports({
          revenue: await revRes.json(),
          deposits: await depRes.json(),
          withdrawals: await withRes.json(),
          orders: await ordRes.json()
        });
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-2 gap-6"><Skeleton className="h-64"/><Skeleton className="h-64"/></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto">
      <Helmet><title>Reports & Analytics | Admin</title></Helmet>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Comprehensive platform performance metrics.</p>
      </div>

      {/* Revenue Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-primary">{formatBDT(reports.revenue?.totalRevenue)}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-2xl font-bold">{formatBDT(reports.revenue?.averageOrderValue)}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{reports.revenue?.totalOrders}</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reports.revenue?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatBDT(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reports.orders?.byStatus || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="status" label>
                    {(reports.orders?.byStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Financial Flows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowDownToLine className="h-5 w-5 text-emerald-500" /> Financial Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Deposits (Recharges)</h3>
                <div className="flex justify-between items-center p-3 bg-emerald-50 text-emerald-900 rounded-md border border-emerald-100">
                  <span>Approved</span>
                  <span className="font-bold">{formatBDT(reports.deposits?.approvedDeposits)}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Withdrawals (Payouts)</h3>
                <div className="flex justify-between items-center p-3 bg-red-50 text-red-900 rounded-md border border-red-100">
                  <span>Approved</span>
                  <span className="font-bold">{formatBDT(reports.withdrawals?.approvedWithdrawals)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
