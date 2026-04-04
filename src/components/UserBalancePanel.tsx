import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Balance } from '../api/client';
import { FetchingIndicator } from './ui/FetchingIndicator';
import { SkeletonTableRows } from './ui/Skeleton';
import PayoutModal from './PayoutModal';

interface Props {
  userId: number;
}

function formatBalance(value: string): string {
  const num = parseFloat(value ?? '0');
  const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (num < 0 ? '-$\u00a0' : '$\u00a0') + abs;
}

export default function UserBalancePanel({ userId }: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['user-balance', userId, page],
    queryFn: () => api.adminGetUserBalance(userId, page),
  });

  function handlePayoutSuccess(_balance: Balance) {
    setShowModal(false);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ['user-balance', userId] });
  }

  const releasedIsNegative = data && parseFloat(data.balance.balance_released) < 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Balance cards */}
      <div className="bg-surface-1 rounded-2xl px-6 py-5">
        <FetchingIndicator isFetching={isFetching && !isLoading} />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex divide-x divide-white/[0.06] gap-0">
            <div className="pr-8 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                Saldo a Liberar
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-white">
                {isLoading ? '—' : formatBalance(data?.balance.balance_pending ?? '0')}
              </p>
            </div>
            <div className="pl-8 pr-8 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                Reserva
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums leading-none text-white">
                {isLoading ? '—' : formatBalance(data?.balance.balance_reserve ?? '0')}
              </p>
            </div>
            <div className="pl-8 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                Saldo Liberado
              </p>
              <p className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${releasedIsNegative ? 'text-red-400' : 'text-white'}`}>
                {isLoading ? '—' : formatBalance(data?.balance.balance_released ?? '0')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-hover active:scale-[0.97] text-white text-sm font-semibold rounded-xl transition-[color,background-color,transform] duration-[160ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shrink-0"
          >
            Simular Saque
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error instanceof Error ? error.message : 'Erro ao carregar saldo.'}
        </div>
      )}

      {/* Payout logs table */}
      <div className="bg-surface-1 rounded-2xl">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Histórico de Saques</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Data', 'Tipo', 'Valor', 'Loja', 'Admin', 'Nota'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-xs font-semibold text-white/30 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <SkeletonTableRows rows={5} cols={[55, 40, 45, 50, 60, 40]} />
              ) : !data?.payout_logs.data.length ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-white/20 text-sm">
                    Sem histórico de saques
                  </td>
                </tr>
              ) : (
                data.payout_logs.data.map((log) => (
                  <tr key={log.id} className="fine-hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-white/40 tabular-nums">
                      {new Date(log.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        log.type === 'withdrawal'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {log.type === 'withdrawal' ? 'Saque' : 'Ajuste'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <span className={parseFloat(log.amount) < 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {formatBalance(log.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white/50">{log.shop_name ?? '—'}</td>
                    <td className="py-3.5 px-4 text-white/50">{log.admin_email}</td>
                    <td className="py-3.5 px-4 text-white/40">{log.note ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.payout_logs.meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">
              {data.payout_logs.meta.total} registros
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 disabled:opacity-30 bg-white/[0.04] transition-colors"
              >
                ← Anterior
              </button>
              <button
                type="button"
                disabled={page >= data.payout_logs.meta.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 disabled:opacity-30 bg-white/[0.04] transition-colors"
              >
                Próximo →
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <PayoutModal
          userId={userId}
          shopBalances={data?.shop_balances ?? []}
          onClose={() => setShowModal(false)}
          onSuccess={handlePayoutSuccess}
        />
      )}
    </div>
  );
}
