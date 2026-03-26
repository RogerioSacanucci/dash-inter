import { useState, useEffect, FormEvent } from 'react';
import { api } from '../api/client';

const NOTIFY_OPTIONS: { value: 'all' | 'created' | 'paid'; label: string; description: string }[] = [
  { value: 'all',     label: 'Ambas',   description: 'Gerado e pago' },
  { value: 'created', label: 'Gerado',  description: 'Só ao criar'   },
  { value: 'paid',    label: 'Pago',    description: 'Só ao confirmar' },
];

export default function Settings() {
  const [pushcutUrl, setPushcutUrl]       = useState('');
  const [pushcutNotify, setPushcutNotify] = useState<'all' | 'created' | 'paid'>('all');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Configurações — StatsChecker';
  }, []);

  useEffect(() => {
    api.me()
      .then(({ user }) => {
        setPushcutUrl(user.pushcut_url ?? '');
        setPushcutNotify(user.pushcut_notify ?? 'all');
      })
      .catch(() => setError('Erro ao carregar configurações.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await api.updateSettings({ pushcut_url: pushcutUrl, pushcut_notify: pushcutNotify });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-white/40 mt-0.5">Gerencie as suas notificações</p>
      </div>

      <div className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6">
        <h2 className="font-semibold text-white mb-1">Pushcut</h2>
        <p className="text-sm text-white/40 mb-6">
          Configure a URL do Pushcut para receber notificações quando um pagamento for criado ou confirmado.
        </p>

        {loading ? (
          <div className="text-sm text-white/20">Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                Configurações salvas com sucesso.
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="pushcut_url">
                URL do Pushcut
              </label>
              <input
                id="pushcut_url"
                type="url"
                value={pushcutUrl}
                onChange={(e) => { setPushcutUrl(e.target.value); setSuccess(false); }}
                placeholder="https://api.pushcut.io/SEU_TOKEN/notifications/NOME"
                className="bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
              />
              <p className="text-xs text-white/30">
                Deixe em branco para desativar as notificações.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                Receber notificações de
              </p>
              <div className="flex bg-surface-2 border border-white/[0.08] rounded-xl p-1 gap-1">
                {NOTIFY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setPushcutNotify(opt.value); setSuccess(false); }}
                    className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                      pushcutNotify === opt.value
                        ? 'bg-surface-1 text-white shadow-sm border border-white/[0.08]'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[11px] text-white/30 mt-0.5">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              {pushcutUrl && (
                <button
                  type="button"
                  onClick={() => { setPushcutUrl(''); setSuccess(false); }}
                  className="px-5 py-2.5 text-sm text-white/40 hover:text-white/70 rounded-xl hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  Remover
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
