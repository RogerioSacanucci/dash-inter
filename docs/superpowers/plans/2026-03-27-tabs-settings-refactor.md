# Tabs Component + Settings Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable `<Tabs>` component and refactor Settings to a tabbed layout, consolidating user management from the standalone `/users` route.

**Architecture:** Config-array-driven `<Tabs>` component renders a tab bar; parent owns active state and content rendering. User management logic extracted from `Users.tsx` into a self-contained `<UserManagement>` component. Settings page wires both together with admin-gated tabs.

**Tech Stack:** React 18, TypeScript (strict), Tailwind CSS 3, React Router 6

---

### Task 1: Create `Tabs` component

**Files:**
- Create: `src/components/Tabs.tsx`

- [ ] **Step 1: Create the Tabs component**

```tsx
// src/components/Tabs.tsx

interface Tab {
  key: string;
  label: string;
  adminOnly?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  isAdmin: boolean;
}

export type { Tab };

export default function Tabs({ tabs, active, onChange, isAdmin }: TabsProps) {
  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div role="tablist" className="flex gap-1 border-b border-white/[0.06] mb-6">
      {visibleTabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
            active === tab.key
              ? 'text-white border-brand'
              : 'text-white/35 border-transparent hover:text-white/60'
          }`}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.adminOnly && (
              <span className="bg-brand/15 text-brand text-[10px] font-semibold px-2 py-0.5 rounded-full">
                admin
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to `Tabs.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/Tabs.tsx
git commit -m "feat: add reusable Tabs component (FRA-30)"
```

---

### Task 2: Extract `UserManagement` from `Users.tsx`

**Files:**
- Create: `src/components/UserManagement.tsx`

- [ ] **Step 1: Create UserManagement component**

Extract the full logic from `src/pages/Users.tsx` into a self-contained component. The only difference: no page title (`document.title`) and no heading — those belong to the Settings page.

```tsx
// src/components/UserManagement.tsx
import { useState, useEffect, useCallback } from 'react';
import { api, AdminUser, CreateUserPayload, UpdateUserPayload } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<AdminUser | null | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    api.adminUsers()
      .then(({ users }) => setUsers(users))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar utilizadores.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSave(payload: CreateUserPayload | UpdateUserPayload) {
    if (modalUser === null) {
      const { user: created } = await api.adminCreateUser(payload as CreateUserPayload);
      setUsers((prev) => [created, ...prev]);
    } else if (modalUser) {
      const { user: updated } = await api.adminUpdateUser(modalUser.id, payload as UpdateUserPayload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
    setModalUser(undefined);
  }

  async function handleToggleActive(user: AdminUser) {
    setTogglingId(user.id);
    try {
      const { user: updated } = await api.adminUpdateUser(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setError('Erro ao atualizar estado do utilizador.');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Utilizadores</h2>
          <p className="text-sm text-white/40 mt-0.5">Gerencie os utilizadores da plataforma</p>
        </div>
        <button
          type="button"
          onClick={() => setModalUser(null)}
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Novo utilizador
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface-1 rounded-2xl border border-white/[0.06]">
        <UserTable
          users={users}
          loading={loading}
          currentUserId={currentUser?.id ?? 0}
          onEdit={(user) => setModalUser(user)}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
        />
      </div>

      {modalUser !== undefined && (
        <UserFormModal
          user={modalUser}
          onClose={() => setModalUser(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to `UserManagement.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/UserManagement.tsx
git commit -m "feat: extract UserManagement component from Users page (FRA-30)"
```

---

### Task 3: Refactor Settings page with Tabs

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Rewrite Settings to use Tabs**

Replace the contents of `src/pages/Settings.tsx` with the tabbed layout. The existing Pushcut form logic is preserved exactly — it's just wrapped inside a tab panel.

```tsx
// src/pages/Settings.tsx
import { useState, useEffect, FormEvent } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import Tabs, { Tab } from '../components/Tabs';
import UserManagement from '../components/UserManagement';

const TABS: Tab[] = [
  { key: 'notifications', label: 'Notificações' },
  { key: 'users', label: 'Usuários', adminOnly: true },
];

const NOTIFY_OPTIONS: { value: 'all' | 'created' | 'paid'; label: string; description: string }[] = [
  { value: 'all',     label: 'Ambas',   description: 'Gerado e pago' },
  { value: 'created', label: 'Gerado',  description: 'Só ao criar'   },
  { value: 'paid',    label: 'Pago',    description: 'Só ao confirmar' },
];

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('notifications');

  const [pushcutUrl, setPushcutUrl]       = useState('');
  const [pushcutNotify, setPushcutNotify] = useState<'all' | 'created' | 'paid'>('all');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Configurações — StatsChecker';
  }, []);

  useEffect(() => {
    api.me()
      .then(({ user }) => {
        setPushcutUrl(user.pushcut_url ?? '');
        setPushcutNotify(user.pushcut_notify ?? 'all');
      })
      .catch(() => setError('Erro ao carregar configurações.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await api.updateSettings({ pushcut_url: pushcutUrl, pushcut_notify: pushcutNotify });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-white/40 mt-0.5">Gerencie as suas preferências</p>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} isAdmin={isAdmin} />

      {activeTab === 'notifications' && (
        <div className="max-w-xl">
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
            <h2 className="font-semibold text-white mb-1">Pushcut</h2>
            <p className="text-sm text-white/40 mb-6">
              Configure a URL do Pushcut para receber notificações quando um pagamento for criado ou confirmado.
            </p>

            {loading ? (
              <div className="text-sm text-white/20">Carregando...</div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                    Configurações salvas com sucesso.
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="pushcut_url">
                    URL do Pushcut
                  </label>
                  <input
                    id="pushcut_url"
                    type="url"
                    value={pushcutUrl}
                    onChange={(e) => { setPushcutUrl(e.target.value); setSuccess(false); }}
                    placeholder="https://api.pushcut.io/SEU_TOKEN/notifications/NOME"
                    className="bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
                  />
                  <p className="text-xs text-white/30">
                    Deixe em branco para desativar as notificações.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                    Receber notificações de
                  </p>
                  <div className="flex bg-surface-2 border border-white/[0.08] rounded-xl p-1 gap-1">
                    {NOTIFY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setPushcutNotify(opt.value); setSuccess(false); }}
                        className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                          pushcutNotify === opt.value
                            ? 'bg-surface-1 text-white shadow-sm border border-white/[0.08]'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[11px] text-white/30 mt-0.5">{opt.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  {pushcutUrl && (
                    <button
                      type="button"
                      onClick={() => { setPushcutUrl(''); setSuccess(false); }}
                      className="px-5 py-2.5 text-sm text-white/40 hover:text-white/70 rounded-xl hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && <UserManagement />}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: refactor Settings page with tabbed layout (FRA-30)"
```

---

### Task 4: Remove standalone Users route and sidebar link

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Delete: `src/pages/Users.tsx`

- [ ] **Step 1: Remove `/users` route from App.tsx**

In `src/App.tsx`:
- Remove the import: `import Users from './pages/Users';`
- Remove the route: `<Route path="users" element={<Users />} />`

The file should become:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CartpandaOrders from './pages/CartpandaOrders';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-canvas text-white/20">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
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
          <Route path="cartpanda-orders" element={<CartpandaOrders />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Remove "Utilizadores" sidebar link from Layout.tsx**

In `src/components/Layout.tsx`, remove the entire admin sidebar section (lines 139-144):

```tsx
// Remove this block:
          {isAdmin && (
            <div className="pl-2">
              <GroupHeader label="Admin" />
              <NavItem to="/users" label="Utilizadores" end={false} icon={UsersIcon} onClick={closeSidebar} />
            </div>
          )}
```

Also remove the `UsersIcon` constant (lines 28-35) since it's no longer used.

- [ ] **Step 3: Delete `src/pages/Users.tsx`**

Run: `rm src/pages/Users.tsx`

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors. No references to the deleted file remain.

- [ ] **Step 5: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx
git rm src/pages/Users.tsx
git commit -m "refactor: remove standalone Users page, consolidate into Settings (FRA-30)"
```
