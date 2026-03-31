import { useState, useEffect } from 'react';
import { api, AdminUser } from '../api/client';
import DateRangeFilter from '../components/DateRangeFilter';
import { getStoredUtcOffset } from '../utils/dates';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import StatsCards from '../components/StatsCards';
import CartpandaStatsCards from '../components/CartpandaStatsCards';
import Chart from '../components/Chart';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [period, setPeriod]         = useState('30d');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [utcOffset, setUtcOffset] = useState(getStoredUtcOffset);

  const [accounts, setAccounts]             = useState<AdminUser[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  const hasWayMb = isAdmin || !!user?.payer_email;
  const hasCartpanda = isAdmin || !!user?.cartpanda_param;
  const showToggle = hasWayMb && hasCartpanda;

  const { activePlatform, setActivePlatform, stats, cpStats, loading, error } =
    useDashboardStats({ period, dateFrom, dateTo, selectedAccount, retryCount });

  useEffect(() => {
    if (!hasWayMb && hasCartpanda) {
      setActivePlatform('cartpanda');
    }
  }, [hasWayMb, hasCartpanda, setActivePlatform]);

  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.users().then(({ users }) => setAccounts(users)).catch(() => {});
    }
  }, [isAdmin]);

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
                ? `Conta: ${accounts.find((a) => a.id === Number(selectedAccount))?.email ?? ''}`
                : 'Visão geral de todas as contas'
              : 'Visão geral dos seus pagamentos'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin account selector */}
          {isAdmin && accounts.length > 0 && (
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
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

          {/* Platform toggle */}
          {showToggle && (
            <div className="flex bg-surface-1 border border-white/[0.06] rounded-lg p-1 gap-0.5">
              <button
                type="button"
                onClick={() => setActivePlatform('waymb')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                  activePlatform === 'waymb'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                ⇄ WayMB
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform('cartpanda')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                  activePlatform === 'cartpanda'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                🛒 Internacional
              </button>
            </div>
          )}

          {/* Period selector */}
          <DateRangeFilter
            period={period}
            dateFrom={dateFrom}
            dateTo={dateTo}
            utcOffset={utcOffset}
            onPeriodChange={(p, from, to) => {
              setPeriod(p);
              setDateFrom(from);
              setDateTo(to);
            }}
            onCustomDatesChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
            }}
            onUtcOffsetChange={setUtcOffset}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-white/20 text-sm">Carregando...</div>
      ) : activePlatform === 'waymb' && stats ? (
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
      ) : activePlatform === 'cartpanda' && cpStats ? (
        <>
          <CartpandaStatsCards overview={cpStats.overview} />

          {/* Volume chart — Cartpanda */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {cpStats.hourly ? 'Pedidos por Hora' : 'Volume de Pedidos'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-brand inline-block rounded" />
                  Volume ($)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0 inline-block border-t-2 border-dashed border-indigo-400" />
                  Pedidos
                </span>
              </div>
            </div>
            <Chart
              data={cpStats.chart.map((d) => ({ ...d, transactions: d.orders }))}
              hourly={cpStats.hourly}
              secondaryLabel="pedidos"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
