import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, AdminCartpandaShopsResponse } from '../../api/client';
import DateRangeFilter from '../../components/DateRangeFilter';
import { FetchingIndicator } from '../../components/ui/FetchingIndicator';
import { getStoredUtcOffset } from '../../utils/dates';

function formatVolume(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CartpandaShops() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [utcOffset, setUtcOffset] = useState(getStoredUtcOffset);

  const { data, isLoading, isFetching, error, refetch } = useQuery<AdminCartpandaShopsResponse>({
    queryKey: ['cartpanda-shops', period, dateFrom, dateTo, utcOffset],
    queryFn: () => api.adminCartpandaShops(period, dateFrom || undefined, dateTo || undefined, utcOffset),
  });

  useEffect(() => {
    document.title = 'Lojas Internacional';
  }, []);

  const shops = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Lojas Internacional</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {data ? `${shops.length} lojas encontradas` : ''}
          </p>
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

      {/* Table */}
      <div className="bg-surface-1 rounded-2xl border border-white/[0.06]">
        <FetchingIndicator isFetching={isFetching && !isLoading} />
        {error ? (
          <div className="p-6 text-sm text-red-400 flex items-center justify-between gap-4">
            <span>{(error as Error).message}</span>
            <button
              onClick={() => refetch()}
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
                {isLoading ? (
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
                      onClick={() => navigate(`/admin/internacional-shops/${shop.id}`)}
                      className="border-b border-white/[0.06] last:border-0 cursor-pointer fine-hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 text-white/70 font-medium">{shop.name}</td>
                      <td className="px-4 py-3 text-white/40 hidden md:table-cell">{shop.shop_slug}</td>
                      <td className="px-4 py-3 text-right text-white/70 tabular-nums">{shop.users_count}</td>
                      <td className="px-4 py-3 text-right text-white/70 tabular-nums hidden sm:table-cell">{shop.orders_count}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 tabular-nums hidden sm:table-cell">{shop.completed}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 tabular-nums">
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
