import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  AdminUserLink,
  CheckoutPreviewListItem,
  CreateUserLinkPayload,
  UpdateUserLinkPayload,
} from '../../api/client';

type LinkType = 'ficheiro' | 'estatico' | 'checkout';

interface FormState {
  user_id: string;
  aapanel_config_id: string;
  label: string;
  external_url: string;
  file_path: string;
  link_type: LinkType;
}

const emptyForm: FormState = {
  user_id: '',
  aapanel_config_id: '',
  label: '',
  external_url: '',
  file_path: '',
  link_type: 'ficheiro',
};

type ListItem =
  | { kind: 'link'; data: AdminUserLink }
  | { kind: 'checkout'; data: CheckoutPreviewListItem };

export default function UserLinkManager() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [checkoutFile, setCheckoutFile] = useState<File | null>(null);
  const [checkoutUploading, setCheckoutUploading] = useState(false);

  function copyLink(id: number, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const { data: linksData, isLoading: loadingLinks } = useQuery({
    queryKey: ['user-links'],
    queryFn: () => api.adminUserLinks(),
  });

  const { data: checkoutData, isLoading: loadingCheckouts } = useQuery({
    queryKey: ['admin-checkout-previews'],
    queryFn: () => api.adminCheckoutPreviews(),
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.adminUsers(1),
  });

  const { data: configsData, isLoading: loadingConfigs } = useQuery({
    queryKey: ['aa-panel-configs'],
    queryFn: () => api.adminAaPanelConfigs(),
  });

  const links = linksData?.data ?? [];
  const checkoutPreviews = checkoutData?.data ?? [];
  const users = usersData?.data ?? [];
  const configs = configsData?.data ?? [];
  const loading = loadingLinks || loadingCheckouts || loadingUsers || loadingConfigs;

  // Merge links and checkout previews into unified list
  const allItems: ListItem[] = [
    ...links.map((data): ListItem => ({ kind: 'link', data })),
    ...checkoutPreviews.map((data): ListItem => ({ kind: 'checkout', data })),
  ];

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserLinkPayload) => api.adminCreateUserLink(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-links'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserLinkPayload }) =>
      api.adminUpdateUserLink(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-links'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.adminDeleteUserLink(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-links'] }),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setCheckoutFile(null);
    setShowForm(true);
  }

  function openEdit(link: AdminUserLink) {
    setEditingId(link.id);
    setForm({
      user_id: String(link.user_id),
      aapanel_config_id: link.aapanel_config_id ? String(link.aapanel_config_id) : '',
      label: link.label,
      external_url: link.external_url,
      file_path: link.file_path ?? '',
      link_type: link.aapanel_config_id === null ? 'estatico' : 'ficheiro',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCheckoutFile(null);
  }

  async function handleSubmitCheckout() {
    if (!checkoutFile || !form.user_id) {
      setError('Seleciona um utilizador e um ficheiro HTML.');
      return;
    }
    setError(null);
    setCheckoutUploading(true);
    try {
      await api.adminUploadCheckoutPreview(Number(form.user_id), checkoutFile);
      queryClient.invalidateQueries({ queryKey: ['admin-checkout-previews'] });
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload.');
    } finally {
      setCheckoutUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.link_type === 'checkout') {
      await handleSubmitCheckout();
      return;
    }

    setError(null);

    try {
      if (editingId === null) {
        const payload: CreateUserLinkPayload = {
          user_id: Number(form.user_id),
          aapanel_config_id: form.link_type === 'estatico' ? null : Number(form.aapanel_config_id),
          label: form.label,
          external_url: form.external_url,
          file_path: form.link_type === 'estatico' ? null : form.file_path,
        };
        await createMutation.mutateAsync(payload);
      } else {
        const payload: UpdateUserLinkPayload = {
          label: form.label,
          external_url: form.external_url,
          file_path: form.link_type === 'estatico' ? null : form.file_path,
        };
        await updateMutation.mutateAsync({ id: editingId, payload });
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar link.');
    }
  }

  async function handleDelete(link: AdminUserLink) {
    if (!confirm(`Remover "${link.label}"?`)) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(link.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover link.');
    }
  }

  async function handleDeleteCheckout(userId: number, email: string) {
    if (!confirm(`Remover checkout preview de "${email}"?`)) return;
    setError(null);
    try {
      await api.adminDeleteCheckoutPreview(userId);
      queryClient.invalidateQueries({ queryKey: ['admin-checkout-previews'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover checkout.');
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => {
      if (field === 'user_id') {
        return { ...prev, user_id: value, aapanel_config_id: '' };
      }
      if (field === 'link_type') {
        return { ...prev, link_type: value as LinkType, aapanel_config_id: '' };
      }
      return { ...prev, [field]: value };
    });
  }

  const filteredConfigs = configs.filter(
    (c) => !form.user_id || c.user_id === Number(form.user_id),
  );

  const saving = createMutation.isPending || updateMutation.isPending || checkoutUploading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Links de utilizadores</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Gerencie os links de ficheiros por utilizador
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Novo link
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-2 border border-zinc-800 rounded-xl p-5 mb-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">
            {editingId === null ? 'Novo link' : 'Editar link'}
          </h3>

          {/* Tipo de link */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Tipo</label>
            <div className="flex gap-2">
              {(['ficheiro', 'estatico', 'checkout'] as LinkType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={editingId !== null}
                  onClick={() => updateField('link_type', type)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    form.link_type === type
                      ? 'bg-brand text-white'
                      : 'bg-surface-1 text-white/50 hover:text-white border border-zinc-800'
                  }`}
                >
                  {type === 'ficheiro' ? 'Ficheiro' : type === 'estatico' ? 'Estático' : 'Checkout'}
                </button>
              ))}
            </div>
          </div>

          {editingId === null && (
            <div>
              <label className="block text-sm text-white/60 mb-1">Utilizador</label>
              <select
                value={form.user_id}
                onChange={(e) => updateField('user_id', e.target.value)}
                required
                className="w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Selecione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Checkout type: only file input */}
          {form.link_type === 'checkout' && (
            <div>
              <label className="block text-sm text-white/60 mb-1">Ficheiro HTML</label>
              <input
                type="file"
                accept=".html,.htm"
                required
                onChange={(e) => setCheckoutFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-white/60 bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 file:mr-3 file:text-xs file:font-medium file:bg-brand file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:cursor-pointer cursor-pointer"
              />
            </div>
          )}

          {/* Ficheiro type: aaPanel + label + external_url + file_path */}
          {form.link_type !== 'checkout' && (
            <>
              {editingId === null && form.link_type === 'ficheiro' && (
                <div>
                  <label className="block text-sm text-white/60 mb-1">Servidor aaPanel</label>
                  <select
                    value={form.aapanel_config_id}
                    onChange={(e) => updateField('aapanel_config_id', e.target.value)}
                    required
                    disabled={!form.user_id}
                    className="w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione...</option>
                    {filteredConfigs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/60 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => updateField('label', e.target.value)}
                  required
                  className="w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">URL externa</label>
                <input
                  type="text"
                  value={form.external_url}
                  onChange={(e) => updateField('external_url', e.target.value)}
                  required
                  placeholder="https://meusite.com"
                  className="w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {form.link_type === 'ficheiro' && (
                <div>
                  <label className="block text-sm text-white/60 mb-1">Caminho do ficheiro</label>
                  <input
                    type="text"
                    value={form.file_path}
                    onChange={(e) => updateField('file_path', e.target.value)}
                    required
                    placeholder="/www/wwwroot/meusite.com/index.html"
                    className="w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono text-xs placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-5 py-2 text-white/60 hover:text-white text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-white/40">Carregando...</p>
      ) : allItems.length === 0 ? (
        <p className="text-sm text-white/40">Nenhum link encontrado.</p>
      ) : (
        <div className="space-y-3">
          {allItems.map((item) => {
            if (item.kind === 'checkout') {
              const preview = item.data;
              return (
                <div
                  key={`checkout-${preview.user_id}`}
                  className="bg-surface-2 border border-zinc-800 rounded-xl px-5 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Checkout Preview</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand/80">
                        checkout
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckout(preview.user_id, preview.user_email)}
                      className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-zinc-800 rounded-lg transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-1">{preview.user_email}</p>
                </div>
              );
            }

            const link = item.data;
            return (
              <div
                key={`link-${link.id}`}
                className="bg-surface-2 border border-zinc-800 rounded-xl px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{link.label}</span>
                    {link.aapanel_config_id === null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-white/40">
                        estático
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyLink(link.id, link.external_url)}
                      className="px-3 py-1 text-xs text-white/60 hover:text-white border border-zinc-800 rounded-lg transition-colors"
                    >
                      {copiedId === link.id ? 'Copiado!' : 'Copiar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(link)}
                      className="px-3 py-1 text-xs text-white/60 hover:text-white border border-zinc-800 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(link)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {link.user_email}
                  {link.aapanel_config_label && (
                    <> &middot; {link.aapanel_config_label}</>
                  )}
                </p>
                {link.file_path && (
                  <p className="text-xs text-white/30 mt-0.5 font-mono min-w-0 truncate">
                    {link.file_path}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
