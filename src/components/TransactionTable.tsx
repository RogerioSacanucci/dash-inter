import { Transaction } from '../api/client';
import { SkeletonTableRows } from './ui/Skeleton';
import { EmptyState, EmptyIcons } from './ui/EmptyState';

const STATUS_CLASSES: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  PENDING:   'bg-amber-500/10  text-amber-400  ring-1 ring-amber-500/20',
  FAILED:    'bg-red-500/10    text-red-400    ring-1 ring-red-500/20',
  EXPIRED:   'bg-white/[0.05]  text-white/30   ring-1 ring-white/10',
  DECLINED:  'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluída',
  PENDING:   'Pendente',
  FAILED:    'Falhada',
  EXPIRED:   'Expirada',
  DECLINED:  'Recusada',
};

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export default function TransactionTable({ transactions, loading }: Props) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Lista de transações</caption>
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['ID', 'Valor', 'Método', 'Status', 'Pagador', 'Data'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="text-left py-3 px-4 text-xs font-semibold text-white/30 uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={5} cols={[60, 30, 25, 35, 40, 45]} />
          </tbody>
        </table>
      </div>
    );
  }

  if (!transactions.length) {
    return <EmptyState icon={EmptyIcons.transaction} message="Nenhuma transação encontrada" hint="Tente ajustar os filtros ou o período" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Lista de transações</caption>
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['ID', 'Valor', 'Método', 'Status', 'Pagador', 'Data'].map((h) => (
              <th
                key={h}
                scope="col"
                className="text-left py-3 px-4 text-xs font-semibold text-white/30 uppercase tracking-widest"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {transactions.map((tx) => (
            <tr key={tx.transaction_id} className="fine-hover:bg-white/[0.02] transition-colors">
              <td className="py-3.5 px-4 max-w-[140px]">
                <span
                  className="block truncate font-mono text-xs text-white/30"
                  title={tx.transaction_id}
                  aria-label={`ID: ${tx.transaction_id}`}
                >
                  {tx.transaction_id}
                </span>
              </td>
              <td className="py-3.5 px-4 font-bold tabular-nums text-white">
                €&nbsp;{tx.amount.toFixed(2).replace('.', ',')}
              </td>
              <td className="py-3.5 px-4">
                <span className={`uppercase text-xs font-semibold tracking-wide ${
                  tx.method === 'mbway' ? 'text-indigo-400' :
                  tx.method === 'multibanco' ? 'text-amber-400' :
                  'text-white/40'
                }`}>
                  {tx.method}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[tx.status] ?? 'bg-white/5 text-white/30 ring-1 ring-white/10'}`}>
                  {STATUS_LABELS[tx.status] ?? tx.status}
                </span>
              </td>
              <td className="py-3.5 px-4 text-white/50">
                {tx.payer_name ?? '—'}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="text-white/60 text-sm">
                  {new Date(tx.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="text-xs text-white/30 mt-0.5">
                  {new Date(tx.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
