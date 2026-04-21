import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Package } from 'lucide-react';

import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext.jsx';

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  brandName: z.string().min(2, "Brand name is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  address: z.string().min(5, "Address is required"),
});

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    // Step 1: Pre-validate if email already exists
    try {
      const existingUsers = await pb.collection('users').getList(1, 1, {
        filter: `email="${data.email}"`,
        $autoCancel: false
      });

      if (existingUsers.totalItems > 0) {
        toast.error("Email already registered");
        setError("email", { type: "manual", message: "Email already registered" });
        setIsLoading(false);
        return; // Prevent form submission
      }
    } catch (checkError) {
      console.error("Pre-validation check error:", checkError);
      // Handle network issue where the client cannot reach the server at all
      if (checkError.status === 0) {
        toast.error("Network error. Please check your internet connection and try again.");
        setIsLoading(false);
        return;
      }
      // Note: If this fails with 403 Forbidden due to list rules, we'll silently 
      // catch it here and let the backend's unique constraint handle it during `signup`
    }

    // Step 2: Attempt signup
    try {
      await signup(data);
      toast.success("Registration successful! Your account is pending approval.");
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
      if (error.message.includes('already registered')) {
        setError("email", { type: "manual", message: "Email already registered" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <Helmet>
        <title>Register Brand | Hamlet POD</title>
      </Helmet>
      
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl tracking-tight">Hamlet POD</span>
          </Link>
        </div>
        
        <Card className="shadow-lg border-none">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold">Register as Brand Owner</CardTitle>
            <CardDescription>Fill in your details to apply for an account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" {...register("fullName")} className={errors.fullName ? "border-destructive" : ""} disabled={isLoading} />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input id="brandName" {...register("brandName")} className={errors.brandName ? "border-destructive" : ""} disabled={isLoading} />
                  {errors.brandName && <p className="text-sm text-destructive">{errors.brandName.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} className={errors.email ? "border-destructive" : ""} disabled={isLoading} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" {...register("mobile")} className={errors.mobile ? "border-destructive" : ""} disabled={isLoading} />
                  {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} className={errors.password ? "border-destructive" : ""} disabled={isLoading} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} className={errors.address ? "border-destructive" : ""} disabled={isLoading} />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Application
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
