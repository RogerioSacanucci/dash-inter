# Platform Toggle (WayMB ↔ Cartpanda) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a platform toggle to the Dashboard so users with both WayMB and Cartpanda can switch between their stats.

**Architecture:** Extract fetching logic into a `useDashboardStats` hook. Create a standalone `CartpandaStatsCards` component. Add a `secondaryLabel` prop to `Chart`. Dashboard.tsx orchestrates layout and conditional rendering.

**Tech Stack:** React, TypeScript, Tailwind CSS, Recharts

---

### Task 1: Add `secondaryLabel` prop to Chart

**Files:**
- Modify: `src/components/Chart.tsx`

- [ ] **Step 1: Add `secondaryLabel` to Props interface**

In `src/components/Chart.tsx`, update the `Props` interface and function signature:

```typescript
interface Props {
  data: DataPoint[];
  hourly?: boolean;
  secondaryLabel?: string;
}
```

Update the function signature:

```typescript
export default function Chart({ data, hourly = false, secondaryLabel = 'transações' }: Props) {
```

- [ ] **Step 2: Use `secondaryLabel` in the tooltip**

In the `CustomTooltip` component, accept and use the label. Update the component signature:

```typescript
function CustomTooltip({ active, payload, label, hourly, secondaryLabel }: any) {
```

Replace the hardcoded tooltip line:
```tsx
// Before:
<p className="text-white/40 text-xs mt-0.5">{payload[1]?.value ?? 0} transações</p>

// After:
<p className="text-white/40 text-xs mt-0.5">{payload[1]?.value ?? 0} {secondaryLabel}</p>
```

Update the `Tooltip` component to pass the prop:
```tsx
<Tooltip content={<CustomTooltip hourly={hourly} secondaryLabel={secondaryLabel} />} />
```

- [ ] **Step 3: Use `secondaryLabel` in the aria label**

Replace the hardcoded aria label:
```typescript
// Before:
const ariaLabel = `Gráfico de pagamentos: €${totalVolume} em volume, ${totalTx} transações`;

// After:
const ariaLabel = `Gráfico de pagamentos: €${totalVolume} em volume, ${totalTx} ${secondaryLabel}`;
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build passes. No existing behavior changes (default value is `'transações'`).

- [ ] **Step 5: Commit**

```bash
git add src/components/Chart.tsx
git commit -m "feat: add secondaryLabel prop to Chart component"
```

---

### Task 2: Create `CartpandaStatsCards` component

**Files:**
- Create: `src/components/CartpandaStatsCards.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/CartpandaStatsCards.tsx`:

```tsx
import type { CartpandaStatsResponse } from '../api/client';

interface Metric {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}

function MetricCell({ label, value, sub, valueColor = 'text-white' }: Metric) {
  return (
    <div className="flex-1 px-5 first:pl-0 last:pr-0 flex flex-col gap-1.5 min-w-0">
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/30">{sub}</p>}
    </div>
  );
}

interface Props {
  overview: CartpandaStatsResponse['overview'];
}

export default function CartpandaStatsCards({ overview }: Props) {
  const fmt = (n: number) =>
    '$\u00a0' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const metrics: Metric[] = [
    { label: 'Volume', value: fmt(overview.total_volume), valueColor: 'text-brand' },
    { label: 'Pedidos', value: overview.total_orders.toString(), sub: `${overview.pending} pendentes` },
    { label: 'Completos', value: overview.completed.toString(), valueColor: 'text-emerald-400' },
    { label: 'Reembolsos', value: overview.refunded.toString(), valueColor: 'text-purple-400' },
    { label: 'Chargebacks', value: overview.declined.toString(), valueColor: 'text-orange-400' },
  ];

  return (
    <div className="bg-surface-1 rounded-2xl border border-white/[0.06] px-6 py-5">
      {/* Desktop: single row with dividers */}
      <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
        {metrics.map((m) => (
          <MetricCell key={m.label} {...m} />
        ))}
      </div>

      {/* Mobile: 2-col grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        {metrics.map((m) => (
          <MetricCell key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build passes. Component is created but not yet used.

- [ ] **Step 3: Commit**

```bash
git add src/components/CartpandaStatsCards.tsx
git commit -m "feat: add CartpandaStatsCards component"
```

---

### Task 3: Create `useDashboardStats` hook

**Files:**
- Create: `src/hooks/useDashboardStats.ts`

- [ ] **Step 1: Create the hook file**

Create `src/hooks/useDashboardStats.ts`:

```typescript
import { useState, useEffect } from 'react';
import { api, StatsResponse, CartpandaStatsResponse } from '../api/client';

export type Platform = 'waymb' | 'cartpanda';

interface UseDashboardStatsOptions {
  period: string;
  dateFrom: string;
  dateTo: string;
  selectedAccount: string;
}

interface UseDashboardStatsReturn {
  activePlatform: Platform;
  setActivePlatform: (p: Platform) => void;
  stats: StatsResponse | null;
  cpStats: CartpandaStatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardStats({
  period,
  dateFrom,
  dateTo,
  selectedAccount,
}: UseDashboardStatsOptions): UseDashboardStatsReturn {
  const [activePlatform, setActivePlatform] = useState<Platform>('waymb');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [cpStats, setCpStats] = useState<CartpandaStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (period === 'custom' && (!dateFrom || !dateTo)) return;

    setLoading(true);
    setError(null);

    if (activePlatform === 'waymb') {
      api
        .stats(
          period,
          dateFrom || undefined,
          dateTo || undefined,
          selectedAccount ? Number(selectedAccount) : undefined,
        )
        .then(setStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      api
        .cartpandaStats(
          period,
          dateFrom || undefined,
          dateTo || undefined,
          selectedAccount || undefined,
        )
        .then(setCpStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [activePlatform, period, dateFrom, dateTo, selectedAccount]);

  return { activePlatform, setActivePlatform, stats, cpStats, loading, error };
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build passes. Hook is created but not yet used.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDashboardStats.ts
git commit -m "feat: add useDashboardStats hook with platform switching"
```

---

### Task 4: Integrate platform toggle into Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Update imports**

Replace the existing imports at the top of `Dashboard.tsx`:

```typescript
// Before:
import { useState, useEffect } from 'react';
import { api, StatsResponse, AdminUser } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import StatsCards from '../components/StatsCards';
import Chart from '../components/Chart';

// After:
import { useState, useEffect } from 'react';
import { api, AdminUser } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import StatsCards from '../components/StatsCards';
import CartpandaStatsCards from '../components/CartpandaStatsCards';
import Chart from '../components/Chart';
```

- [ ] **Step 2: Replace state declarations with hook**

Replace the state block in `Dashboard()`:

```typescript
// Remove these lines:
const [stats, setStats]           = useState<StatsResponse | null>(null);
const [loading, setLoading]       = useState(true);
const [error, setError]           = useState<string | null>(null);
const [selectedAccount, setSelectedAccount] = useState<number | undefined>(undefined);

// Replace with:
const [selectedAccount, setSelectedAccount] = useState('');
```

Add the hook call and visibility logic after existing state:

```typescript
const hasWayMb = isAdmin || !!user?.payer_email;
const hasCartpanda = isAdmin || !!user?.cartpanda_param;
const showToggle = hasWayMb && hasCartpanda;

const { activePlatform, setActivePlatform, stats, cpStats, loading, error } =
  useDashboardStats({ period, dateFrom, dateTo, selectedAccount });
```

- [ ] **Step 3: Remove the old stats useEffect and retry function**

Delete the stats-fetching `useEffect` (the one that calls `api.stats(...)`) and the `retry()` function. They are now handled by the hook.

The `useEffect` to remove:
```typescript
// DELETE this entire useEffect:
useEffect(() => {
  if (period === 'custom' && (!dateFrom || !dateTo)) return;
  setLoading(true);
  setError(null);
  api.stats(period, dateFrom || undefined, dateTo || undefined, selectedAccount)
    .then(setStats)
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
}, [period, dateFrom, dateTo, selectedAccount]);
```

The `retry` function to remove:
```typescript
// DELETE this function:
function retry() {
  setError(null);
  setLoading(true);
  api.stats(period, dateFrom || undefined, dateTo || undefined, selectedAccount)
    .then(setStats)
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
}
```

- [ ] **Step 4: Update admin account selector**

Update the `<select>` `value` and `onChange` for string-based `selectedAccount`:

```tsx
// Before:
<select
  value={selectedAccount ?? ''}
  onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : undefined)}
  ...
>

// After:
<select
  value={selectedAccount}
  onChange={(e) => setSelectedAccount(e.target.value)}
  ...
>
```

- [ ] **Step 5: Update header subtitle**

Update the subtitle to work with string `selectedAccount`:

```tsx
// Before:
{isAdmin
  ? selectedAccount
    ? `Conta: ${accounts.find((a) => a.id === selectedAccount)?.email ?? ''}`
    : 'Visão geral de todas as contas'
  : 'Visão geral dos seus pagamentos'}

// After:
{isAdmin
  ? selectedAccount
    ? `Conta: ${accounts.find((a) => a.id === Number(selectedAccount))?.email ?? ''}`
    : 'Visão geral de todas as contas'
  : 'Visão geral dos seus pagamentos'}
```

- [ ] **Step 6: Add platform toggle UI**

Insert the platform toggle between the admin account selector and the period selector. Inside the `<div className="flex flex-wrap items-center gap-2">`, after the admin account selector `{isAdmin && accounts.length > 0 && (...)}` block and before the period selector `<div className="flex bg-surface-1 ...">`:

```tsx
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
```

- [ ] **Step 7: Update error retry button**

The error block's retry button currently calls `retry()`. Replace with an inline handler that forces a re-fetch by toggling a state. The simplest approach: since the hook re-fetches when dependencies change, we can trigger a retry by resetting the platform:

```tsx
// Before:
<button
  onClick={retry}
  className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
>
  Tentar novamente
</button>

// After:
<button
  onClick={() => setActivePlatform(activePlatform)}
  className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
>
  Tentar novamente
</button>
```

Note: `setActivePlatform(activePlatform)` won't trigger a re-render because React skips state updates when the value is the same. Instead, add a `retryCount` state to force re-fetch:

```typescript
const [retryCount, setRetryCount] = useState(0);
```

Pass it to the hook options and add it to the hook's `useEffect` dependency array. Update `useDashboardStats`:

In `src/hooks/useDashboardStats.ts`, add `retryCount` to the options interface:

```typescript
interface UseDashboardStatsOptions {
  period: string;
  dateFrom: string;
  dateTo: string;
  selectedAccount: string;
  retryCount?: number;
}
```

Add it to the destructuring and dependency array:

```typescript
export function useDashboardStats({
  period,
  dateFrom,
  dateTo,
  selectedAccount,
  retryCount = 0,
}: UseDashboardStatsOptions): UseDashboardStatsReturn {
  // ... existing code ...

  useEffect(() => {
    // ... existing fetch logic ...
  }, [activePlatform, period, dateFrom, dateTo, selectedAccount, retryCount]);

  // ... rest ...
}
```

In `Dashboard.tsx`, pass `retryCount` and use it for retry:

```typescript
const { activePlatform, setActivePlatform, stats, cpStats, loading, error } =
  useDashboardStats({ period, dateFrom, dateTo, selectedAccount, retryCount });
```

Retry button:
```tsx
<button
  onClick={() => setRetryCount((c) => c + 1)}
  ...
>
  Tentar novamente
</button>
```

- [ ] **Step 8: Add Cartpanda conditional rendering**

Replace the content section (after the loading/error checks). The current code renders WayMB content when `stats` is loaded. Wrap it in a platform check and add the Cartpanda branch:

```tsx
{loading ? (
  <div className="flex justify-center py-16 text-white/20 text-sm">Carregando...</div>
) : activePlatform === 'waymb' && stats ? (
  <>
    <StatsCards overview={stats.overview} />

    {/* Conversion card — unchanged */}
    {ov && stats.conversions.length > 0 && (
      // ... existing conversion table JSX, completely unchanged ...
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

    {/* Method breakdown — unchanged */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.methods.map((m) => (
        // ... existing method breakdown JSX, completely unchanged ...
      ))}
    </div>
  </>
) : activePlatform === 'cartpanda' && cpStats ? (
  <>
    <CartpandaStatsCards overview={cpStats.overview} />

    {/* Volume chart — Cartpanda */}
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
        secondaryLabel="pedidos"
      />
    </div>
  </>
) : null}
```

- [ ] **Step 9: Verify build**

Run: `npm run build`
Expected: Build passes with zero errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/Dashboard.tsx src/hooks/useDashboardStats.ts
git commit -m "feat: integrate platform toggle into Dashboard (FRA-23)"
```

---

### Task 5: Auto-select platform for single-platform users

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add auto-select effect**

After the visibility logic (`hasWayMb`, `hasCartpanda`, `showToggle`) and before the hook call, add an effect that auto-selects the platform when only one is available:

```typescript
useEffect(() => {
  if (!hasWayMb && hasCartpanda) {
    setActivePlatform('cartpanda');
  }
}, [hasWayMb, hasCartpanda, setActivePlatform]);
```

Since `setActivePlatform` comes from the hook which is called after this effect, we need to restructure slightly. Move the hook call before this effect and use its `setActivePlatform`:

```typescript
const { activePlatform, setActivePlatform, stats, cpStats, loading, error } =
  useDashboardStats({ period, dateFrom, dateTo, selectedAccount, retryCount });

useEffect(() => {
  if (!hasWayMb && hasCartpanda) {
    setActivePlatform('cartpanda');
  }
}, [hasWayMb, hasCartpanda, setActivePlatform]);
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: auto-select platform for single-platform users"
```

---

### Task 6: Final verification

**Files:**
- All modified files

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Build passes with zero errors and zero warnings.

- [ ] **Step 2: Manual checklist verification**

Verify the following against acceptance criteria:
- [ ] Toggle pill is hidden when `showToggle` is false
- [ ] WayMB active button uses `bg-brand`; Cartpanda uses `bg-white/[0.08]`
- [ ] Switching platforms calls the correct API
- [ ] Period selector and account selector are shared
- [ ] Cartpanda renders 5 stat cards + chart
- [ ] WayMB branch is completely unchanged

- [ ] **Step 3: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore: final cleanup for platform toggle"
```
