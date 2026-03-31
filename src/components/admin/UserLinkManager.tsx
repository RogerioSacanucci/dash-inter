import { useState, useEffect, useCallback } from 'react';
import {
  api,
  AdminUserLink,
  AdminUser,
  AdminAaPanelConfig,
  CreateUserLinkPayload,
  UpdateUserLinkPayload,
} from '../../api/client';

interface FormState {
  user_id: string;
  aapanel_config_id: string;
  label: string;
  external_url: string;
  file_path: string;
  is_static: boolean;
}

const emptyForm: FormState = {
  user_id: '',
  aapanel_config_id: '',
  label: '',
  external_url: '',
  file_path: '',
  is_static: false,
};

export default function UserLinkManager() {
  const [links, setLinks] = useState<AdminUserLink[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [configs, setConfigs] = useState<AdminAaPanelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function copyLink(id: number, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.adminUserLinks(), api.adminUsers(1), api.adminAaPanelConfigs()])
      .then(([linksRes, usersRes, configsRes]) => {
        setLinks(linksRes.data);
        setUsers(usersRes.data);
        setConfigs(configsRes.data);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar links.'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
      is_static: link.aapanel_config_id === null,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId === null) {
        const payload: CreateUserLinkPayload = {
          user_id: Number(form.user_id),
          aapanel_config_id: form.is_static ? null : Number(form.aapanel_config_id),
          label: form.label,
          external_url: form.external_url,
          file_path: form.is_static ? null : form.file_path,
        };
        const created = await api.adminCreateUserLink(payload);
        setLinks((prev) => [created, ...prev]);
      } else {
        const payload: UpdateUserLinkPayload = {
          label: form.label,
          external_url: form.external_url,
          file_path: form.is_static ? null : form.file_path,
        };
        const updated = await api.adminUpdateUserLink(editingId, payload);
        setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar link.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(link: AdminUserLink) {
    if (!confirm(`Remover "${link.label}"?`)) return;
    setError(null);
    try {
      await api.adminDeleteUserLink(link.id);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover link.');
    }
  }

  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      if (field === 'user_id') {
        return { ...prev, user_id: value as string, aapanel_config_id: '' };
      }
      if (field === 'is_static') {
        return { ...prev, is_static: value as boolean, aapanel_config_id: '' };
      }
      return { ...prev, [field]: value };
    });
  }

  const filteredConfigs = configs.filter(
    (c) => !form.user_id || c.user_id === Number(form.user_id),
  );

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
              <button
                type="button"
                onClick={() => updateField('is_static', false)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !form.is_static
                    ? 'bg-brand text-white'
                    : 'bg-surface-1 text-white/50 hover:text-white border border-zinc-800'
                }`}
              >
                Ficheiro
              </button>
              <button
                type="button"
                onClick={() => updateField('is_static', true)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  form.is_static
                    ? 'bg-brand text-white'
                    : 'bg-surface-1 text-white/50 hover:text-white border border-zinc-800'
                }`}
              >
                Estático
              </button>
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

          {editingId === null && !form.is_static && (
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

          {!form.is_static && (
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
      ) : links.length === 0 ? (
        <p className="text-sm text-white/40">Nenhum link encontrado.</p>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
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
                    className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-zinc-800 rounded-lg transition-colors"
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
          ))}
        </div>
      )}
    </div>
  );
}
