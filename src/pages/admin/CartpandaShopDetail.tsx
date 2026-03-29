import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, AdminCartpandaShopDetailResponse } from '../../api/client';
import { periodToDates } from '../../utils/dates';
import Chart from '../../components/Chart';

const QUICK_PERIODS = [
  { label: 'Hoje',    value: 'today'     },
  { label: 'Ontem',   value: 'yesterday' },
  { label: '7 dias',  value: '7d'        },
  { label: '30 dias', value: '30d'       },
];

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

export default function CartpandaShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminCartpandaShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (data?.shop.name) {
      document.title = data.shop.name;
    }
  }, [data?.shop.name]);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.adminCartpandaShopDetail(Number(id), period, dateFrom || undefined, dateTo || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, period, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function selectPeriod(value: string) {
    setPeriod(value);
    setShowCustom(false);
    const { from, to } = periodToDates(value);
    setDateFrom(from);
    setDateTo(to);
  }

  function handleCustom() {
    setPeriod('custom');
    setShowCustom(true);
    setDateFrom('');
    setDateTo('');
  }

  const inputCls = "bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors";

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
        onClick={() => navigate('/admin/cartpanda-shops')}
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
                  </tr>
                </thead>
                <tbody>
                  {data.users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-white/30 text-sm">
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
