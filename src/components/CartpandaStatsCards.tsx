import type { CartpandaStatsResponse } from '../api/client';

interface MetricItem {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  primary?: boolean;
}

interface Group {
  heading: string;
  metrics: [MetricItem, MetricItem];
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

  const releasedNum = parseFloat(overview.balance_released ?? '0');

  const groups: Group[] = [
    {
      heading: 'Receita',
      metrics: [
        { label: 'Vol. Bruto',   value: fmt(overview.total_volume),  valueColor: 'text-emerald-400', primary: true },
        { label: 'Vol. Líquido', value: fmt(overview.net_volume),    sub: '-5% reserva' },
      ],
    },
    {
      heading: 'Pedidos',
      metrics: [
        { label: 'Total',      value: overview.total_orders.toString(), primary: true },
        { label: 'Completos',  value: overview.completed.toString(),    sub: `${overview.pending} pendentes`, valueColor: 'text-emerald-400' },
      ],
    },
    {
      heading: 'Risco',
      metrics: [
        { label: 'Reembolsos',  value: fmt(overview.refunded_volume),   sub: `${overview.refunded} pedidos`,  valueColor: overview.refunded_volume > 0 ? 'text-amber-400' : undefined },
        { label: 'Chargebacks', value: fmt(overview.chargeback_volume), sub: `${overview.declined} pedidos`,  valueColor: overview.chargeback_volume > 0 ? 'text-red-400'   : undefined },
      ],
    },
    {
      heading: 'Saldo',
      metrics: [
        { label: 'A Liberar', value: fmtBalance(overview.balance_pending) },
        { label: 'Liberado',  value: fmtBalance(overview.balance_released), primary: true, valueColor: releasedNum < 0 ? 'text-red-400' : 'text-emerald-400' },
      ],
    },
  ];

  return (
    <div className="bg-surface-1 rounded-2xl px-6 py-5">

      {/* Desktop: 4 groups separated by stronger dividers */}
      <div className="hidden sm:grid grid-cols-4 divide-x divide-white/[0.10]">
        {groups.map((group, gi) => (
          <div
            key={group.heading}
            className="px-5 first:pl-0 last:pr-0 flex flex-col gap-3 animate-fade-in"
            style={{ animationDelay: `${gi * 60}ms` }}
          >
            {/* Group heading */}
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25 select-none">
              {group.heading}
            </p>

            {/* Two metrics side-by-side with lighter divider */}
            <div className="flex divide-x divide-white/[0.06]">
              {group.metrics.map((m, mi) => (
                <div
                  key={m.label}
                  className={`flex flex-col gap-1 min-w-0 ${mi === 0 ? 'pr-4 flex-1' : 'pl-4 flex-1'}`}
                >
                  <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest truncate">
                    {m.label}
                  </p>
                  <p className={`text-2xl font-bold tabular-nums leading-none truncate ${m.valueColor ?? 'text-white/80'}`}>
                    {m.value}
                  </p>
                  {m.sub && (
                    <p className="text-[10px] text-white/25 truncate">{m.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: 2×2 grid of groups */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        {groups.map((group, gi) => (
          <div
            key={group.heading}
            className="flex flex-col gap-2.5 animate-fade-in"
            style={{ animationDelay: `${gi * 60}ms` }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25 select-none">
              {group.heading}
            </p>
            {group.metrics.map((m) => (
              <div key={m.label} className="flex flex-col gap-0.5">
                <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest">{m.label}</p>
                <p className={`text-xl font-bold tabular-nums leading-none ${m.valueColor ?? 'text-white/80'}`}>
                  {m.value}
                </p>
                {m.sub && <p className="text-[10px] text-white/25">{m.sub}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}
