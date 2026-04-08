import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AdminPayoutsFilters } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { FetchingIndicator } from '../components/ui/FetchingIndicator';
import { PayoutFilters } from '../components/PayoutFilters';

function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TypeBadge({ type }: { type: 'withdrawal' | 'adjustment' }) {
  const isWithdrawal = type === 'withdrawal';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
        isWithdrawal
          ? 'bg-red-500/10 text-red-400'
          : 'bg-emerald-500/10 text-emerald-400'
      }`}
    >
      {isWithdrawal ? 'Saque' : 'Ajuste'}
    </span>
  );
}

const thCls =
  'px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-widest';
const tdCls = 'px-4 py-3 text-sm text-white/70';
const paginationBtnCls =
  'px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0';

/* ──────────────────────────── Admin View ──────────────────────────── */

function AdminPayouts() {
  const [filters, setFilters] = useState<AdminPayoutsFilters>({ page: 1 });

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['admin-payouts', filters],
    queryFn: () => api.adminGetAllPayouts(filters),
    placeholderData: keepPreviousData,
  });

  const totalPages = data?.meta.pages ?? 1;
  const page = filters.page ?? 1;

  function handleFiltersChange(updated: AdminPayoutsFilters) {
    setFilters(updated);
  }

  function handleClear() {
    setFilters({ page: 1 });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            Saques
            {isFetching && !isLoading && (
              <span className="ml-2 text-xs font-normal text-white/30">Atualizando...</span>
            )}
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            {data ? `${data.meta.total} registros encontrados` : ''}
          </p>
        </div>
      </div>

      <PayoutFilters
        filters={filters}
        shops={[]}
        onFiltersChange={handleFiltersChange}
        onClear={handleClear}
      />

      <div className="bg-surface-1 rounded-2xl overflow-hidden">
        <FetchingIndicator isFetching={isFetching && !isLoading} />
        {error ? (
          <div className="p-6 text-sm text-red-400 flex items-center justify-between gap-4">
            <span>{error.message}</span>
            <button
              onClick={() => refetch()}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-surface-1 border-b border-white/[0.06]">
                    <th className={thCls}>Data</th>
                    <th className={thCls}>Usuário</th>
                    <th className={thCls}>Tipo</th>
                    <th className={thCls}>Valor</th>
                    <th className={thCls}>Loja</th>
                    <th className={thCls}>Admin</th>
                    <th className={thCls}>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className={`${tdCls} text-center text-white/30`}>
                        Carregando...
                      </td>
                    </tr>
                  ) : data?.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`${tdCls} text-center text-white/30`}>
                        Nenhum saque encontrado
                      </td>
                    </tr>
                  ) : (
                    data?.data.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-white/[0.06] fine-hover:bg-white/[0.02] transition-colors"
                      >
                        <td className={`${tdCls} tabular-nums whitespace-nowrap`}>
                          {formatDate(entry.created_at)}
                        </td>
                        <td className={tdCls}>
                          <span className="text-white">{entry.user.name}</span>
                          <br />
                          <span className="text-xs text-white/40">{entry.user.email}</span>
                        </td>
                        <td className={tdCls}>
                          <TypeBadge type={entry.type} />
                        </td>
                        <td className={`${tdCls} tabular-nums font-medium`}>
                          <span className={entry.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}>
                            {entry.type === 'withdrawal' ? '−' : '+'}{formatCurrency(entry.amount)}
                          </span>
                        </td>
                        <td className={tdCls}>{entry.shop_name ?? '—'}</td>
                        <td className={`${tdCls} text-xs`}>{entry.admin_email}</td>
                        <td className={`${tdCls} max-w-[200px] truncate`}>{entry.note ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <span className="text-xs text-white/30 tabular-nums">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
                    disabled={page === 1}
                    aria-label="Página anterior"
                    className={paginationBtnCls}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
                    disabled={page === totalPages}
                    aria-label="Próxima página"
                    className={paginationBtnCls}
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

/* ──────────────────────────── User View ──────────────────────────── */

function UserPayouts() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['user-payouts', page],
    queryFn: () => api.getPayouts(page),
    placeholderData: keepPreviousData,
  });

  const totalPages = data?.payout_logs.meta.pages ?? 1;
  const balance = data?.balance;

  const cards = [
    { label: 'A Liberar', value: balance?.balance_pending, color: 'text-yellow-400' },
    { label: 'Liberado', value: balance?.balance_released, color: 'text-emerald-400' },
    { label: 'Reserva', value: balance?.balance_reserve, color: 'text-white/70' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">
          Saques
          {isFetching && !isLoading && (
            <span className="ml-2 text-xs font-normal text-white/30">Atualizando...</span>
          )}
        </h1>
        <p className="text-sm text-white/40 mt-0.5">Seu saldo e histórico de saques</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-1 rounded-2xl px-5 py-4 border border-white/[0.06]"
          >
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
              {card.label}
            </p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${card.color}`}>
              {balance ? formatCurrency(card.value ?? '0') : '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-surface-1 rounded-2xl overflow-hidden">
        <FetchingIndicator isFetching={isFetching && !isLoading} />
        {error ? (
          <div className="p-6 text-sm text-red-400 flex items-center justify-between gap-4">
            <span>{error.message}</span>
            <button
              onClick={() => refetch()}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-surface-1 border-b border-white/[0.06]">
                    <th className={thCls}>Data</th>
                    <th className={thCls}>Tipo</th>
                    <th className={thCls}>Valor</th>
                    <th className={thCls}>Loja</th>
                    <th className={thCls}>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className={`${tdCls} text-center text-white/30`}>
                        Carregando...
                      </td>
                    </tr>
                  ) : data?.payout_logs.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`${tdCls} text-center text-white/30`}>
                        Nenhum saque encontrado
                      </td>
                    </tr>
                  ) : (
                    data?.payout_logs.data.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-white/[0.06] fine-hover:bg-white/[0.02] transition-colors"
                      >
                        <td className={`${tdCls} tabular-nums whitespace-nowrap`}>
                          {formatDate(entry.created_at)}
                        </td>
                        <td className={tdCls}>
                          <TypeBadge type={entry.type} />
                        </td>
                        <td className={`${tdCls} tabular-nums font-medium`}>
                          <span className={entry.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}>
                            {entry.type === 'withdrawal' ? '−' : '+'}{formatCurrency(entry.amount)}
                          </span>
                        </td>
                        <td className={tdCls}>{entry.shop_name ?? '—'}</td>
                        <td className={`${tdCls} max-w-[200px] truncate`}>{entry.note ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
                    className={paginationBtnCls}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Próxima página"
                    className={paginationBtnCls}
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

/* ──────────────────────────── Main ──────────────────────────── */

export default function Payouts() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    document.title = 'Saques';
  }, []);

  return isAdmin ? <AdminPayouts /> : <UserPayouts />;
}
