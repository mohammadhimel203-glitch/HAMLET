import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { formatBDT } from '@/lib/formatCurrency.js';
import { calculateOrderCost } from '@/lib/calculateOrderCost.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function PlaceOrderPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [pricingConfig, setPricingConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    size: '',
    color: '',
    quantity: 1,
    printArea: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    sellingPrice: '',
    paymentType: 'cash'
  });
  const [designFile, setDesignFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, prices] = await Promise.all([
          pb.collection('products').getFullList({ filter: 'status="active"', $autoCancel: false }),
          pb.collection('pricing_config').getFullList({ $autoCancel: false })
        ]);
        setProducts(prods);
        setPricingConfig(prices);
      } catch (err) {
        toast.error("Failed to load catalog data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedProduct = products.find(p => p.id === formData.productId);
  const selectedPrintArea = pricingConfig.find(p => p.printAreaName === formData.printArea);

  const costs = calculateOrderCost(
    selectedProduct?.basePrice || 0,
    selectedPrintArea?.priceTaka || 0,
    formData.quantity,
    formData.sellingPrice
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDesignFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.size || !formData.color || !formData.printArea || !designFile) {
      return toast.error("Please fill all required product fields and upload a design.");
    }
    if (costs.profit < 0) {
      return toast.error("Selling price must be greater than total cost.");
    }

    setIsSubmitting(true);
    try {
      const brandProfile = await pb.collection('brand_owners').getFirstListItem(`userId="${currentUser.id}"`, { $autoCancel: false });

      const form = new FormData();
      form.append('brandOwnerId', brandProfile.id);
      form.append('productId', formData.productId);
      form.append('size', formData.size);
      form.append('color', formData.color);
      form.append('quantity', formData.quantity);
      form.append('printArea', formData.printArea);
      form.append('customerName', formData.customerName);
      form.append('customerPhone', formData.customerPhone);
      form.append('customerAddress', formData.customerAddress);
      form.append('sellingPrice', formData.sellingPrice);
      form.append('paymentType', formData.paymentType);
      form.append('baseCost', costs.baseCost);
      form.append('profit', costs.profit);
      form.append('status', 'pending');
      form.append('profitStatus', 'pending');

      const order = await pb.collection('orders').create(form, { $autoCancel: false });

      const designForm = new FormData();
      designForm.append('orderId', order.id);
      designForm.append('designFile', designFile);
      const designRec = await pb.collection('design_files').create(designForm, { $autoCancel: false });

      await pb.collection('orders').update(order.id, { designFileId: designRec.id }, { $autoCancel: false });

      toast.success("Order placed successfully!");
      navigate('/orders');
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-[600px] w-full" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Helmet><title>Place Order | Hamlet POD</title></Helmet>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Place New Order</h1>
        <p className="text-muted-foreground mt-1">Create a new fulfillment order for your customer.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Select Product</Label>
                <Select value={formData.productId} onValueChange={(v) => setFormData({...formData, productId: v, size: '', color: ''})}>
                  <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({formatBDT(p.basePrice)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <>
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={formData.size} onValueChange={(v) => setFormData({...formData, size: v})}>
                      <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent>
                        {selectedProduct.sizes?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Select value={formData.color} onValueChange={(v) => setFormData({...formData, color: v})}>
                      <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                      <SelectContent>
                        {selectedProduct.colors?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Print Area</Label>
                    <Select value={formData.printArea} onValueChange={(v) => setFormData({...formData, printArea: v})}>
                      <SelectTrigger><SelectValue placeholder="Select print area" /></SelectTrigger>
                      <SelectContent>
                        {pricingConfig.map(pa => (
                          <SelectItem key={pa.id} value={pa.printAreaName}>
                            {pa.printAreaName} (+{formatBDT(pa.priceTaka)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} required />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Design Upload</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center bg-muted/10 transition-colors hover:bg-muted/30">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-md shadow-sm" />
                    <Button type="button" variant="outline" onClick={() => { setDesignFile(null); setPreviewUrl(null); }}>Remove File</Button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                    <Label htmlFor="design-upload" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90">
                      Select PNG/JPG
                    </Label>
                    <Input id="design-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
                    <p className="mt-2 text-xs text-muted-foreground">High resolution with transparent background</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Customer & Payment</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Delivery Address</Label>
                <Textarea value={formData.customerAddress} onChange={e => setFormData({...formData, customerAddress: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (Total to collect)</Label>
                <Input type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash on Delivery</SelectItem>
                    <SelectItem value="online">Online Pre-paid</SelectItem>
                    <SelectItem value="wallet">Pay from Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product Base</span>
                <span>{formatBDT(selectedProduct?.basePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Print Cost</span>
                <span>{formatBDT(selectedPrintArea?.priceTaka)}</span>
              </div>
              <div className="flex justify-between text-sm border-b pb-4">
                <span className="text-muted-foreground">Quantity</span>
                <span>x{formData.quantity}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Base Cost</span>
                <span>{formatBDT(costs.baseCost)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span className="text-muted-foreground">Selling Price</span>
                <span>{formatBDT(formData.sellingPrice)}</span>
              </div>
              <div className="flex justify-between items-center rounded-lg bg-primary/10 p-4 mt-4 border border-primary/20">
                <span className="font-semibold text-primary">Your Profit</span>
                <span className="font-bold text-lg text-primary">{formatBDT(costs.profit > 0 ? costs.profit : 0)}</span>
              </div>

              <Button type="submit" size="lg" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
