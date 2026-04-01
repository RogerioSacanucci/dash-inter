import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, AdminCartpandaShopDetailResponse } from '../../api/client';
import DateRangeFilter from '../../components/DateRangeFilter';
import { getStoredUtcOffset } from '../../utils/dates';
import Chart from '../../components/Chart';

interface Metric {
  label: string;
  value: string;
  valueColor?: string;
}

function MetricCell({ label, value, valueColor = 'text-white' }: Metric) {
  return (
    <div className="flex-1 px-5 first:pl-0 last:pr-0 flex flex-col gap-1.5 min-w-0">
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

function formatVolume(value: number): string {
  return '$\u00a0' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatBalance(value: string): string {
  const num = parseFloat(value ?? '0');
  const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (num < 0 ? '-$\u00a0' : '$\u00a0') + abs;
}

export default function CartpandaShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminCartpandaShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [utcOffset, setUtcOffset] = useState(getStoredUtcOffset);

  useEffect(() => {
    if (data?.shop.name) {
      document.title = data.shop.name;
    }
  }, [data?.shop.name]);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.adminCartpandaShopDetail(Number(id), period, dateFrom || undefined, dateTo || undefined, utcOffset)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, period, dateFrom, dateTo, utcOffset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metrics: Metric[] = data ? [
    { label: 'Volume', value: formatVolume(data.aggregate.total_volume), valueColor: 'text-brand' },
    { label: 'Pedidos', value: data.aggregate.total_orders.toString() },
    { label: 'Concluídos', value: data.aggregate.completed.toString(), valueColor: 'text-emerald-400' },
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/admin/internacional-shops')}
        className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
      >
        ← Lojas
      </button>

      {/* Header + Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            {data?.shop.name ?? ''}
          </h1>
          {data?.shop.shop_slug && (
            <p className="text-sm text-white/40 mt-0.5 font-mono">
              {data.shop.shop_slug}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={fetchData}
            className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-white/20 text-sm">Carregando...</div>
      ) : data ? (
        <>
          {/* Stats cards */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] px-6 py-5">
            <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
              {metrics.map((m) => (
                <MetricCell key={m.label} {...m} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
              {metrics.map((m) => (
                <MetricCell key={m.label} {...m} />
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {data.hourly ? 'Pedidos por Hora' : 'Volume de Pedidos'}
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
              data={data.chart.map((d) => ({ ...d, transactions: d.orders }))}
              hourly={data.hourly}
              secondaryLabel="pedidos"
              currencySymbol="$"
            />
          </div>

          {/* Users table */}
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/40 text-left">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Pedidos</th>
                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Concluídos</th>
                    <th className="px-4 py-3 font-medium text-right">Volume</th>
                    <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">A Liberar</th>
                    <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Liberado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                        Nenhum usuário encontrado para o período selecionado.
                      </td>
                    </tr>
                  ) : (
                    data.users.map((user) => (
                      <tr key={user.id} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3 text-white/70">{user.email}</td>
                        <td className="px-4 py-3 text-right text-white/70 tabular-nums hidden sm:table-cell">{user.orders_count}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 tabular-nums hidden sm:table-cell">{user.completed}</td>
                        <td className="px-4 py-3 text-right text-brand tabular-nums">
                          {formatVolume(user.total_volume)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-white/50 hidden lg:table-cell">
                          {formatBalance(user.balance_pending)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">
                          <span className={parseFloat(user.balance_released) < 0 ? 'text-red-400' : 'text-white/50'}>
                            {formatBalance(user.balance_released)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
