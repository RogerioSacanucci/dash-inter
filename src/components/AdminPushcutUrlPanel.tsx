import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreatePushcutUrlPayload } from '../api/client';

const NOTIFY_OPTIONS: { value: 'all' | 'created' | 'paid'; label: string }[] = [
  { value: 'all',     label: 'Ambas'  },
  { value: 'created', label: 'Gerado' },
  { value: 'paid',    label: 'Pago'   },
];

const inputClass =
  'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

interface Props {
  userId: number;
}

export default function AdminPushcutUrlPanel({ userId }: Props) {
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl]       = useState('');
  const [newLabel, setNewLabel]   = useState('');
  const [newNotify, setNewNotify] = useState<'all' | 'created' | 'paid'>('all');
  const [addError, setAddError]   = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pushcut-urls', userId],
    queryFn: () => api.adminPushcutUrls(userId),
  });
  const urls = data?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (payload: CreatePushcutUrlPayload) => api.adminCreatePushcutUrl(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pushcut-urls', userId] });
      setNewUrl('');
      setNewLabel('');
      setNewNotify('all');
      setAddError(null);
    },
    onError: (err) => setAddError(err instanceof Error ? err.message : 'Erro ao adicionar URL.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.adminDeletePushcutUrl(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-pushcut-urls', userId] }),
  });

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    addMutation.mutate({ url: newUrl, notify: newNotify, label: newLabel.trim() || undefined });
  }

  return (
    <div className="flex gap-4 flex-wrap mt-2">
      {/* Add form */}
      <div className="bg-surface-1 rounded-2xl p-6 w-full max-w-sm">
        <h4 className="text-sm font-semibold text-white mb-4">Adicionar URL (admin)</h4>

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          {addError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {addError}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="apu-url">
              URL Pushcut
            </label>
            <input
              id="apu-url"
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://api.pushcut.io/TOKEN/notifications/NOME"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="apu-label">
              Label <span className="normal-case font-normal text-white/20">(opcional)</span>
            </label>
            <input
              id="apu-label"
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex: iPhone ops"
              maxLength={100}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Notificar</span>
            <div className="flex gap-2">
              {NOTIFY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewNotify(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    newNotify === opt.value
                      ? 'bg-brand text-white'
                      : 'bg-surface-2 text-white/40 hover:text-white/70'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={addMutation.isPending}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* URL list */}
      <div className="bg-surface-1 rounded-2xl p-6 flex-1 min-w-64">
        <h4 className="text-sm font-semibold text-white mb-4">URLs ativas</h4>

        {isLoading ? (
          <p className="text-sm text-white/20">Carregando...</p>
        ) : !urls.length ? (
          <p className="text-sm text-white/20">Nenhuma URL configurada.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {urls.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 bg-surface-2 rounded-xl px-4 py-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  {item.label && (
                    <span className="text-xs font-semibold text-white/60 truncate">{item.label}</span>
                  )}
                  <span className="text-xs text-white/30 truncate">{item.url}</span>
                  <span className="text-[10px] text-white/20 uppercase tracking-widest">
                    {item.notify === 'all' ? 'Ambas' : item.notify === 'created' ? 'Gerado' : 'Pago'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  aria-label="Remover URL"
                  className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
