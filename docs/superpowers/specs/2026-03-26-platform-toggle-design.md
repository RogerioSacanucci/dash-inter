# DASH-5: Dashboard Platform Toggle (WayMB ↔ Cartpanda)

**Linear:** FRA-23
**Date:** 2026-03-26

## Overview

Add a platform toggle to the Dashboard so users with both WayMB and Cartpanda can switch between their stats. If the user only has one platform, the toggle is hidden and stats load automatically for their platform.

## Approach

Extract platform-switching logic into a `useDashboardStats` hook, create a standalone `CartpandaStatsCards` component, and add a `secondaryLabel` prop to `Chart`. Dashboard.tsx stays focused on layout and conditional rendering.

## Files to create

### `src/hooks/useDashboardStats.ts`

Custom hook encapsulating platform-aware stat fetching.

**Inputs (passed as options object):**
- `period: string`
- `dateFrom: string`
- `dateTo: string`
- `selectedAccount: string`

**Owned state:**
- `activePlatform: 'waymb' | 'cartpanda'`
- `stats: StatsResponse | null`
- `cpStats: CartpandaStatsResponse | null`
- `loading: boolean`
- `error: string`

**Fetch logic:**
- Single `useEffect` that branches on `activePlatform`.
- WayMB branch: calls `api.stats(period, dateFrom, dateTo, Number(selectedAccount) || undefined)`.
- Cartpanda branch: calls `api.cartpandaStats(period, dateFrom, dateTo, selectedAccount || undefined)`.
- Dependency array: `[activePlatform, period, dateFrom, dateTo, selectedAccount]`.
- Clears error and sets `loading = true` before each fetch.

**Returns:** `{ activePlatform, setActivePlatform, stats, cpStats, loading, error }`

### `src/components/CartpandaStatsCards.tsx`

Standalone component displaying 5 Cartpanda metric cards.

**Props:** `{ overview: CartpandaStatsResponse['overview'] }`

**Cards:**

| Card | Field | Color |
|---|---|---|
| Volume | `total_volume` formatted as `$ X,XX` | `text-brand` |
| Pedidos | `total_orders` (subtitle: `{pending} pendentes`) | `text-white` |
| Completos | `completed` | `text-emerald-400` |
| Reembolsos | `refunded` | `text-purple-400` |
| Chargebacks | `declined` | `text-orange-400` |

**Layout:** Desktop: `flex items-start divide-x divide-white/[0.06]`. Mobile: `grid grid-cols-2`. Same card wrapper as `StatsCards`: `bg-surface-1 rounded-2xl border border-white/[0.06] px-6 py-5`.

## Files to modify

### `src/components/Chart.tsx`

Add optional `secondaryLabel` prop (default: `"Transações"`). Use it in the legend and tooltip where the transaction count label appears. No other changes.

```typescript
interface Props {
  data: DataPoint[];
  hourly?: boolean;
  secondaryLabel?: string;
}
```

### `src/pages/Dashboard.tsx`

**State changes:**
- Remove local `stats`, `loading`, `error` state — replaced by `useDashboardStats` hook.
- Change `selectedAccount` from `number | undefined` to `string` (empty string = none selected).
- Keep `period`, `dateFrom`, `dateTo`, `customOpen` as-is.

**Visibility logic:**
```typescript
const isAdmin = user?.role === 'admin';
const hasWayMb = isAdmin || !!user?.payer_email;
const hasCartpanda = isAdmin || !!user?.cartpanda_param;
const showToggle = hasWayMb && hasCartpanda;
```

If user only has one platform, auto-set `activePlatform` accordingly (no toggle shown).

**Platform toggle UI:**
Pill-style toggle placed between admin account selector and period selector. Same visual pattern as the existing period selector pill.
- WayMB active: `bg-brand text-white shadow-sm`
- Cartpanda active: `bg-white/[0.08] text-white shadow-sm`
- Inactive: `text-white/40 hover:text-white/70`

**Conditional rendering:**
- `activePlatform === 'waymb'`: existing `StatsCards`, conversion table, chart (unchanged), method breakdown.
- `activePlatform === 'cartpanda'`: `CartpandaStatsCards`, chart with `secondaryLabel="Pedidos"` and data mapped (`orders → transactions`).

**Layout order:**
1. Header + admin account selector
2. Platform toggle (if `showToggle`)
3. Period selector + custom date range
4. Platform-specific content

## Files NOT changed

- `StatsCards.tsx` — untouched
- `src/api/client.ts` — types and API methods already exist
- Conversion table, method breakdown — WayMB-only, untouched

## Acceptance criteria

- Toggle pill hidden for single-platform users
- Switching to Cartpanda fetches `api.cartpandaStats()` and renders Cartpanda cards + chart
- Switching back to WayMB restores existing behavior exactly
- Admin account selector applies to both platforms
- Period selector and custom date range apply to both platforms
- WayMB active button uses `bg-brand`; Cartpanda active uses `bg-white/[0.08]`
- `npm run build` passes
