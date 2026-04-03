import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Layout from './components/Layout';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-canvas text-white/20">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
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
  );
}
