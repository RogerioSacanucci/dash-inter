import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { FetchingIndicator } from '../components/ui/FetchingIndicator';
import TransactionTable from '../components/TransactionTable';
import DateRangeFilter from '../components/DateRangeFilter';
import { getStoredUtcOffset, periodToDates } from '../utils/dates';

const STATUSES = ['', 'PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'DECLINED'];
const STATUS_LABELS: Record<string, string> = {
  '':        'Todos',
  PENDING:   'Pendente',
  COMPLETED: 'Concluída',
  FAILED:    'Falhada',
  EXPIRED:   'Expirada',
  DECLINED:  'Recusada',
};

export default function Transactions() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [utcOffset, setUtcOffset] = useState(getStoredUtcOffset);
  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState(() => periodToDates('today', getStoredUtcOffset()).from);
  const [dateTo, setDateTo] = useState(() => periodToDates('today', getStoredUtcOffset()).to);
  const [txId, setTxId] = useState('');
  const [page, setPage] = useState(1);

  const [selectedAccount, setSelectedAccount] = useState('');

  const { data: accountsData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.users(),
    enabled: isAdmin,
  });
  const accounts = accountsData?.users ?? [];

  useEffect(() => {
    document.title = 'Transações';
  }, []);

  const params: Record<string, string> = {
    page: String(page),
    ...(status && { status }),
    ...(method && { method }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(txId.trim() && { transaction_id: txId.trim() }),
    ...(isAdmin && selectedAccount ? { user_id: selectedAccount } : {}),
    utc_offset: String(utcOffset),
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.transactions(params),
    placeholderData: keepPreviousData,
  });

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function clearFilters() {
    setStatus('');
    setMethod('');
    setDateFrom('');
    setDateTo('');
    setTxId('');
    setSelectedAccount('');
    setPeriod('');
    setPage(1);
  }

  const totalPages = data?.meta.pages ?? 1;

  const inputCls = "bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors";

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Transações</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {data ? `${data.meta.total} transações encontradas` : ''}
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
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="ID da transação..."
            aria-label="ID da transação"
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

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            aria-label="Método"
            className={inputCls}
          >
            <option value="">Todos</option>
            <option value="mbway">MB WAY</option>
            <option value="multibanco">Multibanco</option>
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

          {(status || method || period || txId || selectedAccount) && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-white/40 hover:text-white/80 rounded-lg hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-surface-1 rounded-2xl">
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
            <TransactionTable transactions={data?.data ?? []} loading={isLoading} />

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
                    className="px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Próxima página"
                    className="px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
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
