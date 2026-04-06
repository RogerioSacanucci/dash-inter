import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import CartpandaOrderTable from '../components/CartpandaOrderTable';
import CartpandaStatsCards from '../components/CartpandaStatsCards';
import DateRangeFilter from '../components/DateRangeFilter';
import { FetchingIndicator } from '../components/ui/FetchingIndicator';
import { SkeletonCartpandaStats, SkeletonTableRows } from '../components/ui/Skeleton';
import { getStoredUtcOffset, periodToDates } from '../utils/dates';

const STATUSES = ['', 'PENDING', 'COMPLETED', 'FAILED', 'DECLINED', 'REFUNDED'];
const STATUS_LABELS: Record<string, string> = {
  '':        'Todos',
  PENDING:   'Pendente',
  COMPLETED: 'Concluído',
  FAILED:    'Falhado',
  DECLINED:  'Recusado',
  REFUNDED:  'Reembolsado',
};

export default function CartpandaOrders() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState('');
  const [utcOffset, setUtcOffset] = useState(getStoredUtcOffset);
  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState(() => periodToDates('today', getStoredUtcOffset()).from);
  const [dateTo, setDateTo] = useState(() => periodToDates('today', getStoredUtcOffset()).to);
  const [orderId, setOrderId] = useState('');
  const [page, setPage] = useState(1);

  const [selectedAccount, setSelectedAccount] = useState('');

  const { data: accountsData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.users(),
    enabled: isAdmin,
  });
  const accounts = accountsData?.users ?? [];

  useEffect(() => {
    document.title = 'Pedidos';
  }, []);

  const orderParams: Record<string, string> = { page: String(page), utc_offset: String(utcOffset) };
  if (status) orderParams.status = status;
  if (dateFrom) orderParams.date_from = dateFrom;
  if (dateTo) orderParams.date_to = dateTo;
  if (orderId.trim()) orderParams.order_id = orderId.trim();
  if (isAdmin && selectedAccount) orderParams.user_id = selectedAccount;

  const ordersQuery = useQuery({
    queryKey: ['cartpanda-orders', orderParams],
    queryFn: () => api.cartpandaOrders(orderParams),
    placeholderData: keepPreviousData,
  });

  const statsQuery = useQuery({
    queryKey: ['cartpanda-stats', period, dateFrom, dateTo, selectedAccount, utcOffset],
    queryFn: () =>
      api.cartpandaStats(
        period || 'today',
        dateFrom || undefined,
        dateTo || undefined,
        isAdmin && selectedAccount ? selectedAccount : undefined,
        utcOffset,
      ),
    throwOnError: false,
    placeholderData: keepPreviousData,
  });

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function clearFilters() {
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setOrderId('');
    setSelectedAccount('');
    setPeriod('');
    setPage(1);
  }

  const totalPages = ordersQuery.data?.meta.pages ?? 1;

  const inputCls = "bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors";

  return (
    <div className="flex flex-col gap-6">
      <FetchingIndicator isFetching={ordersQuery.isFetching && !ordersQuery.isLoading} />

      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Pedidos Internacional</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {ordersQuery.data ? `${ordersQuery.data.meta.total} pedidos encontrados` : ''}
          </p>
        </div>

        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
          {isAdmin && accounts.length > 0 && (
            <select
              value={selectedAccount}
              onChange={(e) => { setSelectedAccount(e.target.value); setPage(1); }}
              aria-label="Conta"
              className={inputCls}
            >
              <option value="">Todas as contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.payer_name ? `${a.payer_name} (${a.email})` : a.email}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="ID do pedido..."
            aria-label="ID do pedido"
            className={`${inputCls} w-40 placeholder:text-white/20`}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
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

          {(status || period || orderId || selectedAccount) && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-white/40 hover:text-white/80 rounded-lg hover:bg-white/[0.05] transition-[color,background-color,transform] duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {/* Stats */}
      {statsQuery.isLoading ? (
        <SkeletonCartpandaStats />
      ) : (
        statsQuery.data && <CartpandaStatsCards overview={statsQuery.data.overview} />
      )}

      {/* Table */}
      <div className="bg-surface-1 rounded-2xl">
        {ordersQuery.error ? (
          <div className="p-6 text-sm text-red-400 flex items-center justify-between gap-4">
            <span>{ordersQuery.error.message}</span>
            <button
              onClick={() => ordersQuery.refetch()}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 transition-transform duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              Tentar novamente
            </button>
          </div>
        ) : ordersQuery.isLoading ? (
          <table className="w-full text-sm">
            <caption className="sr-only">Carregando pedidos Internacional</caption>
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['ID Pedido', 'Valor', 'Evento', 'Status', 'Comprador', 'Data'].map((h) => (
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
            <tbody>
              <SkeletonTableRows cols={[30, 15, 20, 18, 25, 20]} />
            </tbody>
          </table>
        ) : (
          <>
            <CartpandaOrderTable orders={ordersQuery.data?.data ?? []} />

            {/* Pagination */}
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
                    className="px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.05] transition-[color,background-color,transform] duration-[160ms] ease-out active:scale-[0.97] disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Próxima página"
                    className="px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.05] transition-[color,background-color,transform] duration-[160ms] ease-out active:scale-[0.97] disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
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
