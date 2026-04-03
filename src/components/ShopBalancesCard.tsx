import { useState } from 'react';
import { UserShopBalance } from '../api/client';

interface Props {
  shopBalances: UserShopBalance[];
}

const ACCOUNT_COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#10b981'];

function fmtBalance(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (value < 0 ? '-$\u00a0' : '$\u00a0') + abs;
}

export default function ShopBalancesCard({ shopBalances }: Props) {
  const [selected, setSelected] = useState<string>('all');

  if (shopBalances.length === 0) return null;

  const filtered = selected === 'all'
    ? shopBalances
    : shopBalances.filter((s) => String(s.account_index) === selected);

  const totals = {
    balance_pending: shopBalances.reduce((sum, s) => sum + s.balance_pending, 0),
    balance_released: shopBalances.reduce((sum, s) => sum + s.balance_released, 0),
    balance_reserve: shopBalances.reduce((sum, s) => sum + s.balance_reserve, 0),
  };

  return (
    <div className="bg-surface-1 rounded-2xl border border-white/[0.06] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-[15px] font-semibold text-white">Saldo por Conta</span>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-surface-2 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
        >
          <option value="all">Todas as contas</option>
          {shopBalances.map((s) => (
            <option key={s.account_index} value={s.account_index}>
              Conta {s.account_index + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="px-6 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Saldo por conta</caption>
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left pb-2.5 text-[11px] font-semibold text-white/35 uppercase tracking-widest">Conta</th>
              <th className="text-right pb-2.5 text-[11px] font-semibold text-white/35 uppercase tracking-widest">A Liberar</th>
              <th className="text-right pb-2.5 text-[11px] font-semibold text-white/35 uppercase tracking-widest">Liberado</th>
              <th className="text-right pb-2.5 text-[11px] font-semibold text-white/35 uppercase tracking-widest">Reserva</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.account_index} className="border-b border-white/[0.03] fine-hover:bg-white/[0.02] transition-colors">
                <td className="py-3 text-white font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: ACCOUNT_COLORS[s.account_index % ACCOUNT_COLORS.length] }}
                    />
                    Conta {s.account_index + 1}
                  </span>
                </td>
                <td className="py-3 text-right text-white/85 tabular-nums">{fmtBalance(s.balance_pending)}</td>
                <td className="py-3 text-right text-brand tabular-nums">{fmtBalance(s.balance_released)}</td>
                <td className="py-3 text-right text-amber-400 tabular-nums">{fmtBalance(s.balance_reserve)}</td>
              </tr>
            ))}
          </tbody>
          {selected === 'all' && shopBalances.length > 1 && (
            <tfoot>
              <tr className="border-t border-white/[0.08]">
                <td className="py-3 text-white/50 font-semibold text-xs uppercase tracking-wider">Total</td>
                <td className="py-3 text-right text-white font-bold tabular-nums">{fmtBalance(totals.balance_pending)}</td>
                <td className="py-3 text-right text-brand font-bold tabular-nums">{fmtBalance(totals.balance_released)}</td>
                <td className="py-3 text-right text-amber-400 font-bold tabular-nums">{fmtBalance(totals.balance_reserve)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Disclaimer */}
      <div className="px-6 pb-4 pt-3">
        <p className="text-[11px] text-white/20 italic">
          Breakdown parcial — pedidos antigos sem loja atribuída não estão incluídos.
        </p>
      </div>
    </div>
  );
}
