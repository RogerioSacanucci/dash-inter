import { useState, useEffect, useCallback } from 'react';
import { api, Transaction, TransactionsResponse, AdminUser } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import TransactionTable from '../components/TransactionTable';

const STATUSES = ['', 'PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'DECLINED'];
const STATUS_LABELS: Record<string, string> = {
  '':        'Todos',
  PENDING:   'Pendente',
  COMPLETED: 'Concluída',
  FAILED:    'Falhada',
  EXPIRED:   'Expirada',
  DECLINED:  'Recusada',
};

const QUICK_PERIODS = [
  { label: 'Hoje',    value: 'today'     },
  { label: 'Ontem',   value: 'yesterday' },
  { label: '7 dias',  value: '7d'        },
  { label: '30 dias', value: '30d'       },
];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function periodToDates(value: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (value === 'today') {
    const s = toDateStr(today);
    return { from: s, to: s };
  }
  if (value === 'yesterday') {
    const y = new Date(today); y.setDate(y.getDate() - 1);
    const s = toDateStr(y);
    return { from: s, to: s };
  }
  if (value === '7d') {
    const f = new Date(today); f.setDate(f.getDate() - 6);
    return { from: toDateStr(f), to: toDateStr(today) };
  }
  if (value === '30d') {
    const f = new Date(today); f.setDate(f.getDate() - 29);
    return { from: toDateStr(f), to: toDateStr(today) };
  }
  return { from: '', to: '' };
}

export default function Transactions() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txId, setTxId] = useState('');
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const [accounts, setAccounts]         = useState<AdminUser[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    document.title = 'Transações — StatsChecker';
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.users().then(({ users }) => setAccounts(users)).catch(() => {});
    }
  }, [isAdmin]);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string> = { page: String(page) };
    if (status) params.status = status;
    if (method) params.method = method;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (txId.trim()) params.transaction_id = txId.trim();
    if (isAdmin && selectedAccount) params.user_id = selectedAccount;

    api.transactions(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, method, dateFrom, dateTo, txId, page, isAdmin, selectedAccount]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function selectPeriod(value: string) {
    setPeriod(value);
    setShowCustom(false);
    const { from, to } = periodToDates(value);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  }

  function handleCustom() {
    setPeriod('custom');
    setShowCustom(true);
    setDateFrom('');
    setDateTo('');
  }

  function clearFilters() {
    setStatus('');
    setMethod('');
    setDateFrom('');
    setDateTo('');
    setTxId('');
    setSelectedAccount('');
    setPeriod('');
    setShowCustom(false);
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

          <div className="flex bg-surface-1 border border-white/[0.06] rounded-lg p-1 gap-0.5">
            {QUICK_PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => selectPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                  period === p.value && !showCustom
                    ? 'bg-surface-2 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCustom}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                showCustom
                  ? 'bg-surface-2 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Personalizado
            </button>
          </div>

          {showCustom && (
            <>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Data inicial"
                className={inputCls}
              />
              <span className="text-white/30 text-sm">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Data final"
                className={inputCls}
              />
            </>
          )}

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
      <div className="bg-surface-1 rounded-2xl border border-white/[0.06]">
        {error ? (
          <div className="p-6 text-sm text-red-400 flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <TransactionTable transactions={data?.data ?? []} loading={loading} />

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
