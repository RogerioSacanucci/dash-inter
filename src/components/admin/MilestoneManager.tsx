import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AdminMilestone } from '../../api/client';

interface MilestoneForm {
  value: string;
  order: string;
}

const EMPTY_FORM: MilestoneForm = { value: '', order: '' };

const inputClass =
  'w-full bg-surface-1 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MilestoneManager() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MilestoneForm>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-milestones'],
    queryFn: () => api.adminGetMilestones(),
  });

  const milestones = data?.milestones ?? [];
  const sorted = [...milestones].sort((a, b) => a.order - b.order);

  const createMutation = useMutation({
    mutationFn: (payload: { value: number; order: number }) =>
      api.adminCreateMilestone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['milestone-progress'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { value?: number; order?: number } }) =>
      api.adminUpdateMilestone(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['milestone-progress'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.adminDeleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['milestone-progress'] });
    },
  });

  function startEdit(milestone: AdminMilestone) {
    setEditingId(milestone.id);
    setForm({
      value: String(milestone.value),
      order: String(milestone.order),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(form.value);
    const order = Number(form.order);
    if (!value || !order) return;

    try {
      await createMutation.mutateAsync({ value, order });
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar meta.');
    }
  }

  async function handleUpdate() {
    if (editingId === null) return;
    setError(null);
    const value = Number(form.value);
    const order = Number(form.order);
    if (!value || !order) return;

    try {
      await updateMutation.mutateAsync({ id: editingId, payload: { value, order } });
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar meta.');
    }
  }

  async function handleDelete(milestone: AdminMilestone) {
    if (!confirm(`Remover meta ${formatCurrency(milestone.value)}?`)) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(milestone.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover meta.');
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Metas de Faturamento</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Gerencie os marcos de faturamento exibidos no indicador de progresso
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-surface-2 border border-zinc-800 rounded-xl p-5 mb-6"
      >
        <h3 className="text-sm font-semibold text-white mb-4">Adicionar meta</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm text-white/60 mb-1">Valor (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.value}
              onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
              placeholder="10000"
              required={editingId === null}
              disabled={editingId !== null}
              className={inputClass}
            />
          </div>
          <div className="w-24">
            <label className="block text-sm text-white/60 mb-1">Ordem</label>
            <input
              type="number"
              min="1"
              value={form.order}
              onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
              placeholder="1"
              required={editingId === null}
              disabled={editingId !== null}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={saving || editingId !== null}
            className="px-5 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </form>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-white/40">Carregando...</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-white/40">Nenhuma meta cadastrada.</p>
      ) : (
        <div className="bg-surface-2 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 uppercase tracking-widest py-3 px-5">
                  Ordem
                </th>
                <th className="text-left text-xs font-semibold text-white/30 uppercase tracking-widest py-3 px-5">
                  Valor
                </th>
                <th className="text-right text-xs font-semibold text-white/30 uppercase tracking-widest py-3 px-5">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sorted.map((milestone) => (
                <tr key={milestone.id} className="hover:bg-white/[0.02]">
                  {editingId === milestone.id ? (
                    <>
                      <td className="py-3 px-5">
                        <input
                          type="number"
                          min="1"
                          value={form.order}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, order: e.target.value }))
                          }
                          className={`${inputClass} !w-20`}
                        />
                      </td>
                      <td className="py-3 px-5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.value}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, value: e.target.value }))
                          }
                          className={`${inputClass} !w-40`}
                        />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={handleUpdate}
                            disabled={saving}
                            className="px-3 py-1 text-xs text-brand hover:text-brand-hover border border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1 text-xs text-white/60 hover:text-white border border-zinc-800 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3.5 px-5 text-sm text-white/70">{milestone.order}</td>
                      <td className="py-3.5 px-5 text-sm text-white font-medium">
                        {formatCurrency(milestone.value)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => startEdit(milestone)}
                            className="px-3 py-1 text-xs text-white/60 hover:text-white border border-zinc-800 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(milestone)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
