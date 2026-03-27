# FRA-30: Tabs Component + Settings Refactor

## Overview

Create a reusable `<Tabs>` component and refactor the Settings page to use a tabbed layout with "Notificações" and "Usuários" (admin-only) tabs. Consolidate user management from the standalone `/users` route into Settings.

## Components

### `Tabs` (`src/components/Tabs.tsx`)

Generic, reusable tab bar driven by a config array.

**Types:**

```typescript
type Tab = {
  key: string;
  label: string;
  adminOnly?: boolean;
};

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  isAdmin: boolean;
};
```

**Behavior:**

- Filters out tabs with `adminOnly: true` when `isAdmin` is false
- Renders a horizontal tab bar
- Parent owns tab state and renders content based on active key
- Does not render tab panels — only the tab bar itself

**Styling (from ticket):**

- Active tab: `text-white border-brand border-b-2`
- Inactive tab: `text-white/35 border-transparent hover:text-white/60`
- Admin badge (shown next to label on `adminOnly` tabs): `bg-brand/15 text-brand rounded-full text-xs`
- Tab bar has a subtle bottom border to separate from content

**Accessibility:**

- Container: `role="tablist"`
- Each tab button: `role="tab"`, `aria-selected`
- Follows existing codebase patterns (`aria-label`, semantic HTML)

### `UserManagement` (`src/components/UserManagement.tsx`)

Extracted from `src/pages/Users.tsx`. Contains all user management state and logic.

**Responsibilities:**

- Fetches admin users via `api.getAdminUsers()`
- Handles create, edit, toggle active operations
- Renders `<UserTable>` and `<UserFormModal>`
- Manages modal state (open/close, selected user)
- Error and loading states

**No props required** — it's self-contained, using `useAuth()` internally for `currentUserId`.

## Page Changes

### `Settings` (`src/pages/Settings.tsx`)

**New state:**

- `activeTab: string` — defaults to `'notifications'`

**Tab configuration:**

```typescript
const TABS: Tab[] = [
  { key: 'notifications', label: 'Notificações' },
  { key: 'users', label: 'Usuários', adminOnly: true },
];
```

**Layout:**

1. Page heading ("Configurações") — unchanged
2. `<Tabs>` component with `isAdmin` from `useAuth()`
3. Conditional content:
   - `'notifications'`: existing Pushcut form (unchanged logic)
   - `'users'`: `<UserManagement />`

### `App.tsx`

- Remove `/users` route

### `Layout.tsx`

- Remove "Usuários" sidebar link (the one that navigates to `/users`)
- Keep all other sidebar items unchanged

## Files to Delete

- `src/pages/Users.tsx` — logic moves to `UserManagement` component

## Acceptance Criteria

1. Non-admin users see only the "Notificações" tab
2. Admin users see both tabs; "Usuários" tab shows a brand-colored "admin" badge
3. Switching tabs renders the correct content
4. User management (create, edit, toggle) works identically to the previous `/users` page
5. `/users` route no longer exists; navigating to it redirects to `/`
6. Notifications form behavior is unchanged
