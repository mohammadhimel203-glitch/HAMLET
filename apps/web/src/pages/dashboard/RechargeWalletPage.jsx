import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud } from 'lucide-react';

export default function RechargeWalletPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '',
    transactionId: ''
  });
  const [screenshot, setScreenshot] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.paymentMethod || !screenshot) {
      return toast.error("Please fill all required fields and upload a screenshot.");
    }

    setIsSubmitting(true);
    try {
      const brandOwner = await pb.collection('brand_owners').getFirstListItem(`userId="${currentUser.id}"`, { $autoCancel: false });
      
      const form = new FormData();
      form.append('brandOwnerId', brandOwner.id);
      form.append('type', 'recharge');
      form.append('amount', formData.amount);
      form.append('paymentMethod', formData.paymentMethod);
      form.append('transactionId', formData.transactionId);
      form.append('status', 'pending');
      form.append('screenshot', screenshot);

      await pb.collection('transactions').create(form, { $autoCancel: false });
      
      toast.success("Recharge request submitted. Awaiting admin approval.");
      navigate('/wallet');
    } catch (err) {
      toast.error("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Helmet><title>Recharge Wallet | Hamlet POD</title></Helmet>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recharge Order Balance</h1>
        <p className="text-muted-foreground mt-1">Add funds to automatically process your orders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recharge Details</CardTitle>
          <CardDescription>Send money to our official numbers and upload the screenshot here.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (৳)</Label>
              <Input type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v})}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction ID / Reference (Optional)</Label>
              <Input value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} />
            </div>
            <div className="space-y-2 pt-2">
              <Label>Payment Screenshot</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/10">
                <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <Input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files[0])} className="max-w-xs mx-auto text-sm" required />
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
