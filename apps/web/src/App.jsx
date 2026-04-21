import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from './components/ScrollToTop.jsx';

import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';

import { DashboardLayout } from './components/layouts/DashboardLayout.jsx';
import BrandOwnerDashboard from './pages/dashboard/BrandOwnerDashboard.jsx';
import PlaceOrderPage from './pages/dashboard/PlaceOrderPage.jsx';
import ViewOrdersPage from './pages/dashboard/ViewOrdersPage.jsx';
import OrderDetailsPage from './pages/dashboard/OrderDetailsPage.jsx';
import WalletPage from './pages/dashboard/WalletPage.jsx';
import RechargeWalletPage from './pages/dashboard/RechargeWalletPage.jsx';
import WithdrawProfitPage from './pages/dashboard/WithdrawProfitPage.jsx';

import { AdminLayout } from './components/layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminBrandOwnersPage from './pages/admin/AdminBrandOwnersPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminDepositsPage from './pages/admin/AdminDepositsPage.jsx';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminPricingPage from './pages/admin/AdminPricingPage.jsx';
import AdminReturnsPage from './pages/admin/AdminReturnsPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />

          {/* Brand Owner Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<BrandOwnerDashboard />} />
            <Route path="place-order" element={<PlaceOrderPage />} />
            <Route path="orders" element={<ViewOrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="recharge" element={<RechargeWalletPage />} />
            <Route path="withdraw" element={<WithdrawProfitPage />} />
            <Route path="profile" element={<div>Profile Settings (Coming Soon)</div>} />
          </Route>

          {/* Super Admin Protected Routes */}
          <Route element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-brand-owners" element={<AdminBrandOwnersPage />} />
            <Route path="/admin-orders" element={<AdminOrdersPage />} />
            <Route path="/admin-deposits" element={<AdminDepositsPage />} />
            <Route path="/admin-withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="/admin-products" element={<AdminProductsPage />} />
            <Route path="/admin-pricing" element={<AdminPricingPage />} />
            <Route path="/admin-returns" element={<AdminReturnsPage />} />
            <Route path="/admin-reports" element={<AdminReportsPage />} />
          </Route>

          {/* Redirect old admin path to new one to prevent breaking */}
          <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
