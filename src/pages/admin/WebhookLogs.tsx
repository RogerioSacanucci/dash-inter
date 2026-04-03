import { useState, useEffect, useCallback } from 'react';
import { api, WebhookLog, WebhookLogsResponse } from '../../api/client';

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
  const [data, setData] = useState<WebhookLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WebhookLog | null>(null);

  const [event, setEvent] = useState('');
  const [status, setStatus] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = 'Webhook Logs';
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    api.adminWebhookLogs({ event: event || undefined, status: status || undefined, shop_slug: shopSlug || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined, page })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar logs.'))
      .finally(() => setLoading(false));
  }, [event, status, shopSlug, dateFrom, dateTo, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleClear() {
    setEvent('');
    setStatus('');
    setShopSlug('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const inputCls = 'bg-surface-2 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Webhook Logs</h1>
        <span className="text-xs text-white/30">Retenção: 1 dia</span>
      </div>

      {/* Filters */}
      <div className="bg-surface-1 border border-white/[0.06] rounded-2xl px-5 py-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Evento</label>
          <select value={event} onChange={(e) => { setEvent(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">Todos</option>
            {EVENTS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">Todos</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Loja (slug)</label>
          <input
            type="text"
            value={shopSlug}
            onChange={(e) => { setShopSlug(e.target.value); setPage(1); }}
            placeholder="ex: lifeboost"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">De</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Até</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={inputCls} />
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 bg-white/[0.04] transition-colors"
        >
          Limpar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          {error}
          <button type="button" onClick={fetchData} className="text-red-400/70 hover:text-red-400 underline text-xs">Tentar novamente</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-1 border border-white/[0.06] rounded-2xl overflow-hidden">
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/20 text-sm">Carregando...</td>
                </tr>
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/20 text-sm">Nenhum log encontrado</td>
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
