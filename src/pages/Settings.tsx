// src/pages/Settings.tsx
import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import Tabs, { Tab } from '../components/Tabs';
import UserManagement from '../components/UserManagement';
import AaPanelConfigManager from '../components/admin/AaPanelConfigManager';
import UserLinkManager from '../components/admin/UserLinkManager';
import MilestoneManager from '../components/admin/MilestoneManager';
import TiktokPixelManager from '../components/TiktokPixelManager';
import { EmptyState, EmptyIcons } from '../components/ui/EmptyState';

const TABS: Tab[] = [
  { key: 'notifications', label: 'Notificações' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'users', label: 'Usuários', adminOnly: true },
  { key: 'aapanel', label: 'Servidores aaPanel', adminOnly: true },
  { key: 'links-admin', label: 'Links', adminOnly: true },
  { key: 'milestones', label: 'Metas', adminOnly: true },
];

const NOTIFY_OPTIONS: { value: 'all' | 'created' | 'paid'; label: string; description: string }[] = [
  { value: 'all',     label: 'Ambas',   description: 'Gerado e pago'    },
  { value: 'created', label: 'Gerado',  description: 'Só ao criar'      },
  { value: 'paid',    label: 'Pago',    description: 'Só ao confirmar'  },
];

const inputClass =
  'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('notifications');
  const queryClient = useQueryClient();

  // --- add form state ---
  const [newUrl, setNewUrl]       = useState('');
  const [newLabel, setNewLabel]   = useState('');
  const [newNotify, setNewNotify] = useState<'all' | 'created' | 'paid'>('all');
  const [addError, setAddError]   = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Configurações';
  }, []);

  const { data: urlsData, isLoading: listLoading } = useQuery({
    queryKey: ['pushcut-urls'],
    queryFn: () => api.pushcutUrls(),
  });
  const urls = urlsData?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (payload: { url: string; notify: 'all' | 'created' | 'paid'; label?: string }) =>
      api.createPushcutUrl(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushcut-urls'] });
      setNewUrl('');
      setNewLabel('');
      setNewNotify('all');
      setAddError(null);
    },
    onError: (err) => {
      setAddError(err instanceof Error ? err.message : 'Erro ao adicionar URL.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePushcutUrl(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushcut-urls'] });
    },
  });

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    addMutation.mutate({
      url: newUrl,
      notify: newNotify,
      label: newLabel.trim() || undefined,
    });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-white/40 mt-0.5">Gerencie as suas preferências</p>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} isAdmin={isAdmin} />

      {activeTab === 'notifications' && (
        <div className="flex gap-4 flex-wrap">
          {/* Add URL card */}
          <div className="bg-surface-1 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-white mb-1">Pushcut</h2>
            <p className="text-sm text-white/40 mb-6">
              Adicione URLs para receber notificações de pagamentos criados ou confirmados.
            </p>

            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              {addError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  {addError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="pc-url">
                  URL do Pushcut
                </label>
                <input
                  id="pc-url"
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://api.pushcut.io/SEU_TOKEN/notifications/NOME"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="pc-label">
                  Label <span className="normal-case font-normal">(opcional)</span>
                </label>
                <input
                  id="pc-label"
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="iPhone"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                  Notificar quando
                </p>
                <div className="flex bg-surface-2 border border-white/[0.08] rounded-xl p-1 gap-1">
                  {NOTIFY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewNotify(opt.value)}
                      className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
                        newNotify === opt.value
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

              <button
                type="submit"
                disabled={addMutation.isPending}
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
              >
                {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </button>
            </form>
          </div>

          {/* URL list card */}
          <div className="bg-surface-1 rounded-2xl p-6 flex-1 min-w-[260px]">
            <h2 className="font-semibold text-white mb-1">URLs cadastradas</h2>
            <p className="text-sm text-white/40 mb-6">
              Cada URL recebe notificações de acordo com a sua preferência.
            </p>

            {listLoading ? (
              <div className="text-sm text-white/20">Carregando...</div>
            ) : urls.length === 0 ? (
              <EmptyState icon={EmptyIcons.notification} message="Nenhuma URL cadastrada" hint="Adicione uma URL para receber notificações" />
            ) : (
              <div className="flex flex-col gap-2">
                {urls.map((dest) => (
                  <div
                    key={dest.id}
                    className="flex items-center gap-3 bg-surface-2 border border-white/[0.06] rounded-xl px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      {dest.label && (
                        <p className="text-sm font-medium text-white truncate">{dest.label}</p>
                      )}
                      <p className={`text-xs truncate ${dest.label ? 'text-white/40' : 'text-white/70'}`}>
                        {dest.url}
                      </p>
                    </div>
                    <span className="shrink-0 bg-surface-1 border border-white/[0.08] text-white/50 text-[11px] rounded px-1.5 py-0.5">
                      {NOTIFY_OPTIONS.find((o) => o.value === dest.notify)?.label ?? dest.notify}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(dest.id)}
                      aria-label={`Remover ${dest.label ?? dest.url}`}
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
      )}

      {activeTab === 'tiktok' && <TiktokPixelManager />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'aapanel' && <AaPanelConfigManager />}
      {activeTab === 'links-admin' && <UserLinkManager />}
      {activeTab === 'milestones' && <MilestoneManager />}
    </div>
  );
}
