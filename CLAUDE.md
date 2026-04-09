# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> See also: `../CLAUDE.md` for repo-wide context (stack, design tokens, backend architecture).

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc + vite build (type-check + bundle)
npm run preview   # Preview production build
```

No test runner is configured. There is no lint script — TypeScript via `tsc` is the only static check.

## Architecture

### Data Flow

All API calls go through the `api` object in `src/api/client.ts`. Every interface type lives there too — no separate types file. The `request<T>()` helper handles auth headers (Bearer from `localStorage`) and throws `Error(data.error)` on non-OK responses.

TanStack Query v5 (`@tanstack/react-query`) wraps all `api.*` calls. Global config: `staleTime: 0`, `retry: 1`, `refetchOnWindowFocus: false` (`src/lib/queryClient.ts`).

### Auth

`useAuth` (`src/hooks/useAuth.ts`) calls `api.me()` on mount to validate the stored JWT and populate the user object. It does **not** decode the JWT client-side — `me` is the source of truth. `logout()` clears localStorage and calls `queryClient.clear()`.

### Route Guards

- `AuthGuard` — wraps all authenticated routes; redirects to `/login` if no user
- `AdminGuard` — checks `user.role === 'admin'`; redirects to `/` otherwise

Both guards show `BrandedLoader` (fade-out animation) while auth is resolving.

### Conditional Navigation

`Layout.tsx` conditionally renders nav sections based on the user object:
- **WayMB** section: shown if `isAdmin || !!user.payer_email`
- **Internacional** section: shown if `isAdmin || !!user.internacional_param`
- Admin-only links (Lojas, Webhook Logs, Email Service) gated by `isAdmin`

### Platforms

The dashboard supports two payment platforms on the same Dashboard page:
- **WayMB** — Portuguese payment gateway (MB WAY + Multibanco), via `/api/stats`
- **Cartpanda** — International orders, via `/api/internacional-stats`

`useDashboardStats` (`src/hooks/useDashboardStats.ts`) holds the active platform toggle and fires the appropriate query. Only one platform query is enabled at a time.

### UTC Offset

The user's UTC offset is stored in `localStorage` as `utc_offset` (default: `-3`). `src/utils/dates.ts` exports `getStoredUtcOffset()`, `formatDateWithOffset()`, and `periodToDates()` — all date display and range calculations go through these utilities.

### Icons

Animated icons use `@lordicon/react` (`<Player>` component). Icon JSON files live in `src/icons/`. Trigger animation on hover via `playerRef.current?.playFromBeginning()`. Static colorization via `colorize` prop (hex or rgba string).

### Animations

`motion/react` (Framer Motion v12) is used for micro-interactions. Import from `"motion/react"`, not `"framer-motion"`.

### MilestoneIndicator

`src/components/MilestoneIndicator.tsx` — topbar widget showing cumulative revenue progress toward the next milestone. Polls `api.getMilestoneProgress()` every 30 seconds. Renders a ring SVG progress indicator and a dropdown popover.
