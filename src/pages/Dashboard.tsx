import { useState, useEffect } from 'react';
import { api, StatsResponse, AdminUser } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import StatsCards from '../components/StatsCards';
import Chart from '../components/Chart';

const QUICK_PERIODS = [
  { label: 'Hoje',    value: 'today'     },
  { label: 'Ontem',   value: 'yesterday' },
  { label: '7 dias',  value: '7d'        },
  { label: '30 dias', value: '30d'       },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [period, setPeriod]         = useState('30d');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [stats, setStats]           = useState<StatsResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [accounts, setAccounts]             = useState<AdminUser[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>(undefined);

  useEffect(() => {
    document.title = 'Dashboard — StatsChecker';
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.users().then(({ users }) => setAccounts(users)).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (period === 'custom' && (!dateFrom || !dateTo)) return;
    setLoading(true);
    setError(null);
    api.stats(period, dateFrom || undefined, dateTo || undefined, selectedAccount)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo, selectedAccount]);

  function selectPeriod(value: string) {
    setPeriod(value);
    setShowCustom(false);
    setDateFrom('');
    setDateTo('');
  }

  function handleCustom() {
    setShowCustom(true);
    setPeriod('custom');
  }

  function retry() {
    setError(null);
    setLoading(true);
    api.stats(period, dateFrom || undefined, dateTo || undefined, selectedAccount)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  const ov = stats?.overview;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {isAdmin
              ? selectedAccount
                ? `Conta: ${accounts.find((a) => a.id === selectedAccount)?.email ?? ''}`
                : 'Visão geral de todas as contas'
              : 'Visão geral dos seus pagamentos'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin account selector */}
          {isAdmin && accounts.length > 0 && (
            <select
              value={selectedAccount ?? ''}
              onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
            >
              <option value="">Todas as contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.payer_name ? `${a.payer_name} (${a.email})` : a.email}
                </option>
              ))}
            </select>
          )}

          {/* Period selector */}
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
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/50 transition-colors"
              />
              <span className="text-white/30 text-sm">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/50 transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            onClick={retry}
            className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-white/20 text-sm">Carregando...</div>
      ) : stats ? (
        <>
          <StatsCards overview={stats.overview} />

          {/* Conversion card */}
          {ov && stats.conversions.length > 0 && (
            <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">Análise de Conversão</h2>
                <span className={`text-xs font-semibold tabular-nums ${ov.declined_rate > 10 ? 'text-red-400' : 'text-white/30'}`}>
                  {ov.declined_rate.toFixed(1)}% recusados ({ov.declined})
                </span>
              </div>

              <table className="w-full text-sm">
                <caption className="sr-only">Análise de conversão por valor</caption>
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {[
                      { label: 'Valor',     cls: 'text-left'   },
                      { label: 'Gerados',   cls: 'text-center' },
                      { label: 'Pagos',     cls: 'text-center' },
                      { label: 'Conversão', cls: 'text-right'  },
                    ].map(({ label, cls }) => (
                      <th key={label} scope="col" className={`px-3 pb-3 text-xs font-semibold uppercase tracking-widest text-white/30 ${cls}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {stats.conversions.map((row) => (
                    <tr key={row.amount}>
                      <td className="px-3 py-3.5 font-bold text-white tabular-nums">
                        €&nbsp;{row.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-3 py-3.5 text-center text-white/40 tabular-nums">{row.generated}</td>
                      <td className="px-3 py-3.5 text-center text-white/40 tabular-nums">{row.paid}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden" aria-hidden="true">
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${Math.min(row.conversion, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-white/80 w-12 text-right tabular-nums">
                            {row.conversion.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Volume chart */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {stats.hourly ? 'Transações por Hora' : 'Volume de Pagamentos'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-brand inline-block rounded" />
                  Volume (€)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0 inline-block border-t-2 border-dashed border-indigo-400" />
                  Transações
                </span>
              </div>
            </div>
            <Chart data={stats.chart} hourly={stats.hourly} />
          </div>

          {/* Method breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.methods.map((m) => (
              <div key={m.method} className="bg-surface-1 rounded-2xl border border-white/[0.06] p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
                  {m.method === 'mbway' ? 'MB WAY' : 'Multibanco'}
                </p>
                <p className="text-2xl font-bold text-white tabular-nums">
                  €&nbsp;{m.volume.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-white/30 mt-1">{m.count} transações</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
