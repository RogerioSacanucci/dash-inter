import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  CreateTiktokPixelPayload,
  TiktokPixel,
  UpdateTiktokPixelPayload,
} from '../api/client';
import { EmptyState, EmptyIcons } from './ui/EmptyState';

interface FormState {
  pixel_code: string;
  access_token: string;
  label: string;
  test_event_code: string;
}

const emptyForm: FormState = {
  pixel_code: '',
  access_token: '',
  label: '',
  test_event_code: '',
};

const inputClass =
  'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

export default function TiktokPixelManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tiktok-pixels'],
    queryFn: () => api.tiktokPixels(),
  });
  const pixels = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateTiktokPixelPayload) => api.createTiktokPixel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] });
      resetForm();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao adicionar pixel.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTiktokPixelPayload }) =>
      api.updateTiktokPixel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] });
      resetForm();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao atualizar pixel.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTiktokPixel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      api.updateTiktokPixel(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktok-pixels'] }),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  function openEdit(pixel: TiktokPixel) {
    setEditingId(pixel.id);
    setForm({
      pixel_code: pixel.pixel_code,
      access_token: '',
      label: pixel.label ?? '',
      test_event_code: pixel.test_event_code ?? '',
    });
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (editingId === null) {
      createMutation.mutate({
        pixel_code: form.pixel_code.trim(),
        access_token: form.access_token,
        label: form.label.trim() || undefined,
        test_event_code: form.test_event_code.trim() || undefined,
      });
      return;
    }

    const payload: UpdateTiktokPixelPayload = {
      pixel_code: form.pixel_code.trim(),
      label: form.label.trim() || undefined,
      test_event_code: form.test_event_code.trim() || undefined,
    };
    if (form.access_token) {
      payload.access_token = form.access_token;
    }
    updateMutation.mutate({ id: editingId, payload });
  }

  function handleDelete(pixel: TiktokPixel) {
    if (!confirm(`Remover pixel "${pixel.label ?? pixel.pixel_code}"?`)) return;
    deleteMutation.mutate(pixel.id);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="bg-surface-1 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="font-semibold text-white mb-1">
          {editingId === null ? 'Adicionar pixel TikTok' : 'Editar pixel TikTok'}
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Cada pixel dispara um evento CompletePayment ao pagar. Credenciais vêm do TikTok Ads Manager.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-pixel-code">
              Pixel Code
            </label>
            <input
              id="tt-pixel-code"
              type="text"
              required
              value={form.pixel_code}
              onChange={(e) => setForm((f) => ({ ...f, pixel_code: e.target.value }))}
              placeholder="CXXXXXXXXXXXXXX"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-access-token">
              Access Token{editingId !== null && (
                <span className="normal-case font-normal text-white/30"> (deixe em branco para manter)</span>
              )}
            </label>
            <input
              id="tt-access-token"
              type="password"
              required={editingId === null}
              value={form.access_token}
              onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
              placeholder="••••••••••"
              autoComplete="off"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-label">
              Label <span className="normal-case font-normal">(opcional)</span>
            </label>
            <input
              id="tt-label"
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Loja A"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="tt-test-code">
              Test Event Code <span className="normal-case font-normal">(opcional)</span>
            </label>
            <input
              id="tt-test-code"
              type="text"
              value={form.test_event_code}
              onChange={(e) => setForm((f) => ({ ...f, test_event_code: e.target.value }))}
              placeholder="TEST12345"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
            >
              {saving ? 'Salvando...' : editingId === null ? 'Adicionar' : 'Salvar'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 text-white/60 hover:text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-surface-1 rounded-2xl p-6 flex-1 min-w-[260px]">
        <h2 className="font-semibold text-white mb-1">Pixels cadastrados</h2>
        <p className="text-sm text-white/40 mb-6">
          Pixels habilitados disparam eventos em paralelo a cada pagamento confirmado.
        </p>

        {isLoading ? (
          <div className="text-sm text-white/20">Carregando...</div>
        ) : pixels.length === 0 ? (
          <EmptyState icon={EmptyIcons.notification} message="Nenhum pixel cadastrado" hint="Adicione um pixel para começar a rastrear conversões" />
        ) : (
          <div className="flex flex-col gap-2">
            {pixels.map((pixel) => (
              <div
                key={pixel.id}
                className="flex items-center gap-3 bg-surface-2 border border-white/[0.06] rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  {pixel.label && (
                    <p className="text-sm font-medium text-white truncate">{pixel.label}</p>
                  )}
                  <p className={`text-xs font-mono truncate ${pixel.label ? 'text-white/40' : 'text-white/70'}`}>
                    {pixel.pixel_code}
                  </p>
                  {pixel.test_event_code && (
                    <p className="text-[11px] text-yellow-400/70 mt-0.5">
                      Teste: {pixel.test_event_code}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pixel.enabled}
                  onClick={() => toggleMutation.mutate({ id: pixel.id, enabled: !pixel.enabled })}
                  className={`shrink-0 relative w-10 h-5 rounded-full transition-colors ${
                    pixel.enabled ? 'bg-brand' : 'bg-white/10'
                  }`}
                  aria-label={`${pixel.enabled ? 'Desabilitar' : 'Habilitar'} pixel ${pixel.label ?? pixel.pixel_code}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      pixel.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(pixel)}
                  aria-label={`Editar ${pixel.label ?? pixel.pixel_code}`}
                  className="shrink-0 text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M11.5 2.5l2 2L5 13l-3 .5.5-3 9-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pixel)}
                  aria-label={`Remover ${pixel.label ?? pixel.pixel_code}`}
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
  );
}
