import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Twitter, Facebook, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">Hamlet POD</span>
          </Link>
          <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
            Empowering brands with high-quality print-on-demand fulfillment and seamless order management.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          <div className="flex flex-col space-y-3">
            <span className="font-semibold text-sm uppercase tracking-wider text-foreground">Company</span>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          
          <div className="flex flex-col space-y-3">
            <span className="font-semibold text-sm uppercase tracking-wider text-foreground">Connect</span>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">support@hamletpod.com</p>
          </div>
        </div>
      </div>
      <div className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Hamlet POD. All rights reserved.
      </div>
    </footer>
  );
};
