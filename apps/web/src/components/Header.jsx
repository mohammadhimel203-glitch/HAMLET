import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Package } from 'lucide-react';

export const Header = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isNavActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">Hamlet POD</span>
          </Link>
          <nav className="hidden md:flex items-center ml-6 space-x-6 text-sm font-medium">
            <Link to="/" className={`transition-colors hover:text-foreground/80 ${isNavActive('/') ? 'text-foreground' : 'text-foreground/60'}`}>Home</Link>
            <Link to="/#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
            <Link to="/#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-sm font-medium hover:underline underline-offset-4">Login</Link>
              <Button asChild className="rounded-full px-6">
                <Link to="/signup">Register</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to={isAdmin ? "/admin" : "/dashboard"}>Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
