import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AdminUser, CreateUserPayload, UpdateUserPayload } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';
import UserBalancePanel from './UserBalancePanel';
import AdminPushcutUrlPanel from './AdminPushcutUrlPanel';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [modalUser, setModalUser] = useState<AdminUser | null | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pushcutUserId, setPushcutUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.adminUsers(),
  });

  const users = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => api.adminCreateUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      api.adminUpdateUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  async function handleSave(payload: CreateUserPayload | UpdateUserPayload): Promise<number | void> {
    if (modalUser === null) {
      const { user: created } = await createMutation.mutateAsync(payload as CreateUserPayload);
      setModalUser(undefined);
      return created.id;
    } else if (modalUser) {
      await updateMutation.mutateAsync({ id: modalUser.id, payload: payload as UpdateUserPayload });
      setModalUser(undefined);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    setTogglingId(user.id);
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: user.id, payload: { active: !user.active } });
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

      <div className="bg-surface-1 rounded-2xl">
        <UserTable
          users={users}
          loading={isLoading}
          currentUserId={currentUser?.id ?? 0}
          onEdit={(user) => setModalUser(user)}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
          onViewBalance={(user) => setSelectedUserId(user.id)}
          onViewPushcut={(user) => setPushcutUserId(pushcutUserId === user.id ? null : user.id)}
        />
      </div>

      {selectedUserId !== null && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">
              Saldo — {users.find((u) => u.id === selectedUserId)?.email}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Fechar ×
            </button>
          </div>
          <UserBalancePanel userId={selectedUserId} />
        </div>
      )}

      {pushcutUserId !== null && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-white">
              Pushcut (admin) — {users.find((u) => u.id === pushcutUserId)?.email}
            </h3>
            <button
              type="button"
              onClick={() => setPushcutUserId(null)}
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Fechar ×
            </button>
          </div>
          <AdminPushcutUrlPanel userId={pushcutUserId} />
        </div>
      )}

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
