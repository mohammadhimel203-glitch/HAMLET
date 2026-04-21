import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Users, Package, ShoppingCart, Banknote, ShieldAlert, 
  LogOut, FileText, Settings, ArrowDownToLine, ArrowUpFromLine, RefreshCcw 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: ShieldAlert },
    { name: 'Brand Owners', path: '/admin-brand-owners', icon: Users },
    { name: 'Products', path: '/admin-products', icon: Package },
    { name: 'Orders', path: '/admin-orders', icon: ShoppingCart },
    { name: 'Pricing', path: '/admin-pricing', icon: Settings },
    { name: 'Deposits', path: '/admin-deposits', icon: ArrowDownToLine },
    { name: 'Withdrawals', path: '/admin-withdrawals', icon: ArrowUpFromLine },
    { name: 'Returns', path: '/admin-returns', icon: RefreshCcw },
    { name: 'Reports', path: '/admin-reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-zinc-950 text-zinc-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <ShieldAlert className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg text-white">Hamlet Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-zinc-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
