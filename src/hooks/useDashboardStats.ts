import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, StatsResponse, CartpandaStatsResponse } from '../api/client';

export type Platform = 'waymb' | 'cartpanda';

interface UseDashboardStatsOptions {
  period: string;
  dateFrom: string;
  dateTo: string;
  selectedAccount: string;
  utcOffset: number;
}

interface UseDashboardStatsReturn {
  activePlatform: Platform;
  setActivePlatform: (p: Platform) => void;
  stats: StatsResponse | undefined;
  cpStats: CartpandaStatsResponse | undefined;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardStats({
  period,
  dateFrom,
  dateTo,
  selectedAccount,
  utcOffset,
}: UseDashboardStatsOptions): UseDashboardStatsReturn {
  const [activePlatform, setActivePlatform] = useState<Platform>('waymb');

  const isWayMb = activePlatform === 'waymb';
  const canFetch = !(period === 'custom' && (!dateFrom || !dateTo));

  const statsQuery = useQuery<StatsResponse>({
    queryKey: ['stats', 'waymb', period, dateFrom, dateTo, selectedAccount, utcOffset],
    queryFn: () =>
      api.stats(
        period,
        dateFrom || undefined,
        dateTo || undefined,
        selectedAccount ? Number(selectedAccount) : undefined,
        utcOffset,
      ),
    enabled: isWayMb && canFetch,
  });

  const cpStatsQuery = useQuery<CartpandaStatsResponse>({
    queryKey: ['stats', 'cartpanda', period, dateFrom, dateTo, selectedAccount, utcOffset],
    queryFn: () =>
      api.cartpandaStats(
        period,
        dateFrom || undefined,
        dateTo || undefined,
        selectedAccount || undefined,
        utcOffset,
      ),
    enabled: !isWayMb && canFetch,
  });

  const activeQuery = isWayMb ? statsQuery : cpStatsQuery;

  return {
    activePlatform,
    setActivePlatform,
    stats: isWayMb ? statsQuery.data : undefined,
    cpStats: isWayMb ? undefined : cpStatsQuery.data,
    loading: activeQuery.isLoading,
    isFetching: activeQuery.isFetching,
    error: activeQuery.error?.message ?? null,
    refetch: () => { activeQuery.refetch(); },
  };
}
