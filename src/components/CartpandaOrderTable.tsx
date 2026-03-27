import { CartpandaOrder } from '../api/client';

const STATUS_CLASSES: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  PENDING:   'bg-amber-500/10  text-amber-400  ring-1 ring-amber-500/20',
  FAILED:    'bg-red-500/10    text-red-400    ring-1 ring-red-500/20',
  DECLINED:  'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  REFUNDED:  'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluído',
  PENDING:   'Pendente',
  FAILED:    'Falhado',
  DECLINED:  'Recusado',
  REFUNDED:  'Reembolsado',
};

interface Props {
  orders: CartpandaOrder[];
  loading: boolean;
}

export default function CartpandaOrderTable({ orders, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-white/20 text-sm">
        Carregando...
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex justify-center py-16 text-white/20 text-sm">
        Nenhum pedido encontrado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Lista de pedidos Cartpanda</caption>
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['ID Pedido', 'Valor', 'Evento', 'Status', 'Comprador', 'Data'].map((h) => (
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
          {orders.map((order) => (
            <tr key={order.cartpanda_order_id} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-3.5 px-4 max-w-[140px]">
                <span
                  className="block truncate font-mono text-xs text-white/30"
                  title={order.cartpanda_order_id}
                  aria-label={`ID: ${order.cartpanda_order_id}`}
                >
                  {order.cartpanda_order_id}
                </span>
              </td>
              <td className="py-3.5 px-4 font-bold tabular-nums text-white">
                $&nbsp;{order.amount.toFixed(2).replace('.', ',')}
              </td>
              <td className="py-3.5 px-4">
                <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/20 px-2 py-0.5 rounded-md">
                  {order.event}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[order.status] ?? 'bg-white/5 text-white/30 ring-1 ring-white/10'}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </td>
              <td className="py-3.5 px-4 text-white/50">
                {order.payer_name ?? '—'}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="text-white/60 text-sm">
                  {new Date(order.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="text-xs text-white/30 mt-0.5">
                  {new Date(order.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
