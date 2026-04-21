import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Palette, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Hamlet POD | Premium Print on Demand</title>
      </Helmet>

      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl font-heading">Hamlet POD</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <Link to="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link to="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Scale your brand with premium print on demand.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Automated fulfillment, live design previews, and instant profit payouts. Focus on growing your brand while we handle the printing and shipping.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-8" asChild>
                  <Link to="/signup">Start Selling <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                  <Link to="/admin-login">Admin Portal</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border/50">
                <img 
                  src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?q=80&w=1600&auto=format&fit=crop" 
                  alt="Premium apparel printing process" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
              <p className="text-muted-foreground text-lg">Powerful tools designed specifically for modern apparel brands.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="md:col-span-2 bg-card rounded-3xl p-8 shadow-sm border">
                <Palette className="h-10 w-10 text-primary mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Live Design Preview</h3>
                <p className="text-muted-foreground">Upload your artwork and instantly see how it looks on our premium blanks. Adjust placement, scale, and colors in real-time before placing an order.</p>
              </div>
              <div className="bg-card rounded-3xl p-8 shadow-sm border">
                <Wallet className="h-10 w-10 text-secondary mb-6" />
                <h3 className="text-xl font-semibold mb-3">Smart Wallet</h3>
                <p className="text-muted-foreground">Manage your order balance and withdraw profits instantly when orders are delivered.</p>
              </div>
              <div className="bg-card rounded-3xl p-8 shadow-sm border">
                <Package className="h-10 w-10 text-primary mb-6" />
                <h3 className="text-xl font-semibold mb-3">Auto Pricing</h3>
                <p className="text-muted-foreground">Dynamic cost calculation based on product, size, and print area.</p>
              </div>
              <div className="md:col-span-2 bg-card rounded-3xl p-8 shadow-sm border">
                <ShieldCheck className="h-10 w-10 text-primary mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Admin Control</h3>
                <p className="text-muted-foreground">Complete oversight of the fulfillment process. Track orders from pending to delivered with full transparency and automated status updates.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-950 text-zinc-400 py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4 text-zinc-100">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl font-heading">Hamlet POD</span>
            </div>
            <p className="max-w-sm">Premium print on demand fulfillment for growing apparel brands in Bangladesh.</p>
          </div>
          <div>
            <p className="font-semibold text-zinc-100 mb-4">Platform</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Brand Login</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Register Brand</Link></li>
              <li><Link to="/admin-login" className="hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-zinc-100 mb-4">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-zinc-900 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Hamlet POD. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
