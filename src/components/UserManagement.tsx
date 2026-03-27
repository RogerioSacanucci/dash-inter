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
