import { useState } from 'react';
import { api, Balance, PayoutPayload, ShopBalance } from '../api/client';

interface Props {
  userId: number;
  shopBalances: ShopBalance[];
  onClose: () => void;
  onSuccess: (balance: Balance) => void;
}

function fmtBalance(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (value < 0 ? '-$\u00a0' : '$\u00a0') + abs;
}

export default function PayoutModal({ userId, shopBalances, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'withdrawal' | 'adjustment'>('withdrawal');
  const [note, setNote] = useState('');
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: PayoutPayload = {
      amount: parseFloat(amount),
      type,
      note: note.trim() || undefined,
      shop_id: shopId,
    };

    try {
      const balance = await api.adminPayout(userId, payload);
      onSuccess(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar payout.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors";
  const labelCls = "block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">Simular Saque</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {shopBalances.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Loja', 'A Liberar', 'Liberado', 'Reserva'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-xs font-semibold text-white/30 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {shopBalances.map((s) => (
                    <tr key={s.shop_id}>
                      <td className="py-2.5 px-3 text-white/70">{s.shop_name}</td>
                      <td className="py-2.5 px-3 text-white/50 tabular-nums">{fmtBalance(s.balance_pending)}</td>
                      <td className="py-2.5 px-3 text-white/50 tabular-nums">{fmtBalance(s.balance_released)}</td>
                      <td className="py-2.5 px-3 text-white/50 tabular-nums">{fmtBalance(s.balance_reserve)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <label className={labelCls}>Valor (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'withdrawal' | 'adjustment')}
              className={inputCls}
            >
              <option value="withdrawal">Saque (débito)</option>
              <option value="adjustment">Ajuste (positivo = crédito)</option>
            </select>
          </div>

          {shopBalances.length > 0 && (
            <div>
              <label className={labelCls}>Loja</label>
              <select
                value={shopId ?? ''}
                onChange={(e) => setShopId(e.target.value ? Number(e.target.value) : undefined)}
                className={inputCls}
                required={type === 'withdrawal'}
              >
                <option value="">Selecionar loja...</option>
                {shopBalances.map((s) => (
                  <option key={s.shop_id} value={s.shop_id}>{s.shop_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Nota (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Ex: Saque mensal"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !amount || (type === 'withdrawal' && shopBalances.length > 0 && !shopId)}
              className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {loading ? 'Processando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
