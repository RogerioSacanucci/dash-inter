import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CheckoutChangeRequest } from '../api/client';
import { EmptyState, EmptyIcons } from '../components/ui/EmptyState';

const textareaClass =
  'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors resize-none';

export default function CheckoutPreview() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ['checkout-preview-token'],
    queryFn: () => api.checkoutPreviewToken(),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['checkout-change-requests'],
    queryFn: () => api.checkoutChangeRequests(),
  });

  const mutation = useMutation({
    mutationFn: (msg: string) => api.submitCheckoutChangeRequest(msg),
    onSuccess: () => {
      setMessage('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['checkout-change-requests'] });
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    mutation.mutate(message);
  }

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 text-sm">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Checkout Preview</h1>
        <p className="text-sm text-white/40">Visualiza o teu checkout e solicita alterações.</p>
      </div>

      <div className="bg-surface-1 rounded-xl border border-zinc-800 p-5 flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Preview</h2>
        {tokenData?.has_preview ? (
          <div>
            <a
              href={tokenData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition-colors"
            >
              Ver Preview
            </a>
            <p className="text-xs text-white/30 mt-2">O link expira em 1 hora. Recarrega a página para obter um novo.</p>
          </div>
        ) : (
          <EmptyState
            icon={EmptyIcons.link}
            message="Sem preview configurado"
            hint="Aguarda que o administrador faça o upload do teu checkout."
          />
        )}
      </div>

      <div className="bg-surface-1 rounded-xl border border-zinc-800 p-5 flex flex-col gap-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Solicitar Alteração</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setSubmitError(null); }}
            maxLength={2000}
            rows={4}
            placeholder="Descreve as alterações que pretendes..."
            className={textareaClass}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-white/25">{message.length}/2000</span>
            <button
              type="submit"
              disabled={mutation.isPending || !message.trim()}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {mutation.isPending ? 'A enviar...' : 'Enviar pedido'}
            </button>
          </div>
          {submitError && <p className="text-sm text-red-400">{submitError}</p>}
          {submitted && <p className="text-sm text-emerald-400">Pedido enviado com sucesso!</p>}
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Histórico de pedidos</h2>
        {requestsLoading && <div className="text-sm text-white/40">A carregar...</div>}
        {!requestsLoading && (requestsData?.data?.length ?? 0) === 0 && (
          <p className="text-sm text-white/30">Nenhum pedido submetido ainda.</p>
        )}
        <div className="flex flex-col gap-3">
          {requestsData?.data?.map((req: CheckoutChangeRequest) => (
            <div key={req.id} className="bg-surface-1 rounded-xl border border-zinc-800 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${req.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {req.status === 'done' ? 'Concluído' : 'Pendente'}
                </span>
                <span className="text-xs text-white/30">{new Date(req.created_at).toLocaleDateString('pt-PT')}</span>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{req.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
