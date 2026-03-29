import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, AdminCartpandaShopsResponse } from '../../api/client';
import { periodToDates } from '../../utils/dates';

const QUICK_PERIODS = [
  { label: 'Hoje',    value: 'today'     },
  { label: 'Ontem',   value: 'yesterday' },
  { label: '7 dias',  value: '7d'        },
  { label: '30 dias', value: '30d'       },
];

function formatVolume(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CartpandaShops() {
  const navigate = useNavigate();

  const [data, setData] = useState<AdminCartpandaShopsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    document.title = 'Lojas Cartpanda';
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    api.adminCartpandaShops(period, dateFrom || undefined, dateTo || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo]);

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

  const shops = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Lojas Cartpanda</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {data ? `${shops.length} lojas encontradas` : ''}
          </p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/40 text-left">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Slug</th>
                  <th className="px-4 py-3 font-medium text-right">Afiliados</th>
                  <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Pedidos</th>
                  <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Concluídos</th>
                  <th className="px-4 py-3 font-medium text-right">Volume USD</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-3"><div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" /></td>
                      <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-10 bg-white/[0.06] rounded animate-pulse" /></td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell"><div className="ml-auto h-4 w-10 bg-white/[0.06] rounded animate-pulse" /></td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell"><div className="ml-auto h-4 w-10 bg-white/[0.06] rounded animate-pulse" /></td>
                      <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-20 bg-white/[0.06] rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : shops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                      Nenhuma loja encontrada para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  shops.map((shop) => (
                    <tr
                      key={shop.id}
                      onClick={() => navigate(`/admin/cartpanda-shops/${shop.id}`)}
                      className="border-b border-white/[0.06] last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 text-white/70 font-medium">{shop.name}</td>
                      <td className="px-4 py-3 text-white/40 hidden md:table-cell">{shop.shop_slug}</td>
                      <td className="px-4 py-3 text-right text-white/70 tabular-nums">{shop.users_count}</td>
                      <td className="px-4 py-3 text-right text-white/70 tabular-nums hidden sm:table-cell">{shop.orders_count}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 tabular-nums hidden sm:table-cell">{shop.completed}</td>
                      <td className="px-4 py-3 text-right text-brand tabular-nums">
                        $&nbsp;{formatVolume(shop.total_volume)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
