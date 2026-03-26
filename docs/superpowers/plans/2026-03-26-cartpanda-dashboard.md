# Cartpanda Dashboard Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cartpanda order visibility to the dashboard — grouped conditional sidebar nav, a platform toggle on the Dashboard page, and a new Cartpanda Orders page mirroring Transactions.

**Architecture:** Extend the API client with new types and endpoints, replace the static nav with conditional grouped nav driven by `user.cartpanda_param` / `user.payer_email`, add a `CartpandaOrders` page and `CartpandaOrderTable` component cloning the Transactions pattern, and add a platform toggle to `Dashboard.tsx`.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, React Router 6, existing `api` object in `src/api/client.ts`

---

## File Map

| Action | File | Change |
|---|---|---|
| Modify | `src/api/client.ts` | Add `cartpanda_param` to User type, add `CartpandaOrder` / `CartpandaOrdersResponse` / `CartpandaStatsResponse` types, add `cartpandaOrders` and `cartpandaStats` api methods |
| Modify | `src/components/Layout.tsx` | Replace static `NAV_LINKS` with conditional grouped nav (WayMB group, Cartpanda group) |
| Create | `src/components/CartpandaOrderTable.tsx` | Table for CartpandaOrder rows: ID Pedido, Valor ($), Evento badge, Status badge, Comprador, Data |
| Create | `src/pages/CartpandaOrders.tsx` | Orders page: filters (order ID, status, period, custom date, admin account selector), table, pagination |
| Modify | `src/App.tsx` | Add `<Route path="cartpanda-orders" element={<CartpandaOrders />} />` |
| Modify | `src/pages/Dashboard.tsx` | Add `activePlatform` state, platform toggle pill (only when user has both), Cartpanda stats fetch branch |

---

## Task 1: API Client — Types and New Endpoints

**Files:**
- Modify: `src/api/client.ts`

Context: `LoginResponse["user"]` currently lacks `cartpanda_param`. The backend `GET /api/auth/me` will return it once hub-laravel FRA-17 is done. We add the type now so Layout and Dashboard can read it without runtime errors. Two new endpoints: `GET /api/cartpanda-orders` (FRA-18) and `GET /api/cartpanda-stats` (new hub issue).

- [ ] **Step 1: Add `cartpanda_param` to the User type**

In `src/api/client.ts`, update `LoginResponse` (line 21):

```typescript
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    payer_email: string;
    cartpanda_param?: string | null;   // ← add
    pushcut_url?: string;
    pushcut_notify?: "all" | "created" | "paid";
    role?: string;
  };
}
```

- [ ] **Step 2: Add CartpandaOrder, CartpandaOrdersResponse, CartpandaStatsResponse types**

After the `StatsResponse` interface (after line 91), add:

```typescript
export interface CartpandaOrder {
  cartpanda_order_id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'DECLINED' | 'REFUNDED';
  event: string;
  payer_name: string | null;
  payer_email: string | null;
  created_at: string;
}

export interface CartpandaOrdersResponse {
  data: CartpandaOrder[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

export interface CartpandaStatsResponse {
  overview: {
    total_orders: number;
    completed: number;
    pending: number;
    failed: number;
    declined: number;
    refunded: number;
    total_volume: number;
  };
  chart: { date?: string; hour?: string; orders: number; volume: number }[];
  period: string;
  hourly: boolean;
}
```

- [ ] **Step 3: Add `cartpandaOrders` and `cartpandaStats` to the `api` object**

Inside the `api` object (after the `users` method, around line 120), add:

```typescript
  cartpandaOrders: (params: {
    page?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    order_id?: string;
    user_id?: string;
  } = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<CartpandaOrdersResponse>(`/api/cartpanda-orders?${qs}`);
  },

  cartpandaStats: (
    period: string = '30d',
    dateFrom?: string,
    dateTo?: string,
    userId?: string,
  ) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (userId) params.set('user_id', userId);
    return request<CartpandaStatsResponse>(`/api/cartpanda-stats?${params}`);
  },
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
npm run build 2>&1 | head -40
```

Expected: no type errors (may warn about missing pages we haven't created yet — that's fine after Task 5).

- [ ] **Step 5: Commit**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
git add src/api/client.ts
git commit -m "feat(api): add CartpandaOrder types and cartpandaOrders/cartpandaStats methods"
```

---

## Task 2: Layout — Grouped Conditional Navigation

**Files:**
- Modify: `src/components/Layout.tsx`

Context: Replace the static `NAV_LINKS` array and its `map()` render with a grouped structure. Visibility: WayMB group only when `!!user.payer_email || isAdmin`; Cartpanda group only when `!!user.cartpanda_param || isAdmin`. Dashboard and Configurações always visible. Group headers use `text-[9px] font-semibold uppercase tracking-widest text-white/25`. Nav items under groups have `pl-5` indent.

- [ ] **Step 1: Replace NAV_LINKS and nav render in Layout.tsx**

Replace the entire file content with:

```tsx
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
  </svg>
);

const TransactionsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 5h12M10 2l3 3-3 3M14 11H2M6 8l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1 1h2l1.5 7h7l1.5-5H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="13.5" r="1" fill="currentColor"/>
    <circle cx="11" cy="13.5" r="1" fill="currentColor"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function NavItem({ to, label, icon, end, onClick }: { to: string; label: string; icon: React.ReactNode; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
          isActive
            ? 'bg-white/[0.06] text-white border-2 border-brand'
            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border-2 border-transparent'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-white/25 select-none">
      {label}
    </p>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const hasWayMb = isAdmin || !!user?.payer_email;
  const hasCartpanda = isAdmin || !!user?.cartpanda_param;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-canvas">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Menu lateral"
        className={`fixed top-0 left-0 bottom-0 w-[220px] bg-surface-1 border-r border-white/[0.06] flex flex-col z-40 transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="px-5 h-16 flex items-center shrink-0">
          <span className="text-base font-bold tracking-tight text-white select-none">
            Stats<span className="text-brand">Checker</span>
          </span>
        </div>

        {/* Nav */}
        <nav aria-label="Navegação principal" className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
          <NavItem to="/" label="Dashboard" icon={<DashboardIcon />} end onClick={closeSidebar} />

          {hasWayMb && (
            <>
              <GroupHeader label="WayMB" />
              <div className="pl-2">
                <NavItem to="/transactions" label="Transações" icon={<TransactionsIcon />} onClick={closeSidebar} />
              </div>
            </>
          )}

          {hasCartpanda && (
            <>
              <GroupHeader label="Cartpanda" />
              <div className="pl-2">
                <NavItem to="/cartpanda-orders" label="Pedidos" icon={<CartIcon />} onClick={closeSidebar} />
              </div>
            </>
          )}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/[0.06] shrink-0">
          <NavItem to="/settings" label="Configurações" icon={<SettingsIcon />} onClick={closeSidebar} />
          <div className="mt-2 px-3">
            <p className="text-xs text-white/30 truncate mb-2">{user?.email}</p>
            <button
              onClick={handleLogout}
              aria-label="Terminar sessão"
              className="w-full text-left text-sm text-white/40 hover:text-white/70 px-0 py-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-14 px-4 bg-surface-1 border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={sidebarOpen}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand mr-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-base font-bold tracking-tight text-white select-none">
            Stats<span className="text-brand">Checker</span>
          </span>
        </div>

        <main className="flex-1 px-6 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the app starts without errors**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors relating to Layout.tsx

- [ ] **Step 3: Commit**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
git add src/components/Layout.tsx
git commit -m "feat(nav): grouped conditional sidebar (WayMB / Cartpanda)"
```

---

## Task 3: CartpandaOrderTable Component

**Files:**
- Create: `src/components/CartpandaOrderTable.tsx`

Context: Mirrors `TransactionTable.tsx` but with different columns: ID Pedido (monospace truncated), Valor ($ USD), Evento (indigo monospace badge), Status (colored badge), Comprador, Data. Adds REFUNDED status (purple) — not present in TransactionTable. No method column.

- [ ] **Step 1: Create `src/components/CartpandaOrderTable.tsx`**

```tsx
import { CartpandaOrder } from '../api/client';

const STATUS_CLASSES: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  PENDING:   'bg-amber-500/10  text-amber-400  ring-1 ring-amber-500/20',
  FAILED:    'bg-red-500/10    text-red-400    ring-1 ring-red-500/20',
  DECLINED:  'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  REFUNDED:  'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluído',
  PENDING:   'Pendente',
  FAILED:    'Falhado',
  DECLINED:  'Recusado',
  REFUNDED:  'Reembolsado',
};

interface Props {
  orders: CartpandaOrder[];
  loading: boolean;
}

export default function CartpandaOrderTable({ orders, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-white/20 text-sm">
        Carregando...
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex justify-center py-16 text-white/20 text-sm">
        Nenhum pedido encontrado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Lista de pedidos Cartpanda</caption>
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['ID Pedido', 'Valor', 'Evento', 'Status', 'Comprador', 'Data'].map((h) => (
              <th
                key={h}
                scope="col"
                className="text-left py-3 px-4 text-xs font-semibold text-white/30 uppercase tracking-widest"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {orders.map((order) => (
            <tr key={order.cartpanda_order_id} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-3.5 px-4 max-w-[140px]">
                <span
                  className="block truncate font-mono text-xs text-white/30"
                  title={order.cartpanda_order_id}
                  aria-label={`ID: ${order.cartpanda_order_id}`}
                >
                  {order.cartpanda_order_id}
                </span>
              </td>
              <td className="py-3.5 px-4 font-bold tabular-nums text-white">
                $&nbsp;{order.amount.toFixed(2).replace('.', ',')}
              </td>
              <td className="py-3.5 px-4">
                <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/20 px-2 py-0.5 rounded-md">
                  {order.event}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[order.status] ?? 'bg-white/5 text-white/30 ring-1 ring-white/10'}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </td>
              <td className="py-3.5 px-4 text-white/50">
                {order.payer_name ?? '—'}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="text-white/60 text-sm">
                  {new Date(order.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="text-xs text-white/30 mt-0.5">
                  {new Date(order.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
npm run build 2>&1 | grep -E "CartpandaOrder" | head -10
```

Expected: no errors referencing CartpandaOrderTable.tsx

- [ ] **Step 3: Commit**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
git add src/components/CartpandaOrderTable.tsx
git commit -m "feat(components): CartpandaOrderTable with REFUNDED status"
```

---

## Task 4: CartpandaOrders Page + App Route

**Files:**
- Create: `src/pages/CartpandaOrders.tsx`
- Modify: `src/App.tsx`

Context: Mirrors `Transactions.tsx` exactly. Differences: no method filter, status list includes REFUNDED instead of EXPIRED, filter label is "ID do pedido", calls `api.cartpandaOrders()`, uses `CartpandaOrderTable`. Same `periodToDates` helper, same pagination, same admin account selector, same `inputCls` styling, same `useCallback` pattern.

- [ ] **Step 1: Create `src/pages/CartpandaOrders.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { api, CartpandaOrder, CartpandaOrdersResponse, AdminUser } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import CartpandaOrderTable from '../components/CartpandaOrderTable';

const STATUSES = ['', 'PENDING', 'COMPLETED', 'FAILED', 'DECLINED', 'REFUNDED'];
const STATUS_LABELS: Record<string, string> = {
  '':        'Todos',
  PENDING:   'Pendente',
  COMPLETED: 'Concluído',
  FAILED:    'Falhado',
  DECLINED:  'Recusado',
  REFUNDED:  'Reembolsado',
};

const QUICK_PERIODS = [
  { label: 'Hoje',    value: 'today'     },
  { label: 'Ontem',   value: 'yesterday' },
  { label: '7 dias',  value: '7d'        },
  { label: '30 dias', value: '30d'       },
];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function periodToDates(value: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (value === 'today') {
    const s = toDateStr(today);
    return { from: s, to: s };
  }
  if (value === 'yesterday') {
    const y = new Date(today); y.setDate(y.getDate() - 1);
    const s = toDateStr(y);
    return { from: s, to: s };
  }
  if (value === '7d') {
    const f = new Date(today); f.setDate(f.getDate() - 6);
    return { from: toDateStr(f), to: toDateStr(today) };
  }
  if (value === '30d') {
    const f = new Date(today); f.setDate(f.getDate() - 29);
    return { from: toDateStr(f), to: toDateStr(today) };
  }
  return { from: '', to: '' };
}

export default function CartpandaOrders() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<CartpandaOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderId, setOrderId] = useState('');
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    document.title = 'Pedidos Cartpanda — StatsChecker';
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.users().then(({ users }) => setAccounts(users)).catch(() => {});
    }
  }, [isAdmin]);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string> = { page: String(page) };
    if (status) params.status = status;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (orderId.trim()) params.order_id = orderId.trim();
    if (isAdmin && selectedAccount) params.user_id = selectedAccount;

    api.cartpandaOrders(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, dateFrom, dateTo, orderId, page, isAdmin, selectedAccount]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function selectPeriod(value: string) {
    setPeriod(value);
    setShowCustom(false);
    const { from, to } = periodToDates(value);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  }

  function handleCustom() {
    setPeriod('custom');
    setShowCustom(true);
    setDateFrom('');
    setDateTo('');
  }

  function clearFilters() {
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setOrderId('');
    setSelectedAccount('');
    setPeriod('');
    setShowCustom(false);
    setPage(1);
  }

  const totalPages = data?.meta.pages ?? 1;
  const inputCls = "bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors";

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Pedidos Cartpanda</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {data ? `${data.meta.total} pedidos encontrados` : ''}
          </p>
        </div>

        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
          {isAdmin && accounts.length > 0 && (
            <select
              value={selectedAccount}
              onChange={(e) => { setSelectedAccount(e.target.value); setPage(1); }}
              aria-label="Conta"
              className={inputCls}
            >
              <option value="">Todas as contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.payer_name ? `${a.payer_name} (${a.email})` : a.email}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="ID do pedido..."
            aria-label="ID do pedido"
            className={`${inputCls} w-40 placeholder:text-white/20`}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <div className="flex bg-surface-1 border border-white/[0.06] rounded-lg p-1 gap-0.5">
            {QUICK_PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => selectPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                  period === p.value && !showCustom
                    ? 'bg-surface-2 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCustom}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                showCustom
                  ? 'bg-surface-2 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Personalizado
            </button>
          </div>

          {showCustom && (
            <>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Data inicial"
                className={inputCls}
              />
              <span className="text-white/30 text-sm">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Data final"
                className={inputCls}
              />
            </>
          )}

          {(status || period || orderId || selectedAccount) && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-white/40 hover:text-white/80 rounded-lg hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-surface-1 rounded-2xl border border-white/[0.06]">
        {error ? (
          <div className="p-6 text-sm text-red-400 flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <CartpandaOrderTable orders={data?.data ?? []} loading={loading} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <span className="text-xs text-white/30 tabular-nums">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Página anterior"
                    className="px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Próxima página"
                    className="px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the route in `src/App.tsx`**

Add the import after line 6:
```tsx
import CartpandaOrders from './pages/CartpandaOrders';
```

Add the route after the `settings` route (after line 31):
```tsx
          <Route path="cartpanda-orders" element={<CartpandaOrders />} />
```

The updated routes section will look like:
```tsx
        >
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="cartpanda-orders" element={<CartpandaOrders />} />
        </Route>
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
npm run build 2>&1 | tail -20
```

Expected: build succeeds, no TypeScript errors

- [ ] **Step 4: Commit**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
git add src/pages/CartpandaOrders.tsx src/App.tsx
git commit -m "feat(pages): CartpandaOrders page with filters, table and pagination"
```

---

## Task 5: Dashboard — Platform Toggle

**Files:**
- Modify: `src/pages/Dashboard.tsx`

Context: Add `activePlatform: 'waymb' | 'cartpanda'` state. Show the toggle pill **only when** `(hasWayMb || isAdmin) && (hasCartpanda || isAdmin)` — i.e., when the user has access to both. When WayMB is active, existing behavior is unchanged. When Cartpanda is active, fetch `api.cartpandaStats(period, dateFrom, dateTo, selectedUserId)` and render a custom stats card row (Volume $, Pedidos, Completos, Reembolsos, Chargebacks) + chart (mapping `orders` → `transactions` field to reuse `Chart.tsx`). The admin `selectedAccount` applies to both platforms. `hasWayMb` / `hasCartpanda` read from `user.payer_email` / `user.cartpanda_param` using the same logic as Layout.

- [ ] **Step 1: Replace `src/pages/Dashboard.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { api, StatsResponse, CartpandaStatsResponse, AdminUser } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import StatsCards from '../components/StatsCards';
import Chart from '../components/Chart';

const QUICK_PERIODS = [
  { label: 'Hoje',    value: 'today'     },
  { label: 'Ontem',   value: 'yesterday' },
  { label: '7 dias',  value: '7d'        },
  { label: '30 dias', value: '30d'       },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const hasWayMb = isAdmin || !!user?.payer_email;
  const hasCartpanda = isAdmin || !!user?.cartpanda_param;
  const showToggle = hasWayMb && hasCartpanda;

  const [activePlatform, setActivePlatform] = useState<'waymb' | 'cartpanda'>('waymb');

  const [period, setPeriod]         = useState('30d');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const [stats, setStats]                       = useState<StatsResponse | null>(null);
  const [cpStats, setCpStats]                   = useState<CartpandaStatsResponse | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);

  const [accounts, setAccounts]                 = useState<AdminUser[]>([]);
  const [selectedAccount, setSelectedAccount]   = useState<string>('');

  useEffect(() => {
    document.title = 'Dashboard — StatsChecker';
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.users().then(({ users }) => setAccounts(users)).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (period === 'custom' && (!dateFrom || !dateTo)) return;
    setLoading(true);
    setError(null);

    if (activePlatform === 'waymb') {
      api.stats(period, dateFrom || undefined, dateTo || undefined, selectedAccount ? Number(selectedAccount) : undefined)
        .then(setStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      api.cartpandaStats(period, dateFrom || undefined, dateTo || undefined, selectedAccount || undefined)
        .then(setCpStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [activePlatform, period, dateFrom, dateTo, selectedAccount]);

  function selectPeriod(value: string) {
    setPeriod(value);
    setShowCustom(false);
    setDateFrom('');
    setDateTo('');
  }

  function handleCustom() {
    setShowCustom(true);
    setPeriod('custom');
  }

  function retry() {
    setError(null);
    setLoading(true);
    if (activePlatform === 'waymb') {
      api.stats(period, dateFrom || undefined, dateTo || undefined, selectedAccount ? Number(selectedAccount) : undefined)
        .then(setStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      api.cartpandaStats(period, dateFrom || undefined, dateTo || undefined, selectedAccount || undefined)
        .then(setCpStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }

  const ov = stats?.overview;
  const cpOv = cpStats?.overview;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {isAdmin
              ? selectedAccount
                ? `Conta: ${accounts.find((a) => String(a.id) === selectedAccount)?.email ?? ''}`
                : 'Visão geral de todas as contas'
              : 'Visão geral dos seus pagamentos'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin account selector */}
          {isAdmin && accounts.length > 0 && (
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
            >
              <option value="">Todas as contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.payer_name ? `${a.payer_name} (${a.email})` : a.email}
                </option>
              ))}
            </select>
          )}

          {/* Platform toggle — only when user has both */}
          {showToggle && (
            <div className="flex bg-surface-1 border border-white/[0.06] rounded-lg p-1 gap-0.5">
              <button
                type="button"
                onClick={() => setActivePlatform('waymb')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                  activePlatform === 'waymb'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                ⇄ WayMB
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform('cartpanda')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                  activePlatform === 'cartpanda'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                🛒 Cartpanda
              </button>
            </div>
          )}

          {/* Period selector */}
          <div className="flex bg-surface-1 border border-white/[0.06] rounded-lg p-1 gap-0.5">
            {QUICK_PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => selectPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                  period === p.value && !showCustom
                    ? 'bg-surface-2 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCustom}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                showCustom
                  ? 'bg-surface-2 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Personalizado
            </button>
          </div>

          {showCustom && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/50 transition-colors"
              />
              <span className="text-white/30 text-sm">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/50 transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            onClick={retry}
            className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-white/20 text-sm">Carregando...</div>
      ) : activePlatform === 'waymb' && stats ? (
        <>
          <StatsCards overview={stats.overview} />

          {/* Conversion card */}
          {ov && stats.conversions.length > 0 && (
            <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">Análise de Conversão</h2>
                <span className={`text-xs font-semibold tabular-nums ${ov.declined_rate > 10 ? 'text-red-400' : 'text-white/30'}`}>
                  {ov.declined_rate.toFixed(1)}% recusados ({ov.declined})
                </span>
              </div>

              <table className="w-full text-sm">
                <caption className="sr-only">Análise de conversão por valor</caption>
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {[
                      { label: 'Valor',     cls: 'text-left'   },
                      { label: 'Gerados',   cls: 'text-center' },
                      { label: 'Pagos',     cls: 'text-center' },
                      { label: 'Conversão', cls: 'text-right'  },
                    ].map(({ label, cls }) => (
                      <th key={label} scope="col" className={`px-3 pb-3 text-xs font-semibold uppercase tracking-widest text-white/30 ${cls}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {stats.conversions.map((row) => (
                    <tr key={row.amount}>
                      <td className="px-3 py-3.5 font-bold text-white tabular-nums">
                        €&nbsp;{row.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-3 py-3.5 text-center text-white/40 tabular-nums">{row.generated}</td>
                      <td className="px-3 py-3.5 text-center text-white/40 tabular-nums">{row.paid}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden" aria-hidden="true">
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${Math.min(row.conversion, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-white/80 w-12 text-right tabular-nums">
                            {row.conversion.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Volume chart */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {stats.hourly ? 'Transações por Hora' : 'Volume de Pagamentos'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-brand inline-block rounded" />
                  Volume (€)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0 inline-block border-t-2 border-dashed border-indigo-400" />
                  Transações
                </span>
              </div>
            </div>
            <Chart data={stats.chart} hourly={stats.hourly} />
          </div>

          {/* Method breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.methods.map((m) => (
              <div key={m.method} className="bg-surface-1 rounded-2xl border border-white/[0.06] p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
                  {m.method === 'mbway' ? 'MB WAY' : 'Multibanco'}
                </p>
                <p className="text-2xl font-bold text-white tabular-nums">
                  €&nbsp;{m.volume.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-white/30 mt-1">{m.count} transações</p>
              </div>
            ))}
          </div>
        </>
      ) : activePlatform === 'cartpanda' && cpStats ? (
        <>
          {/* Cartpanda stats cards */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] px-6 py-5">
            <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
              <div className="flex-1 px-5 first:pl-0 flex flex-col gap-1.5 min-w-0">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Volume</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-brand">
                  $&nbsp;{cpOv!.total_volume.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-[11px] text-white/30">{cpOv!.completed} concluídos</p>
              </div>
              <div className="flex-1 px-5 flex flex-col gap-1.5 min-w-0">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Pedidos</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-white">
                  {cpOv!.total_orders}
                </p>
                <p className="text-[11px] text-white/30">{cpOv!.pending} pendentes</p>
              </div>
              <div className="flex-1 px-5 flex flex-col gap-1.5 min-w-0">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Completos</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-emerald-400">
                  {cpOv!.completed}
                </p>
              </div>
              <div className="flex-1 px-5 flex flex-col gap-1.5 min-w-0">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Reembolsos</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-purple-400">
                  {cpOv!.refunded}
                </p>
              </div>
              <div className="flex-1 px-5 last:pr-0 flex flex-col gap-1.5 min-w-0">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Chargebacks</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-orange-400">
                  {cpOv!.declined}
                </p>
              </div>
            </div>

            {/* Mobile grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Volume</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-brand">
                  $&nbsp;{cpOv!.total_volume.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Pedidos</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-white">
                  {cpOv!.total_orders}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Completos</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-emerald-400">
                  {cpOv!.completed}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Reembolsos</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-purple-400">
                  {cpOv!.refunded}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Chargebacks</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-orange-400">
                  {cpOv!.declined}
                </p>
              </div>
            </div>
          </div>

          {/* Cartpanda chart — reuse Chart.tsx, map orders → transactions */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {cpStats.hourly ? 'Pedidos por Hora' : 'Volume de Pedidos'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-brand inline-block rounded" />
                  Volume ($)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0 inline-block border-t-2 border-dashed border-indigo-400" />
                  Pedidos
                </span>
              </div>
            </div>
            <Chart
              data={cpStats.chart.map((d) => ({ ...d, transactions: d.orders }))}
              hourly={cpStats.hourly}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors

- [ ] **Step 3: Commit**

```bash
cd /Users/fabriciojuliano/Documents/ll/dashboard
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): platform toggle for WayMB / Cartpanda stats"
```

---

## Backend Dependencies

These hub-laravel changes must be complete before the frontend can fully work:

| Endpoint | Status | Linear Issue |
|---|---|---|
| `GET /api/auth/me` — return `cartpanda_param` | Planned | Create new issue in hub-inter |
| `GET /api/cartpanda-orders` | Planned | FRA-18 |
| `GET /api/cartpanda-stats` | Planned | Create new issue in hub-inter |

The frontend will compile and route correctly without these, but API calls will 404 until they land.
