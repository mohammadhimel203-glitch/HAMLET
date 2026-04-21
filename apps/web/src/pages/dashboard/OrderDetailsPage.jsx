import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { formatBDT } from '@/lib/formatCurrency.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, User, Package, CreditCard, Image as ImageIcon } from 'lucide-react';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const record = await pb.collection('orders').getOne(orderId, {
          expand: 'productId,designFileId',
          $autoCancel: false
        });
        setOrder(record);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="space-y-6 max-w-5xl mx-auto p-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!order) {
    return <div className="text-center py-12">Order not found.</div>;
  }

  const designUrl = order.expand?.designFileId ? pb.files.getUrl(order.expand.designFileId, order.expand.designFileId.designFile) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Helmet><title>Order Details | Hamlet POD</title></Helmet>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order #{order.id.slice(0,8)}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.created).toLocaleString()}</p>
        </div>
        <Badge className="ml-auto capitalize text-sm px-3 py-1 bg-primary text-primary-foreground">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" /> Product Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{order.expand?.productId?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Print Area</p>
                <p className="font-medium">{order.printArea}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Variant</p>
                <p className="font-medium">{order.size} • {order.color}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium">{order.quantity}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-muted-foreground" /> Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivery Address</p>
                <p className="font-medium mt-1 p-3 bg-muted/30 rounded-md">{order.customerAddress}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-muted-foreground" /> Design Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {designUrl ? (
                <div className="bg-muted/20 p-4 rounded-lg flex justify-center border border-dashed">
                  <img src={designUrl} alt="Design file" className="max-h-64 object-contain rounded-md" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No design file uploaded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-muted-foreground" /> Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Cost</span>
                <span>{formatBDT(order.baseCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selling Price</span>
                <span>{formatBDT(order.sellingPrice)}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Profit</span>
                  <span className="font-bold text-lg text-primary">{formatBDT(order.profit)}</span>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Profit Status</p>
                <Badge variant={order.profitStatus === 'credited' ? 'default' : 'secondary'} className="capitalize">
                  {order.profitStatus}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                <Badge variant="outline" className="capitalize">{order.paymentType}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
