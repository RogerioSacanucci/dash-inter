# User Management UI — Design Spec

**Ticket:** FRA-31 (DASH-8: UserTable + UserFormModal components)
**Date:** 2026-03-27

## Overview

Build the full user management UI: a table listing all admin users and a modal for creating/editing. Uses only the fields currently supported by the API (`email`, `password`, `payer_email`, `payer_name`, `role`, `cartpanda_param`).

## Architecture

Three files, following the existing page → presentational component pattern:

- `src/pages/Users.tsx` — orchestrator page (data fetching, state, API calls)
- `src/components/UserTable.tsx` — presentational table
- `src/components/UserFormModal.tsx` — modal for create/edit

Plus wiring: route in `App.tsx`, sidebar link in `Layout.tsx`.

## 1. UserTable Component

**File:** `src/components/UserTable.tsx`

**Props:**
```typescript
interface UserTableProps {
  users: AdminUser[];
  loading: boolean;
  currentUserId: number;
  onEdit: (user: AdminUser) => void;
  onToggleActive: (user: AdminUser) => void;
}
```

**Columns:** Email | Nome pagador | Role | Actions

**Styling:**
- Container: `bg-surface-1 rounded-2xl border border-white/[0.06]`
- Row dividers: `divide-y divide-white/[0.04]`
- Cell padding: `px-4 py-3.5`
- Header: uppercase, small font, `text-white/30`, `tracking-widest`
- Row hover: `hover:bg-white/[0.02] transition-colors`
- Inactive rows: `opacity-50` on the row + `line-through` on email cell
- Role badge: `bg-brand/10 text-brand` for admin, `bg-white/[0.05] text-white/40` for user

**Actions column:**
- "Editar" button — always shown
- "Desativar" (`text-red-400`) — shown for active users (not for current user)
- "Ativar" (`text-emerald-400`) — shown for inactive users (not for current user)
- Current user's row: no deactivate/activate button

**States:**
- Loading: centered spinner/text (matches existing tables)
- Empty: centered "Nenhum utilizador encontrado"

## 2. UserFormModal Component

**File:** `src/components/UserFormModal.tsx`

**Props:**
```typescript
interface UserFormModalProps {
  user: AdminUser | null; // null = create mode, object = edit mode
  onClose: () => void;
  onSave: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
}
```

**Fields:**
- `email` — text input (required)
- `password` — text input, only shown in create mode (required in create)
- `role` — select: `admin`, `user` (required)
- `payer_name` — text input (required)
- `payer_email` — text input (required)
- `cartpanda_param` — text input (optional)

**Styling:**
- Overlay: `fixed inset-0 bg-black/60 z-50`, centered content
- Modal container: `bg-surface-1 rounded-2xl p-6`, max-width `md`
- Input styles from Settings: `bg-surface-1 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors`
- Labels: `text-xs font-semibold text-white/40 uppercase tracking-widest`
- Submit button: `px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors`

**Behavior:**
- Title: "Criar utilizador" (create) / "Editar utilizador" (edit)
- Edit mode: fields pre-filled with current values
- Submit button: "Criar" / "Guardar", disabled while saving
- Error message in red container if API call fails
- Close via: overlay click, X button, or Escape key

## 3. Users Page (Orchestrator)

**File:** `src/pages/Users.tsx`

**State:**
- `users: AdminUser[]` — fetched via `api.adminUsers()`
- `loading: boolean` — initial fetch loading
- `modalUser: AdminUser | null | undefined` — `undefined` = closed, `null` = create, `AdminUser` = edit
- `toggling: number | null` — user ID being toggled (disables button during API call)

**Behavior:**
- On mount: fetch users via `api.adminUsers()`
- Header with "Utilizadores" title and "Novo utilizador" button (opens create modal)
- Create: `api.adminCreateUser()` → prepend to list → close modal
- Edit: `api.adminUpdateUser()` → update in-place → close modal
- Toggle active: `api.adminUpdateUser(id, { active: !user.active })` → update in-place
- Current user ID from `useAuth()` hook, passed to UserTable

## 4. Wiring

**App.tsx:** Add `/users` route inside the Layout route group.

**Layout.tsx:** Add "Utilizadores" link in the sidebar navigation (admin-only, with a users icon).

## Acceptance Criteria

- Create user → appears at top of list
- Edit user → list updates in-place
- Deactivate → row goes opaque/strikethrough, button becomes "Ativar"
- Reactivate → row returns to normal
- Own account row: no deactivate button
