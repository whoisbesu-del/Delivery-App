import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BottomNav from './components/BottomNav.jsx';

import Setup from './pages/Setup.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Account from './pages/Account.jsx';

import CustomerHome from './pages/customer/Home.jsx';
import Search from './pages/customer/Search.jsx';
import StoreMenu from './pages/customer/StoreMenu.jsx';
import Cart from './pages/customer/Cart.jsx';
import OrderTracking from './pages/customer/OrderTracking.jsx';
import OrderHistory from './pages/customer/OrderHistory.jsx';
import PaymentPage from './pages/customer/PaymentPage.jsx';

import SellerDashboard from './pages/seller/SellerDashboard.jsx';
import ApplyStore from './pages/seller/ApplyStore.jsx';
import ManageProducts from './pages/seller/ManageProducts.jsx';
import SellerOrders from './pages/seller/SellerOrders.jsx';
import EditStore from './pages/seller/EditStore.jsx';

import AvailableDeliveries from './pages/driver/AvailableDeliveries.jsx';
import ActiveDelivery from './pages/driver/ActiveDelivery.jsx';
import Earnings from './pages/driver/Earnings.jsx';

import Dashboard from './pages/admin/Dashboard.jsx';
import AllOrders from './pages/admin/AllOrders.jsx';
import Approvals from './pages/admin/Approvals.jsx';
import PaymentSettings from './pages/admin/PaymentSettings.jsx';

import ChatList from './pages/chat/ChatList.jsx';
import ChatRoom from './pages/chat/ChatRoom.jsx';

function Layout() {
  return (
    <div className="min-h-screen bg-base">
      <Outlet />
      <BottomNav />
    </div>
  );
}

function RoleRedirect() {
  const { user, loading, requiresVerification } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requiresVerification) return <Navigate to="/verify-email" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-8 h-8 rounded-full border-2 border-green spin" style={{ borderTopColor: 'transparent' }} />
    </div>
  );
}

export default function App() {
  const [adminExists, setAdminExists] = useState(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/setup-status')
      .then(r => r.json())
      .then(d => setAdminExists(d.adminExists))
      .catch(() => setAdminExists(true));
  }, []);

  if (adminExists === null) return <Spinner />;

  if (!adminExists) {
    return <Routes><Route path="*" element={<Setup />} /></Routes>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route element={<Layout />}>
        <Route path="/" element={<RoleRedirect />} />

        <Route path="/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />

        <Route path="/customer" element={<ProtectedRoute role="customer"><CartProvider><Outlet /></CartProvider></ProtectedRoute>}>
          <Route index element={<CustomerHome />} />
          <Route path="search" element={<Search />} />
          <Route path="store/:id" element={<StoreMenu />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="orders/:id" element={<OrderTracking />} />
          <Route path="pay/:orderId" element={<PaymentPage />} />
          <Route path="account" element={<Account />} />
        </Route>

        <Route path="/seller" element={<ProtectedRoute role="seller"><Outlet /></ProtectedRoute>}>
          <Route index element={<SellerDashboard />} />
          <Route path="apply" element={<ApplyStore />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="store" element={<EditStore />} />
          <Route path="account" element={<Account />} />
        </Route>

        <Route path="/driver" element={<ProtectedRoute role="driver"><Outlet /></ProtectedRoute>}>
          <Route index element={<AvailableDeliveries />} />
          <Route path="active" element={<ActiveDelivery />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="account" element={<Account />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute role="admin"><Outlet /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="orders" element={<AllOrders />} />
          <Route path="payments" element={<PaymentSettings />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
