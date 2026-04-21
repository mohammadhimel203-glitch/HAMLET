import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext.jsx';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLoginPage() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await loginAdmin(data.email, data.password);
      toast.success("Admin login successful");
      navigate('/admin');
    } catch (error) {
      toast.error(error.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Helmet>
        <title>Admin Login | Hamlet POD</title>
      </Helmet>
      
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
                <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-semibold">System Administration</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Admin Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  {...register("email")}
                  className={`bg-zinc-800 border-zinc-700 text-white ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  {...register("password")}
                  className={`bg-zinc-800 border-zinc-700 text-white ${errors.password ? "border-destructive" : ""}`}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Authenticate
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
