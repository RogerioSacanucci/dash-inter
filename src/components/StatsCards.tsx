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

  return (
    <div className="bg-surface-1 rounded-2xl border border-white/[0.06] px-6 py-5">
      {/* Desktop: single row with dividers */}
      <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
        <MetricCell
          label="Receita Bruta"
          value={fmt(overview.total_volume)}
          sub="transações concluídas"
          valueColor="text-brand"
        />
        <MetricCell
          label="Receita Líquida"
          value={fmt(overview.total_volume * 0.65)}
          sub="-35%"
          valueColor="text-emerald-400"
        />
        <MetricCell
          label="Transações"
          value={overview.total_transactions.toString()}
          sub={`${overview.completed} concluídas`}
        />
        <MetricCell
          label="Conversão"
          value={`${overview.conversion_rate}%`}
          sub={`${overview.failed} falhadas`}
          valueColor={conversionColor}
        />
        <MetricCell
          label="Pendentes"
          value={overview.pending.toString()}
          sub="a aguardar pagamento"
        />
      </div>

      {/* Mobile: 2-col grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        <MetricCell
          label="Receita Bruta"
          value={fmt(overview.total_volume)}
          sub="concluídas"
          valueColor="text-brand"
        />
        <MetricCell
          label="Receita Líquida"
          value={fmt(overview.total_volume * 0.65)}
          sub="-35%"
          valueColor="text-emerald-400"
        />
        <MetricCell
          label="Transações"
          value={overview.total_transactions.toString()}
          sub={`${overview.completed} concluídas`}
        />
        <MetricCell
          label="Conversão"
          value={`${overview.conversion_rate}%`}
          sub={`${overview.failed} falhadas`}
          valueColor={conversionColor}
        />
        <MetricCell
          label="Pendentes"
          value={overview.pending.toString()}
          sub="a aguardar"
        />
      </div>
    </div>
  );
}
