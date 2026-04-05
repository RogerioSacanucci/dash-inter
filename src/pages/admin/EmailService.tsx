import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api, EmailServiceInstance } from '../../api/client';
import { FetchingIndicator } from '../../components/ui/FetchingIndicator';
import { SkeletonTableRows } from '../../components/ui/Skeleton';

const LOG_STATUS_STYLES: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-red-500/10 text-red-400',
};

const USER_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  inactive: 'bg-white/[0.06] text-white/40',
};

const DOC_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400',
  under_review: 'bg-blue-500/10 text-blue-400',
  rejected: 'bg-red-500/10 text-red-400',
};

const BRAND = '#E8552A';
const RED = '#ef4444';
const AMBER = '#f59e0b';

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-white/[0.08] rounded-xl shadow-xl p-3 text-sm">
      <p className="font-semibold text-white/60 mb-2 text-xs uppercase tracking-wide">
        {formatChartDate(label!)}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name === 'sent' ? 'Enviados' : entry.name === 'failed' ? 'Falhas' : 'Correções'}: {entry.value}
        </p>
      ))}
    </div>
  );
}

const inputClass =
  'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

interface InstanceFormProps {
  instance: EmailServiceInstance | null;
  onClose: () => void;
}

function InstanceFormModal({ instance, onClose }: InstanceFormProps) {
  const isEdit = instance !== null;
  const queryClient = useQueryClient();

  const [name, setName] = useState(instance?.name ?? '');
  const [url, setUrl] = useState(instance?.url ?? '');
  const [apiKey, setApiKey] = useState('');
  const [active, setActive] = useState(instance?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; url: string; api_key: string }) =>
      api.adminCreateEmailInstance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-instances'] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<{ name: string; url: string; api_key: string; active: boolean }>) =>
      api.adminUpdateEmailInstance(instance!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-instances'] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isEdit) {
      const payload: Partial<{ name: string; url: string; api_key: string; active: boolean }> = { name, url, active };
      if (apiKey) payload.api_key = apiKey;
      updateMutation.mutate(payload);
    } else {
      if (!apiKey) { setError('API Key é obrigatória.'); return; }
      createMutation.mutate({ name, url, api_key: apiKey });
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6 w-full max-w-md"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Editar instância' : 'Nova instância'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="ei-name">Nome</label>
            <input
              id="ei-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Site Brasil"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="ei-url">URL</label>
            <input
              id="ei-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://site.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="ei-key">
              API Key{isEdit && <span className="normal-case text-white/20 font-normal ml-1">(vazio = manter atual)</span>}
            </label>
            <input
              id="ei-key"
              type="password"
              required={!isEdit}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'Chave configurada no config.php'}
              className={inputClass}
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span className="text-sm text-white/60">Ativa</span>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${active ? 'bg-brand' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </label>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? 'Salvando...' : isEdit ? 'Guardar' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-white/40 hover:text-white/70 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface InstancesManagerProps {
  onClose: () => void;
}

function InstancesManagerModal({ onClose }: InstancesManagerProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EmailServiceInstance | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: instancesData, isLoading } = useQuery({
    queryKey: ['email-instances'],
    queryFn: () => api.adminEmailInstances(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.adminDeleteEmailInstance(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-instances'] }),
    onSettled: () => setDeletingId(null),
  });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && editing === null) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, editing]);

  if (editing !== null) {
    return (
      <InstanceFormModal
        instance={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Instâncias</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors"
            >
              + Nova
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex flex-col gap-2">
          {isLoading ? (
            <p className="text-sm text-white/30 py-8 text-center">Carregando...</p>
          ) : !instancesData?.data.length ? (
            <p className="text-sm text-white/20 py-8 text-center">Nenhuma instância cadastrada.</p>
          ) : (
            instancesData.data.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between bg-surface-2 border border-white/[0.06] rounded-xl px-4 py-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{inst.name}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${inst.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.06] text-white/30'}`}>
                      {inst.active ? 'ativa' : 'inativa'}
                    </span>
                  </div>
                  <span className="text-xs text-white/30 truncate">{inst.url}</span>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(inst)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
                    aria-label="Editar"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === inst.id}
                    onClick={() => { setDeletingId(inst.id); deleteMutation.mutate(inst.id); }}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors disabled:opacity-40"
                    aria-label="Remover"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 4h10M6 4V2h4v2M5 4l.5 9h5l.5-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmailService() {
  const [instanceId, setInstanceId] = useState<number | ''>('');
  const [tab, setTab] = useState<'logs' | 'users'>('logs');
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showInstancesManager, setShowInstancesManager] = useState(false);

  useEffect(() => {
    document.title = 'Serviço de E-mail';
  }, []);

  const { data: instancesData } = useQuery({
    queryKey: ['email-instances'],
    queryFn: () => api.adminEmailInstances(),
  });

  const { data: statsData } = useQuery({
    queryKey: ['email-stats', instanceId, dateFrom, dateTo],
    queryFn: () => api.adminEmailStats({
      instance_id: instanceId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
  });

  const {
    data: logsData,
    isLoading: logsLoading,
    isFetching: logsFetching,
    error: logsError,
    refetch: logsRefetch,
  } = useQuery({
    queryKey: ['email-logs', instanceId, status, email, dateFrom, dateTo, page],
    queryFn: () => api.adminEmailLogs({
      instance_id: instanceId || undefined,
      status: status || undefined,
      email: email || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
    }),
    enabled: tab === 'logs',
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching,
    error: usersError,
    refetch: usersRefetch,
  } = useQuery({
    queryKey: ['email-wallet-users', instanceId, status, email, page],
    queryFn: () => api.adminWalletUsers({
      instance_id: instanceId as number,
      status: status || undefined,
      email: email || undefined,
      page,
    }),
    enabled: tab === 'users' && !!instanceId,
  });

  const isLoading = tab === 'logs' ? logsLoading : usersLoading;
  const isFetching = tab === 'logs' ? logsFetching : usersFetching;
  const error = tab === 'logs' ? logsError : usersError;
  const refetch = tab === 'logs' ? logsRefetch : usersRefetch;

  function handleClear() {
    setStatus('');
    setEmail('');
    setPage(1);
  }

  const inputCls = 'bg-surface-2 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

  const stats = statsData?.data;
  const chart = stats?.chart ?? [];

  const activeData = tab === 'logs' ? logsData : usersData;
  const meta = activeData?.meta;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Serviço de E-mail</h1>
        <button
          type="button"
          onClick={() => setShowInstancesManager(true)}
          className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white/80 text-xs font-semibold rounded-xl transition-colors"
        >
          Gerir instâncias
        </button>
      </div>

      {showInstancesManager && <InstancesManagerModal onClose={() => setShowInstancesManager(false)} />}

      <FetchingIndicator isFetching={isFetching && !isLoading} />

      {/* Instance + Date filters */}
      <div className="bg-surface-1 border border-white/[0.06] rounded-2xl px-5 py-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Instância</label>
          <select
            value={instanceId}
            onChange={(e) => { setInstanceId(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
            className={inputCls}
          >
            <option value="">Todas as instâncias</option>
            {instancesData?.data.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">De</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Até</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={inputCls} />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-1 border border-white/[0.06] rounded-2xl px-5 py-4">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1">Enviados</p>
          <p className="text-2xl font-bold text-white tabular-nums">{stats?.total ?? '—'}</p>
        </div>
        <div className="bg-surface-1 border border-white/[0.06] rounded-2xl px-5 py-4">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1">Falhas</p>
          <p className="text-2xl font-bold text-red-400 tabular-nums">{stats?.failures ?? '—'}</p>
        </div>
        <div className="bg-surface-1 border border-white/[0.06] rounded-2xl px-5 py-4">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1">Taxa de Sucesso</p>
          <p className="text-2xl font-bold text-white tabular-nums">{stats ? `${stats.success_rate}%` : '—'}</p>
        </div>
        <div className="bg-surface-1 border border-white/[0.06] rounded-2xl px-5 py-4">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1">Correções</p>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{stats?.corrections ?? '—'}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface-1 border border-white/[0.06] rounded-2xl p-5">
        {!chart.length ? (
          <div className="flex items-center justify-center h-48 text-white/20 text-sm">
            Sem dados para o período selecionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="emailSentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'Plus Jakarta Sans' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'Plus Jakarta Sans' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="sent" name="sent" stroke={BRAND} strokeWidth={2} fill="url(#emailSentGrad)" />
              <Area type="monotone" dataKey="failed" name="failed" stroke={RED} strokeWidth={1.5} fill="transparent" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="corrections" name="corrections" stroke={AMBER} strokeWidth={1.5} fill="transparent" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={() => { setTab('logs'); setStatus(''); setEmail(''); setPage(1); }}
          className={`pb-2 text-sm font-semibold transition-colors ${tab === 'logs' ? 'border-b-2 border-brand text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          Logs de E-mail
        </button>
        <button
          type="button"
          onClick={() => { setTab('users'); setStatus(''); setEmail(''); setPage(1); }}
          className={`pb-2 text-sm font-semibold transition-colors ${tab === 'users' ? 'border-b-2 border-brand text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          Usuários Wallet
        </button>
      </div>

      {/* Tab filters */}
      <div className="bg-surface-1 border border-white/[0.06] rounded-2xl px-5 py-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">Todos</option>
            {tab === 'logs' ? (
              <>
                <option value="success">success</option>
                <option value="failed">failed</option>
              </>
            ) : (
              <>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </>
            )}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setPage(1); }}
            placeholder="ex: user@example.com"
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 bg-white/[0.04] transition-colors"
        >
          Limpar
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          {error instanceof Error ? error.message : 'Erro ao carregar dados.'}
          <button type="button" onClick={() => refetch()} className="text-red-400/70 hover:text-red-400 underline text-xs">Tentar novamente</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-1 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'logs' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Data', 'Instância', 'Destinatário', 'Assunto', 'Conta SMTP', 'Status', 'Corrigido', 'Erro'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <SkeletonTableRows rows={8} cols={[18, 14, 18, 16, 12, 10, 10, 16]} />
                ) : !logsData?.data.length ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-white/20 text-sm">Nenhum log encontrado</td>
                  </tr>
                ) : (
                  logsData.data.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white/40 tabular-nums whitespace-nowrap">{new Date(log.created_at).toLocaleString('pt-PT')}</td>
                      <td className="py-3 px-4 text-white/50">{log.instance_name}</td>
                      <td className="py-3 px-4 text-white/70">{log.recipient_email}</td>
                      <td className="py-3 px-4 text-white/50 max-w-[200px] truncate">{log.subject ?? '—'}</td>
                      <td className="py-3 px-4 text-white/50 text-xs font-mono">{log.smtp_account}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${LOG_STATUS_STYLES[log.status]}`}>{log.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        {log.original_email != null ? (
                          <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-mono bg-amber-500/10 text-amber-400" title={log.original_email}>
                            {log.original_email}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white/30 text-xs max-w-[200px] truncate">{log.error_message ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : !instanceId ? (
            <div className="py-12 text-center text-white/20 text-sm">
              Selecione uma instância para ver os usuários do wallet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Email', 'Nome', 'Produto', 'Status', 'Criado em', 'Primeiro Login', 'Doc Status'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <SkeletonTableRows rows={8} cols={[20, 16, 16, 12, 16, 16, 14]} />
                ) : !usersData?.data.length ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/20 text-sm">Nenhum usuário encontrado</td>
                  </tr>
                ) : (
                  usersData.data.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white/70">{user.email}</td>
                      <td className="py-3 px-4 text-white/50">{user.name ?? '—'}</td>
                      <td className="py-3 px-4 text-white/50">{user.product_name ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${USER_STATUS_STYLES[user.status]}`}>{user.status}</span>
                      </td>
                      <td className="py-3 px-4 text-white/40 tabular-nums whitespace-nowrap">{new Date(user.created_at).toLocaleString('pt-PT')}</td>
                      <td className="py-3 px-4 text-white/40 tabular-nums whitespace-nowrap">{user.first_login_at ? new Date(user.first_login_at).toLocaleString('pt-PT') : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${DOC_STATUS_STYLES[user.doc_status]}`}>{user.doc_status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">{meta.total} registros</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 disabled:opacity-30 bg-white/[0.04] transition-colors"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1.5 text-xs text-white/30">{page} / {meta.pages}</span>
              <button
                type="button"
                disabled={page >= meta.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 disabled:opacity-30 bg-white/[0.04] transition-colors"
              >
                Próximo →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
