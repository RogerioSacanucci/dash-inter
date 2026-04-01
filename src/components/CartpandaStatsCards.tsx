import type { CartpandaStatsResponse } from '../api/client';

interface Metric {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}

function MetricCell({ label, value, sub, valueColor = 'text-white' }: Metric) {
  return (
    <div className="flex-1 px-5 first:pl-0 last:pr-0 flex flex-col gap-1.5 min-w-0">
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/30">{sub}</p>}
    </div>
  );
}

interface Props {
  overview: CartpandaStatsResponse['overview'];
}

export default function CartpandaStatsCards({ overview }: Props) {
  const fmt = (n: number) =>
    '$\u00a0' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const fmtBalance = (value: string) => {
    const num = parseFloat(value ?? '0');
    const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (num < 0 ? '-$\u00a0' : '$\u00a0') + abs;
  };

  const metrics: Metric[] = [
    { label: 'Vol. Bruto', value: fmt(overview.total_volume), valueColor: 'text-brand' },
    { label: 'Vol. Líquido', value: fmt(overview.net_volume), sub: '-8.5% taxa -5% reserva' },
    { label: 'Pedidos', value: overview.total_orders.toString(), sub: `${overview.pending} pendentes` },
    { label: 'Completos', value: overview.completed.toString() },
    { label: 'Reembolsos', value: fmt(overview.refunded_volume), sub: `${overview.refunded} pedidos` },
    { label: 'Chargebacks', value: fmt(overview.chargeback_volume), sub: `${overview.declined} pedidos` },
    { label: 'A Liberar', value: fmtBalance(overview.balance_pending) },
    { label: 'Liberado', value: fmtBalance(overview.balance_released), valueColor: parseFloat(overview.balance_released) < 0 ? 'text-red-400' : undefined },
  ];

  return (
    <div className="bg-surface-1 rounded-2xl border border-white/[0.06] px-6 py-5">
      {/* Desktop: single row with dividers */}
      <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
        {metrics.map((m) => (
          <MetricCell key={m.label} {...m} />
        ))}
      </div>

      {/* Mobile: 2-col grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        {metrics.map((m) => (
          <MetricCell key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}
