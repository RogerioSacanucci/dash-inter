import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { EmptyState, EmptyIcons } from '../../components/ui/EmptyState';
import { api, WebhookLog } from '../../api/client';
import { FetchingIndicator } from '../../components/ui/FetchingIndicator';
import { SkeletonTableRows } from '../../components/ui/Skeleton';
import DateRangeFilter from '../../components/DateRangeFilter';
import { getStoredUtcOffset, periodToDates } from '../../utils/dates';

const EVENTS = ['order.paid', 'order.created', 'order.cancelled', 'order.chargeback', 'order.refunded'];
const STATUSES = ['processed', 'ignored', 'failed'] as const;

const STATUS_STYLES: Record<string, string> = {
  processed: 'bg-emerald-500/10 text-emerald-400',
  ignored: 'bg-white/[0.06] text-white/40',
  failed: 'bg-red-500/10 text-red-400',
};

function PayloadModal({ log, onClose }: { log: WebhookLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-white/[0.08] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-white">{log.event ?? '—'}</span>
            <span className="text-xs text-white/30">Order {log.cartpanda_order_id ?? '—'} · {new Date(log.created_at).toLocaleString('pt-PT')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto p-6">
          <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap break-all leading-relaxed">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function WebhookLogs() {
  const [selected, setSelected] = useState<WebhookLog | null>(null);

  const [event, setEvent] = useState('');
  const [status, setStatus] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [utcOffset, setUtcOffset] = useState(getStoredUtcOffset);
  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState(() => periodToDates('today', getStoredUtcOffset()).from);
  const [dateTo, setDateTo] = useState(() => periodToDates('today', getStoredUtcOffset()).to);
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = 'Webhook Logs';
  }, []);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['webhook-logs', { event, status, shopSlug, dateFrom, dateTo, page }],
    queryFn: () =>
      api.adminWebhookLogs({
        event: event || undefined,
        status: status || undefined,
        shop_slug: shopSlug || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  function handleClear() {
    setEvent('');
    setStatus('');
    setShopSlug('');
    setPeriod('today');
    const { from, to } = periodToDates('today', utcOffset);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  }

  const inputCls = 'bg-surface-2 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Webhook Logs</h1>
        <span className="text-xs text-white/30">Retenção: 1 dia</span>
      </div>

      <FetchingIndicator isFetching={isFetching && !isLoading} />

      {/* Filters */}
      <div className="bg-surface-1 rounded-2xl px-5 py-3.5 flex flex-wrap gap-2 items-center">
        <select aria-label="Evento" value={event} onChange={(e) => { setEvent(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">Todos os eventos</option>
          {EVENTS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">Todos os status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text"
          aria-label="Loja (slug)"
          value={shopSlug}
          onChange={(e) => { setShopSlug(e.target.value); setPage(1); }}
          placeholder="Slug da loja..."
          className={inputCls}
        />
        <div className="flex-1" />
        <DateRangeFilter
          period={period}
          dateFrom={dateFrom}
          dateTo={dateTo}
          utcOffset={utcOffset}
          onPeriodChange={(p, from, to) => { setPeriod(p); setDateFrom(from); setDateTo(to); setPage(1); }}
          onCustomDatesChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
          onUtcOffsetChange={setUtcOffset}
        />
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Limpar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          {error instanceof Error ? error.message : 'Erro ao carregar logs.'}
          <button type="button" onClick={() => refetch()} className="text-red-400/70 hover:text-red-400 underline text-xs">Tentar novamente</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-1 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Data', 'Evento', 'Order ID', 'Loja', 'Status', 'Razão', 'IP'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <SkeletonTableRows rows={8} cols={[30, 20, 15, 15, 12, 25, 18]} />
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={EmptyIcons.log} message="Nenhum log encontrado" hint="Tente ajustar os filtros" />
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelected(log)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-white/40 tabular-nums whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 px-4 text-white/70 font-mono text-xs whitespace-nowrap">{log.event ?? '—'}</td>
                    <td className="py-3 px-4 text-white/50 tabular-nums">{log.cartpanda_order_id ?? '—'}</td>
                    <td className="py-3 px-4 text-white/50">{log.shop_slug ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/30 text-xs">{log.status_reason ?? '—'}</td>
                    <td className="py-3 px-4 text-white/30 text-xs font-mono">{log.ip_address ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">{data.meta.total} registros</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 disabled:opacity-30 bg-white/[0.04] transition-colors"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1.5 text-xs text-white/30">
                {page} / {data.meta.pages}
              </span>
              <button
                type="button"
                disabled={page >= data.meta.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 disabled:opacity-30 bg-white/[0.04] transition-colors"
              >
                Próximo →
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <PayloadModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
