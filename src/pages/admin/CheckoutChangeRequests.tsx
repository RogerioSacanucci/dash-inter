import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AdminCheckoutChangeRequest } from '../../api/client';

function StatusBadge({ status }: { status: 'pending' | 'done' }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status === 'done' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
      {status === 'done' ? 'Concluído' : 'Pendente'}
    </span>
  );
}

function ExpandableMessage({ message }: { message: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > 80;
  return (
    <div className="text-sm text-white/70 max-w-xs">
      <span className={!expanded && isLong ? 'line-clamp-2' : ''}>{message}</span>
      {isLong && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="block text-xs text-brand hover:text-brand-hover mt-1">
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </div>
  );
}

export default function CheckoutChangeRequests() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-checkout-change-requests', page],
    queryFn: () => api.adminCheckoutChangeRequests(page),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'done' }) =>
      api.adminUpdateCheckoutChangeRequest(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-checkout-change-requests'] }),
  });

  const requests = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Pedidos de Alteração</h1>

      {isLoading && <div className="text-sm text-white/40">A carregar...</div>}
      {!isLoading && requests.length === 0 && <p className="text-sm text-white/30">Nenhum pedido submetido ainda.</p>}

      {requests.length > 0 && (
        <div className="bg-surface-1 rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-widest">Utilizador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-widest">Mensagem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-widest">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-widest">Estado</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: AdminCheckoutChangeRequest) => (
                <tr key={req.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3 text-white/70 text-xs">{req.user_email}</td>
                  <td className="px-4 py-3"><ExpandableMessage message={req.message} /></td>
                  <td className="px-4 py-3 text-white/40 whitespace-nowrap text-xs">{new Date(req.created_at).toLocaleDateString('pt-PT')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={req.status} />
                      <button
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ id: req.id, status: req.status === 'done' ? 'pending' : 'done' })}
                        className="text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-50 underline underline-offset-2"
                      >
                        {req.status === 'done' ? 'Reabrir' : 'Marcar como feito'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="flex items-center gap-3">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs bg-surface-2 border border-zinc-800 rounded-lg text-white/60 hover:text-white disabled:opacity-30 transition-colors">Anterior</button>
          <span className="text-xs text-white/40">{page} / {meta.pages}</span>
          <button type="button" disabled={page === meta.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs bg-surface-2 border border-zinc-800 rounded-lg text-white/60 hover:text-white disabled:opacity-30 transition-colors">Próximo</button>
        </div>
      )}
    </div>
  );
}
