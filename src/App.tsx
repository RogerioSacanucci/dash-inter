import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { queryClient } from './lib/queryClient';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CartpandaOrders from './pages/CartpandaOrders';
import Settings from './pages/Settings';
import Links from './pages/Links';
import LinkEditor from './pages/LinkEditor';
import CartpandaShops from './pages/admin/CartpandaShops';
import CartpandaShopDetail from './pages/admin/CartpandaShopDetail';
import WebhookLogs from './pages/admin/WebhookLogs';
import EmailService from './pages/admin/EmailService';
import CheckoutChangeRequests from './pages/admin/CheckoutChangeRequests';
import Payouts from './pages/Payouts';
import CheckoutPreview from './pages/CheckoutPreview';
import Layout from './components/Layout';

const LOADER_EXIT_MS = 300;

function BrandedLoader({ exiting }: { exiting: boolean }) {
  return (
    <div
      className="min-h-screen bg-canvas flex items-center justify-center transition-opacity"
      style={{ transitionDuration: `${LOADER_EXIT_MS}ms`, opacity: exiting ? 0 : 1 }}
    >
      <img src="/logo.png" alt="" aria-hidden="true" className="h-10 w-auto animate-fade-in" />
    </div>
  );
}

function useLoader(loading: boolean) {
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!loading && !gone) {
      setExiting(true);
      const t = setTimeout(() => setGone(true), LOADER_EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [loading]);

  return { showLoader: !gone || loading, exiting };
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { showLoader, exiting } = useLoader(loading);

  if (showLoader) return <BrandedLoader exiting={exiting} />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { showLoader, exiting } = useLoader(loading);

  if (showLoader) return <BrandedLoader exiting={exiting} />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="internacional-orders" element={<CartpandaOrders />} />
          <Route path="settings" element={<Settings />} />
          <Route path="links" element={<Links />} />
          <Route path="admin/internacional-shops" element={<AdminGuard><CartpandaShops /></AdminGuard>} />
          <Route path="admin/internacional-shops/:id" element={<AdminGuard><CartpandaShopDetail /></AdminGuard>} />
          <Route path="admin/webhook-logs" element={<AdminGuard><WebhookLogs /></AdminGuard>} />
          <Route path="admin/email-service" element={<AdminGuard><EmailService /></AdminGuard>} />
          <Route path="admin/checkout-requests" element={<AdminGuard><CheckoutChangeRequests /></AdminGuard>} />
          <Route path="saques" element={<Payouts />} />
          <Route path="checkout" element={<CheckoutPreview />} />
        </Route>
        <Route
          path="/links/:id/edit"
          element={
            <AuthGuard>
              <LinkEditor />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
