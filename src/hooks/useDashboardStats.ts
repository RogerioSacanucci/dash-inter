import { useState, useEffect } from 'react';
import { api, StatsResponse, CartpandaStatsResponse } from '../api/client';

export type Platform = 'waymb' | 'cartpanda';

interface UseDashboardStatsOptions {
  period: string;
  dateFrom: string;
  dateTo: string;
  selectedAccount: string;
  retryCount?: number;
}

interface UseDashboardStatsReturn {
  activePlatform: Platform;
  setActivePlatform: (p: Platform) => void;
  stats: StatsResponse | null;
  cpStats: CartpandaStatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardStats({
  period,
  dateFrom,
  dateTo,
  selectedAccount,
  retryCount = 0,
}: UseDashboardStatsOptions): UseDashboardStatsReturn {
  const [activePlatform, setActivePlatform] = useState<Platform>('waymb');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [cpStats, setCpStats] = useState<CartpandaStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (period === 'custom' && (!dateFrom || !dateTo)) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    if (activePlatform === 'waymb') {
      setCpStats(null);
      api
        .stats(
          period,
          dateFrom || undefined,
          dateTo || undefined,
          selectedAccount ? Number(selectedAccount) : undefined,
        )
        .then((data) => { if (!cancelled) setStats(data); })
        .catch((e) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      setStats(null);
      api
        .cartpandaStats(
          period,
          dateFrom || undefined,
          dateTo || undefined,
          selectedAccount || undefined,
        )
        .then((data) => { if (!cancelled) setCpStats(data); })
        .catch((e) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }

    return () => { cancelled = true; };
  }, [activePlatform, period, dateFrom, dateTo, selectedAccount, retryCount]);

  return { activePlatform, setActivePlatform, stats, cpStats, loading, error };
}
