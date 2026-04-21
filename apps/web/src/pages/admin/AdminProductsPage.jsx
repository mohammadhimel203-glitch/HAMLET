import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { formatBDT } from '@/lib/formatCurrency.js';
import { StatusBadge } from '@/components/StatusBadge.jsx';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Standard'];
const AVAILABLE_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Navy', 'Gray', 'Beige', 'Orange', 'Purple'];

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  basePrice: z.coerce.number().min(0, "Price must be positive"),
  sizes: z.array(z.string()).min(1, "Select at least one size"),
  colors: z.array(z.string()).min(1, "Select at least one color"),
  status: z.boolean()
});

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', basePrice: 0, sizes: [], colors: [], status: true }
  });

  const fetchProducts = async () => {
    try {
      const records = await pb.collection('products').getFullList({ sort: '-created', $autoCancel: false });
      setProducts(records);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    setEditingProduct(product);
    setImageFile(null);
    if (product) {
      reset({
        name: product.name,
        basePrice: product.basePrice,
        sizes: product.sizes || [],
        colors: product.colors || [],
        status: product.status === 'active'
      });
    } else {
      reset({ name: '', basePrice: 0, sizes: [], colors: [], status: true });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('basePrice', data.basePrice);
      formData.append('sizes', JSON.stringify(data.sizes));
      formData.append('colors', JSON.stringify(data.colors));
      formData.append('status', data.status ? 'active' : 'inactive');
      if (imageFile) formData.append('mockupImage', imageFile);

      if (editingProduct) {
        await pb.collection('products').update(editingProduct.id, formData, { $autoCancel: false });
        toast.success("Product updated successfully");
      } else {
        await pb.collection('products').create(formData, { $autoCancel: false });
        toast.success("Product created successfully");
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await pb.collection('products').delete(id, { $autoCancel: false });
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const currentSizes = watch('sizes') || [];
  const currentColors = watch('colors') || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Helmet><title>Manage Products | Admin</title></Helmet>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog and base pricing.</p>
        </div>
        <Button onClick={() => openModal()}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Sizes</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7}><Skeleton className="h-32 w-full" /></TableCell></TableRow> : 
                products.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8">No products found.</TableCell></TableRow> :
                products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.mockupImage ? (
                        <img src={pb.files.getUrl(p, p.mockupImage)} alt={p.name} className="h-12 w-12 object-cover rounded-md border" />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{formatBDT(p.basePrice)}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{p.sizes?.join(', ')}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{p.colors?.join(', ')}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openModal(p)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input {...register("name")} className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Base Price (৳)</Label>
                <Input type="number" {...register("basePrice")} className={errors.basePrice ? "border-destructive" : ""} />
                {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mockup Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            </div>

            <div className="space-y-3">
              <Label>Available Sizes</Label>
              <div className="flex flex-wrap gap-4 p-4 border rounded-md bg-muted/10">
                {AVAILABLE_SIZES.map(size => (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`size-${size}`} 
                      checked={currentSizes.includes(size)}
                      onCheckedChange={(checked) => {
                        const newSizes = checked ? [...currentSizes, size] : currentSizes.filter(s => s !== size);
                        setValue('sizes', newSizes, { shouldValidate: true });
                      }}
                    />
                    <Label htmlFor={`size-${size}`} className="text-sm font-normal cursor-pointer">{size}</Label>
                  </div>
                ))}
              </div>
              {errors.sizes && <p className="text-xs text-destructive">{errors.sizes.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Available Colors</Label>
              <div className="flex flex-wrap gap-4 p-4 border rounded-md bg-muted/10">
                {AVAILABLE_COLORS.map(color => (
                  <div key={color} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`color-${color}`} 
                      checked={currentColors.includes(color)}
                      onCheckedChange={(checked) => {
                        const newColors = checked ? [...currentColors, color] : currentColors.filter(c => c !== color);
                        setValue('colors', newColors, { shouldValidate: true });
                      }}
                    />
                    <Label htmlFor={`color-${color}`} className="text-sm font-normal cursor-pointer">{color}</Label>
                  </div>
                ))}
              </div>
              {errors.colors && <p className="text-xs text-destructive">{errors.colors.message}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="status" 
                checked={watch('status')} 
                onCheckedChange={(v) => setValue('status', v)} 
              />
              <Label htmlFor="status">Active (Visible to Brand Owners)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
