import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, LayoutDashboard, ShoppingBag, PlusCircle, Wallet, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const DashboardLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Place Order', path: '/dashboard/place-order', icon: PlusCircle },
    { name: 'My Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Wallet & Finances', path: '/dashboard/wallet', icon: Wallet },
    { name: 'Profile Settings', path: '/dashboard/profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Package className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg">Hamlet POD</span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
