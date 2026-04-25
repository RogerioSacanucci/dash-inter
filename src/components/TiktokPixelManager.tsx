import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  CreateTiktokPixelPayload,
  TiktokEventLog,
  TiktokEventLogDetail,
  TiktokEventLogsFilters,
  TiktokPixel,
  UpdateTiktokPixelPayload,
} from '../api/client';
import { EmptyState, EmptyIcons } from './ui/EmptyState';

interface FormState {
  pixel_code: string;
  access_token: string;
  label: string;
  test_event_code: string;
}

const emptyForm: FormState = {
  pixel_code: '',
  access_token: '',
  label: '',
  test_event_code: '',
};

const inputClass =
  'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

const filterInputClass =
  'bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

type SubTab = 'pixels' | 'logs';

export default function TiktokPixelManager() {
  const [tab, setTab] = useState<SubTab>('pixels');

  return (
    <div className="space-y-4">
      <div className="inline-flex gap-1 rounded-xl border border-white/[0.06] bg-surface-1 p-1">
        {(['pixels', 'logs'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`h-8 rounded-lg px-3 text-xs font-semibold transition-colors ${
              tab === key ? 'bg-brand text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {key === 'pixels' ? 'Pixels' : 'Logs de eventos'}
          </button>
        ))}
      </div>

      {tab === 'pixels' && <PixelsPanel />}
      {tab === 'logs' && <LogsPanel />}
    </div>
  );
}

function PixelsPanel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tiktok-pixels'],
    queryFn: () => api.tiktokPixels(),
  });
  const pixels = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateTiktokPixelPayload) => api.createTiktokPixel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] });
      resetForm();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao adicionar pixel.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTiktokPixelPayload }) =>
      api.updateTiktokPixel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] });
      resetForm();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao atualizar pixel.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTiktokPixel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      api.updateTiktokPixel(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] }),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  function openEdit(pixel: TiktokPixel) {
    setEditingId(pixel.id);
    setForm({
      pixel_code: pixel.pixel_code,
      access_token: '',
      label: pixel.label ?? '',
      test_event_code: pixel.test_event_code ?? '',
    });
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (editingId === null) {
      createMutation.mutate({
        pixel_code: form.pixel_code.trim(),
        access_token: form.access_token,
        label: form.label.trim() || undefined,
        test_event_code: form.test_event_code.trim() || undefined,
      });
      return;
    }

    const payload: UpdateTiktokPixelPayload = {
      pixel_code: form.pixel_code.trim(),
      label: form.label.trim() || undefined,
      test_event_code: form.test_event_code.trim() || undefined,
    };
    if (form.access_token) {
      payload.access_token = form.access_token;
    }
    updateMutation.mutate({ id: editingId, payload });
  }

  function handleDelete(pixel: TiktokPixel) {
    if (!confirm(`Remover pixel "${pixel.label ?? pixel.pixel_code}"?`)) return;
    deleteMutation.mutate(pixel.id);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="bg-surface-1 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="font-semibold text-white mb-1">
          {editingId === null ? 'Adicionar pixel TikTok' : 'Editar pixel TikTok'}
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Cada pixel dispara um evento CompletePayment ao pagar. Credenciais vêm do TikTok Ads Manager.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-pixel-code">
              Pixel Code
            </label>
            <input
              id="tt-pixel-code"
              type="text"
              required
              value={form.pixel_code}
              onChange={(e) => setForm((f) => ({ ...f, pixel_code: e.target.value }))}
              placeholder="CXXXXXXXXXXXXXX"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-access-token">
              Access Token{editingId !== null && (
                <span className="normal-case font-normal text-white/30"> (deixe em branco para manter)</span>
              )}
            </label>
            <input
              id="tt-access-token"
              type="password"
              required={editingId === null}
              value={form.access_token}
              onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
              placeholder="••••••••••"
              autoComplete="off"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-label">
              Label <span className="normal-case font-normal">(opcional)</span>
            </label>
            <input
              id="tt-label"
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Loja A"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-test-code">
              Test Event Code <span className="normal-case font-normal">(opcional)</span>
            </label>
            <input
              id="tt-test-code"
              type="text"
              value={form.test_event_code}
              onChange={(e) => setForm((f) => ({ ...f, test_event_code: e.target.value }))}
              placeholder="TEST12345"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
            >
              {saving ? 'Salvando...' : editingId === null ? 'Adicionar' : 'Salvar'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 text-white/60 hover:text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-surface-1 rounded-2xl p-6 flex-1 min-w-[260px]">
        <h2 className="font-semibold text-white mb-1">Pixels cadastrados</h2>
        <p className="text-sm text-white/40 mb-6">
          Pixels habilitados disparam eventos em paralelo a cada pagamento confirmado.
        </p>

        {isLoading ? (
          <div className="text-sm text-white/20">Carregando...</div>
        ) : pixels.length === 0 ? (
          <EmptyState icon={EmptyIcons.notification} message="Nenhum pixel cadastrado" hint="Adicione um pixel para começar a rastrear conversões" />
        ) : (
          <div className="flex flex-col gap-2">
            {pixels.map((pixel) => (
              <div
                key={pixel.id}
                className="flex items-center gap-3 bg-surface-2 border border-white/[0.06] rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  {pixel.label && (
                    <p className="text-sm font-medium text-white truncate">{pixel.label}</p>
                  )}
                  <p className={`text-xs font-mono truncate ${pixel.label ? 'text-white/40' : 'text-white/70'}`}>
                    {pixel.pixel_code}
                  </p>
                  {pixel.test_event_code && (
                    <p className="text-[11px] text-yellow-400/70 mt-0.5">
                      Teste: {pixel.test_event_code}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pixel.enabled}
                  onClick={() => toggleMutation.mutate({ id: pixel.id, enabled: !pixel.enabled })}
                  className={`shrink-0 relative w-10 h-5 rounded-full transition-colors ${
                    pixel.enabled ? 'bg-brand' : 'bg-white/10'
                  }`}
                  aria-label={`${pixel.enabled ? 'Desabilitar' : 'Habilitar'} pixel ${pixel.label ?? pixel.pixel_code}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      pixel.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(pixel)}
                  aria-label={`Editar ${pixel.label ?? pixel.pixel_code}`}
                  className="shrink-0 text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M11.5 2.5l2 2L5 13l-3 .5.5-3 9-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pixel)}
                  aria-label={`Remover ${pixel.label ?? pixel.pixel_code}`}
                  className="shrink-0 text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogsPanel() {
  const [filters, setFilters] = useState<TiktokEventLogsFilters>({ page: 1 });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const pixelsQuery = useQuery({ queryKey: ['tiktok-pixels'], queryFn: () => api.tiktokPixels() });
  const pixels = pixelsQuery.data?.data ?? [];

  const logsQuery = useQuery({
    queryKey: ['tiktok-event-logs', filters],
    queryFn: () => api.tiktokEventLogs(filters),
  });

  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;

  function setFilter<K extends keyof TiktokEventLogsFilters>(key: K, value: TiktokEventLogsFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  function clearFilters() {
    setFilters({ page: 1 });
  }

  const hasFilters = !!(filters.pixel_id || filters.status || filters.order_id || filters.date_from || filters.date_to);

  return (
    <div className="bg-surface-1 rounded-2xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Logs de eventos</h2>
          <p className="text-sm text-white/40 mt-0.5">
            {meta ? `${meta.total} evento${meta.total === 1 ? '' : 's'} registrado${meta.total === 1 ? '' : 's'}` : 'Carregando…'}
          </p>
        </div>
        <button
          onClick={() => logsQuery.refetch()}
          className="px-3 py-2 text-xs text-white/60 hover:text-white border border-white/[0.06] rounded-lg transition-colors"
        >
          Atualizar
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filters.pixel_id ?? ''}
          onChange={(e) => setFilter('pixel_id', e.target.value ? Number(e.target.value) : undefined)}
          aria-label="Pixel"
          className={filterInputClass}
        >
          <option value="">Todos os pixels</option>
          {pixels.map((p) => (
            <option key={p.id} value={p.id}>{p.label ?? p.pixel_code}</option>
          ))}
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilter('status', (e.target.value || undefined) as 'success' | 'error' | undefined)}
          aria-label="Status"
          className={filterInputClass}
        >
          <option value="">Todos status</option>
          <option value="success">Sucesso</option>
          <option value="error">Erro</option>
        </select>
        <input
          type="text"
          value={filters.order_id ?? ''}
          onChange={(e) => setFilter('order_id', e.target.value || undefined)}
          placeholder="Order ID..."
          className={`${filterInputClass} w-36`}
        />
        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => setFilter('date_from', e.target.value || undefined)}
          aria-label="De"
          className={filterInputClass}
        />
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => setFilter('date_to', e.target.value || undefined)}
          aria-label="Até"
          className={filterInputClass}
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-white/40 hover:text-white/80 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {logsQuery.isLoading ? (
        <div className="text-sm text-white/20 py-8 text-center">Carregando…</div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={EmptyIcons.notification}
          message="Nenhum evento encontrado"
          hint={hasFilters ? 'Tente ajustar os filtros' : 'Logs aparecem aqui após pagamentos confirmados'}
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {logs.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              expanded={expandedId === log.id}
              onToggle={() => setExpandedId((id) => (id === log.id ? null : log.id))}
            />
          ))}
        </ul>
      )}

      {meta && meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="text-xs text-white/40 tabular-nums">
            Página {meta.page} de {meta.pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
              disabled={meta.page === 1}
              className="px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/[0.06] rounded-lg disabled:opacity-30 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: Math.min(meta.pages, (f.page ?? 1) + 1) }))}
              disabled={meta.page === meta.pages}
              className="px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/[0.06] rounded-lg disabled:opacity-30 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogRow({ log, expanded, onToggle }: { log: TiktokEventLog; expanded: boolean; onToggle: () => void }) {
  const queryClient = useQueryClient();
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ['tiktok-event-log', log.id],
    queryFn: () => api.tiktokEventLog(log.id),
    enabled: expanded,
  });

  const retryMutation = useMutation({
    mutationFn: () => api.retryTiktokEvent(log.id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-event-logs'] });
      setRetryMessage(res.data.success ? 'Reenviado com sucesso ✓' : `Reenviado mas falhou: ${res.data.tiktok_message ?? 'erro'}`);
      window.setTimeout(() => setRetryMessage(null), 4000);
    },
    onError: (err) => {
      setRetryMessage(err instanceof Error ? err.message : 'Erro ao reenviar');
      window.setTimeout(() => setRetryMessage(null), 5000);
    },
  });

  return (
    <li className="bg-surface-2 border border-white/[0.06] rounded-xl">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 text-left min-w-0 -mx-2 px-2 py-1 rounded-lg hover:bg-white/[0.02] transition-colors"
          aria-expanded={expanded}
        >
          <StatusBadge success={log.success} httpStatus={log.http_status} tiktokCode={log.tiktok_code} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {log.pixel?.label ?? log.pixel?.pixel_code ?? 'Pixel removido'}
              </span>
              <span className="text-[11px] text-white/30 font-mono truncate">
                order #{log.cartpanda_order_id}
              </span>
            </div>
            {log.tiktok_message && (
              <p className={`text-[11px] truncate mt-0.5 ${log.success ? 'text-white/40' : 'text-red-400'}`}>
                {log.tiktok_message}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] text-white/50 tabular-nums">{formatDate(log.created_at)}</div>
            {log.request_id && (
              <div className="text-[10px] font-mono text-white/30 truncate max-w-[140px]" title={log.request_id}>
                {log.request_id.slice(0, 12)}…
              </div>
            )}
          </div>
          <span className={`shrink-0 transition-transform text-white/30 ${expanded ? 'rotate-90' : ''}`}>▸</span>
        </button>
        {!log.success && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); retryMutation.mutate(); }}
            disabled={retryMutation.isPending}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-white/70 hover:border-brand/40 hover:bg-brand-subtle hover:text-white transition-colors disabled:opacity-50"
            aria-label="Reenviar evento"
          >
            {retryMutation.isPending ? (
              <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 1 1 1.76 4.24M2 13v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Reenviar
          </button>
        )}
      </div>

      {retryMessage && (
        <div className={`px-4 pb-2 text-[11px] ${retryMessage.startsWith('Reenviado com sucesso') ? 'text-emerald-400' : 'text-amber-400'}`}>
          {retryMessage}
        </div>
      )}

      {expanded && (
        <div className="border-t border-white/[0.04] p-4 space-y-3 text-xs">
          {detailQuery.isLoading && <p className="text-white/40">Carregando detalhes…</p>}
          {detailQuery.data && <DetailContent log={detailQuery.data.data} />}
        </div>
      )}
    </li>
  );
}

function DetailContent({ log }: { log: TiktokEventLogDetail }) {
  return (
    <>
      <DetailGrid log={log} />
      <CodeBlock label="Payload (resumo enviado)" data={log.payload} />
      <CodeBlock label="Resposta TikTok" data={log.response} />
    </>
  );
}

function DetailGrid({ log }: { log: TiktokEventLogDetail }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
      <Metric label="HTTP" value={log.http_status?.toString() ?? '—'} />
      <Metric label="Code TikTok" value={log.tiktok_code !== null ? String(log.tiktok_code) : '—'} />
      <Metric label="Event" value={log.event} />
      <Metric label="Order" value={log.cartpanda_order_id} mono />
    </div>
  );
}

function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-surface-1 border border-white/[0.04] rounded-lg px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      <div className={`text-white/80 truncate ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function CodeBlock({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <pre className="bg-canvas border border-white/[0.04] rounded-lg p-3 overflow-x-auto text-[11px] text-white/70 font-mono">
        {data ? JSON.stringify(data, null, 2) : '(vazio)'}
      </pre>
    </div>
  );
}

function StatusBadge({ success, httpStatus, tiktokCode }: { success: boolean; httpStatus: number | null; tiktokCode: number | null }) {
  const cls = success
    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
    : 'bg-red-500/10 text-red-400 ring-red-500/20';
  let label = 'ERR';
  if (success) label = 'OK';
  else if (httpStatus !== null && (httpStatus < 200 || httpStatus >= 300)) label = String(httpStatus);
  else if (tiktokCode !== null && tiktokCode !== 0) label = String(tiktokCode);
  return (
    <span className={`shrink-0 inline-flex items-center justify-center min-w-[48px] px-2 py-1 rounded-md text-[10px] font-semibold tabular-nums ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

