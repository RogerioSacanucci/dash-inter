import { AdminUser } from '../api/client';
import { EmptyState, EmptyIcons } from './ui/EmptyState';

function formatBalance(value: string): string {
  const num = parseFloat(value ?? '0');
  const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (num < 0 ? '-$\u00a0' : '$\u00a0') + abs;
}

interface UserTableProps {
  users: AdminUser[];
  loading: boolean;
  currentUserId: number;
  onEdit: (user: AdminUser) => void;
  onToggleActive: (user: AdminUser) => void;
  togglingId: number | null;
  onViewBalance?: (user: AdminUser) => void;
}

export default function UserTable({ users, loading, currentUserId, onEdit, onToggleActive, togglingId, onViewBalance }: UserTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-white/20 text-sm">
        Carregando...
      </div>
    );
  }

  if (!users.length) {
    return <EmptyState icon={EmptyIcons.user} message="Nenhum utilizador encontrado" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Lista de utilizadores</caption>
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Email', 'Nome pagador', 'A Liberar', 'Liberado', 'Role', 'Ações'].map((h) => (
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
          {users.map((user) => (
            <tr
              key={user.id}
              className={`hover:bg-white/[0.02] transition-colors ${!user.active ? 'opacity-50' : ''}`}
            >
              <td className="py-3.5 px-4">
                <span className={`text-white/70 ${!user.active ? 'line-through' : ''}`}>
                  {user.email}
                </span>
              </td>
              <td className="py-3.5 px-4 text-white/50">
                {user.payer_name || '—'}
              </td>
              <td className="py-3.5 px-4 tabular-nums text-white/50 hidden md:table-cell">
                {formatBalance(user.balance_pending)}
              </td>
              <td className="py-3.5 px-4 tabular-nums hidden md:table-cell">
                <span className={parseFloat(user.balance_released) < 0 ? 'text-red-400' : 'text-white/50'}>
                  {formatBalance(user.balance_released)}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin'
                      ? 'bg-brand/10 text-brand'
                      : 'bg-white/[0.05] text-white/40'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    Editar
                  </button>
                  {onViewBalance && (
                    <button
                      type="button"
                      onClick={() => onViewBalance(user)}
                      className="text-sm text-white/40 hover:text-white/70 transition-colors"
                    >
                      Saldo
                    </button>
                  )}
                  {user.id !== currentUserId && (
                    <button
                      type="button"
                      disabled={togglingId === user.id}
                      onClick={() => onToggleActive(user)}
                      className={`text-sm transition-colors disabled:opacity-50 ${
                        user.active
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {togglingId === user.id
                        ? '...'
                        : user.active
                          ? 'Desativar'
                          : 'Ativar'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
