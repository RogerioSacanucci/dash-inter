import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { FetchingIndicator } from '../components/ui/FetchingIndicator';
import { EmptyState, EmptyIcons } from '../components/ui/EmptyState';
import DateRangeFilter from '../components/DateRangeFilter';
import { getStoredUtcOffset } from '../utils/dates';

function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value));
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
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [type, setType] = useState('');
  const [utcOffset, setUtcOffset] = useState(getStoredUtcOffset);
  const [period, setPeriod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data: shopsData } = useQuery({
    queryKey: ['admin-shops-list'],
    queryFn: () => api.adminCartpandaShops(),
  });

  const shops = shopsData?.data ?? [];

  const filters = {
    page,
    ...(userId.trim() && { user_id: Number(userId.trim()) }),
    ...(shopId && { shop_id: Number(shopId) }),
    ...(type && { type: type as 'withdrawal' | 'adjustment' }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['admin-payouts', filters],
    queryFn: () => api.adminGetAllPayouts(filters),
    placeholderData: keepPreviousData,
  });

  const totalPages = data?.meta.pages ?? 1;

  const inputCls = 'bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

  function clearFilters() {
    setUserId('');
    setShopId('');
    setType('');
    setDateFrom('');
    setDateTo('');
    setPeriod('');
    setPage(1);
  }

  const hasActiveFilters = userId || shopId || type || period || dateFrom || dateTo;

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

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setPage(1); }}
            placeholder="User ID..."
            aria-label="User ID"
            className={`${inputCls} w-28 placeholder:text-white/20`}
          />

          {shops.length > 0 && (
            <select
              value={shopId}
              onChange={(e) => { setShopId(e.target.value); setPage(1); }}
              aria-label="Loja"
              className={inputCls}
            >
              <option value="">Todas as lojas</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            aria-label="Tipo"
            className={inputCls}
          >
            <option value="">Todos</option>
            <option value="withdrawal">Saque</option>
            <option value="adjustment">Ajuste</option>
          </select>

          <DateRangeFilter
            period={period}
            dateFrom={dateFrom}
            dateTo={dateTo}
            utcOffset={utcOffset}
            onPeriodChange={(p, from, to) => {
              setPeriod(p);
              setDateFrom(from);
              setDateTo(to);
              setPage(1);
            }}
            onCustomDatesChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
            }}
            onUtcOffsetChange={setUtcOffset}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-white/40 hover:text-white/80 rounded-lg hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Stats card */}
      <div className="bg-surface-1 rounded-2xl px-6 py-5">
        <div className="hidden sm:flex divide-x divide-white/[0.10]">
          <div className="flex flex-col gap-1 flex-1 pr-6">
            <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest">Total Saques</p>
            <p className="text-2xl font-bold tabular-nums leading-none text-red-400">
              {data ? formatCurrency(data.totals.total_withdrawals) : '—'}
            </p>
          </div>
          <div className="flex flex-col gap-1 flex-1 px-6">
            <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest">Total Ajustes</p>
            <p className="text-2xl font-bold tabular-nums leading-none text-emerald-400">
              {data ? formatCurrency(data.totals.total_adjustments) : '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest">Total Saques</p>
            <p className="text-xl font-bold tabular-nums leading-none text-red-400">
              {data ? formatCurrency(data.totals.total_withdrawals) : '—'}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest">Total Ajustes</p>
            <p className="text-xl font-bold tabular-nums leading-none text-emerald-400">
              {data ? formatCurrency(data.totals.total_adjustments) : '—'}
            </p>
          </div>
        </div>
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
        ) : !isLoading && data?.data.length === 0 ? (
          <EmptyState icon={EmptyIcons.payout} message="Nenhum saque encontrado" hint="Tente ajustar os filtros ou o período" />
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
                    <th className={thCls}>Conta</th>
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
                  ) : (
                    data?.data.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-white/[0.06] fine-hover:bg-white/[0.02] transition-colors"
                      >
                        <td className={`${tdCls} tabular-nums whitespace-nowrap`}>
                          {new Date(entry.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date(entry.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
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
                            {entry.type === 'withdrawal' ? '−' : '+'}{formatCurrency(Math.abs(Number(entry.amount)))}
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

  const releasedNum = parseFloat(balance?.balance_released ?? '0');

  const metrics = [
    { label: 'A Liberar',      value: balance ? formatCurrency(balance.balance_pending)    : '—', color: 'text-yellow-400' },
    { label: 'Liberado',       value: balance ? formatCurrency(balance.balance_released)   : '—', color: releasedNum < 0 ? 'text-red-400' : 'text-emerald-400' },
    { label: 'Reserva',        value: balance ? formatCurrency(balance.balance_reserve)    : '—', color: 'text-white/70' },
    { label: 'Total Sacado',   value: data    ? formatCurrency(data.totals.total_withdrawals)  : '—', color: 'text-red-400' },
    { label: 'Total Ajustes',  value: data    ? formatCurrency(data.totals.total_adjustments)  : '—', color: 'text-emerald-400' },
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

      {/* Balance stats bar */}
      <div className="bg-surface-1 rounded-2xl px-6 py-5">
        <div className="hidden sm:flex divide-x divide-white/[0.10]">
          {metrics.map((m, i) => (
            <div key={m.label} className={`flex flex-col gap-1 flex-1 ${i === 0 ? 'pr-6' : 'px-6'} animate-fade-in`} style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest">{m.label}</p>
              <p className={`text-2xl font-bold tabular-nums leading-none ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 sm:hidden">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-1">
              <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest">{m.label}</p>
              <p className={`text-xl font-bold tabular-nums leading-none ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
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
        ) : !isLoading && data?.payout_logs.data.length === 0 ? (
          <EmptyState icon={EmptyIcons.payout} message="Nenhum saque encontrado" hint="Ainda não há saques registados" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-surface-1 border-b border-white/[0.06]">
                    <th className={thCls}>Data</th>
                    <th className={thCls}>Tipo</th>
                    <th className={thCls}>Valor</th>
                    <th className={thCls}>Conta</th>
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
                  ) : (
                    data?.payout_logs.data.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-white/[0.06] fine-hover:bg-white/[0.02] transition-colors"
                      >
                        <td className={`${tdCls} tabular-nums whitespace-nowrap`}>
                          {new Date(entry.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date(entry.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className={tdCls}>
                          <TypeBadge type={entry.type} />
                        </td>
                        <td className={`${tdCls} tabular-nums font-medium`}>
                          <span className={entry.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}>
                            {entry.type === 'withdrawal' ? '−' : '+'}{formatCurrency(Math.abs(Number(entry.amount)))}
                          </span>
                        </td>
                        <td className={tdCls}>{entry.account_index != null ? `Conta ${entry.account_index}` : '—'}</td>
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
