import { useState, useEffect, useCallback } from 'react';
import { api, CartpandaOrdersResponse, AdminUser } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import CartpandaOrderTable from '../components/CartpandaOrderTable';
import { periodToDates } from '../utils/dates';

const STATUSES = ['', 'PENDING', 'COMPLETED', 'FAILED', 'DECLINED', 'REFUNDED'];
const STATUS_LABELS: Record<string, string> = {
  '':        'Todos',
  PENDING:   'Pendente',
  COMPLETED: 'Concluído',
  FAILED:    'Falhado',
  DECLINED:  'Recusado',
  REFUNDED:  'Reembolsado',
};

const QUICK_PERIODS = [
  { label: 'Hoje',    value: 'today'     },
  { label: 'Ontem',   value: 'yesterday' },
  { label: '7 dias',  value: '7d'        },
  { label: '30 dias', value: '30d'       },
];

export default function CartpandaOrders() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<CartpandaOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderId, setOrderId] = useState('');
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const [accounts, setAccounts]         = useState<AdminUser[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    document.title = 'Pedidos';
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
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (orderId.trim()) params.order_id = orderId.trim();
    if (isAdmin && selectedAccount) params.user_id = selectedAccount;

    api.cartpandaOrders(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, dateFrom, dateTo, orderId, page, isAdmin, selectedAccount]);

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
    setDateFrom('');
    setDateTo('');
    setOrderId('');
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
          <h1 className="text-xl font-bold text-white">Pedidos Cartpanda</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {data ? `${data.meta.total} pedidos encontrados` : ''}
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

          {(status || period || orderId || selectedAccount) && (
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
            <CartpandaOrderTable orders={data?.data ?? []} loading={loading} />

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
