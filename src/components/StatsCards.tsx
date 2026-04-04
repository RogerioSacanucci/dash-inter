interface Metric {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  index?: number;
}

function MetricCell({ label, value, sub, valueColor = 'text-white', index = 0 }: Metric) {
  return (
    <div
      className="flex-1 px-5 first:pl-0 last:pr-0 flex flex-col gap-1.5 min-w-0 animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/30">{sub}</p>}
    </div>
  );
}

interface Props {
  overview: {
    total_transactions: number;
    completed: number;
    pending: number;
    failed: number;
    total_volume: number;
    conversion_rate: number;
  };
}

export default function StatsCards({ overview }: Props) {
  const fmt = (n: number) =>
    '€\u00a0' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const conversionColor =
    overview.conversion_rate >= 60 ? 'text-emerald-400' :
    overview.conversion_rate >= 30 ? 'text-white'        :
                                     'text-amber-400';

  const cells = [
    { label: 'Receita Bruta',   value: fmt(overview.total_volume),              sub: 'transações concluídas', valueColor: 'text-brand', mobileSub: 'concluídas' },
    { label: 'Receita Líquida', value: fmt(overview.total_volume * 0.65),        sub: '-35%' },
    { label: 'Transações',      value: overview.total_transactions.toString(),   sub: `${overview.completed} concluídas` },
    { label: 'Conversão',       value: `${overview.conversion_rate}%`,           sub: `${overview.failed} falhadas`, valueColor: conversionColor },
    { label: 'Pendentes',       value: overview.pending.toString(),              sub: 'a aguardar pagamento', mobileSub: 'a aguardar' },
  ];

  return (
    <div className="bg-surface-1 rounded-2xl px-6 py-5">
      {/* Desktop: single row with dividers */}
      <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
        {cells.map((c, i) => (
          <MetricCell key={c.label} label={c.label} value={c.value} sub={c.sub} valueColor={c.valueColor} index={i} />
        ))}
      </div>

      {/* Mobile: 2-col grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        {cells.map((c, i) => (
          <MetricCell key={c.label} label={c.label} value={c.value} sub={c.mobileSub ?? c.sub} valueColor={c.valueColor} index={i} />
        ))}
      </div>
    </div>
  );
}
