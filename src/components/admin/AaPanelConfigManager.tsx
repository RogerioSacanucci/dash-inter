import { useState, useEffect, useCallback } from 'react';
import {
  api,
  AdminAaPanelConfig,
  AdminUser,
  CreateAaPanelConfigPayload,
  UpdateAaPanelConfigPayload,
} from '../../api/client';

interface FormState {
  user_id: string;
  label: string;
  panel_url: string;
  api_key: string;
}

const emptyForm: FormState = { user_id: '', label: '', panel_url: '', api_key: '' };

export default function AaPanelConfigManager() {
  const [configs, setConfigs] = useState<AdminAaPanelConfig[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.adminAaPanelConfigs(), api.adminUsers(1)])
      .then(([configsRes, usersRes]) => {
        setConfigs(configsRes.data);
        setUsers(usersRes.data);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar configurações.'),
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

  function openEdit(config: AdminAaPanelConfig) {
    setEditingId(config.id);
    setForm({
      user_id: String(config.user_id),
      label: config.label,
      panel_url: config.panel_url,
      api_key: '',
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
        const payload: CreateAaPanelConfigPayload = {
          user_id: Number(form.user_id),
          label: form.label,
          panel_url: form.panel_url,
          api_key: form.api_key,
        };
        const created = await api.adminCreateAaPanelConfig(payload);
        setConfigs((prev) => [created, ...prev]);
      } else {
        const payload: UpdateAaPanelConfigPayload = {
          label: form.label,
          panel_url: form.panel_url,
          ...(form.api_key ? { api_key: form.api_key } : {}),
        };
        const updated = await api.adminUpdateAaPanelConfig(editingId, payload);
        setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(config: AdminAaPanelConfig) {
    if (!confirm(`Remover "${config.label}"? Links associados também serão removidos.`)) return;
    setError(null);
    try {
      await api.adminDeleteAaPanelConfig(config.id);
      setConfigs((prev) => prev.filter((c) => c.id !== config.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover configuração.');
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Servidores aaPanel</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Gerencie as credenciais de servidores aaPanel por utilizador
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Nova configuração
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
            {editingId === null ? 'Nova configuração' : 'Editar configuração'}
          </h3>

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
            <label className="block text-sm text-white/60 mb-1">Panel URL</label>
            <input
              type="text"
              value={form.panel_url}
              onChange={(e) => updateField('panel_url', e.target.value)}
              required
              placeholder="https://panel.meusite.com:7800"
              className="w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">API Key</label>
            <input
              type="password"
              value={form.api_key}
              onChange={(e) => updateField('api_key', e.target.value)}
              required={editingId === null}
              placeholder={
                editingId === null
                  ? undefined
                  : 'Nova API key (deixe em branco para manter)'
              }
              className="w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

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
      ) : configs.length === 0 ? (
        <p className="text-sm text-white/40">Nenhuma configuração encontrada.</p>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="bg-surface-2 border border-zinc-800 rounded-xl px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{config.label}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(config)}
                    className="px-3 py-1 text-xs text-white/60 hover:text-white border border-zinc-800 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(config)}
                    className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-zinc-800 rounded-lg transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-1">
                {config.user_email} &middot; {config.panel_url}
              </p>
              <p className="text-xs text-white/30 mt-0.5 font-mono">
                {config.api_key_masked}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
