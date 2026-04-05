import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../../api/client';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-white/[0.08] rounded-xl shadow-xl p-3 text-sm">
      <p className="font-semibold text-white/60 mb-2 text-xs uppercase tracking-wide">
        {formatChartDate(label)}
      </p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name === 'sent' ? 'Enviados' : entry.name === 'failed' ? 'Falhas' : 'Correções'}: {entry.value}
        </p>
      ))}
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
      </div>

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
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400">sim</span>
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
