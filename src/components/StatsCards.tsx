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

  const supporting = [
    { label: 'Receita Líquida', value: fmt(overview.total_volume * 0.65), sub: '-35%' },
    { label: 'Transações',      value: overview.total_transactions.toString(), sub: `${overview.completed} concluídas` },
    { label: 'Conversão',       value: `${overview.conversion_rate}%`, sub: `${overview.failed} falhadas`, valueColor: conversionColor },
    { label: 'Pendentes',       value: overview.pending.toString(), sub: 'a aguardar pagamento' },
  ];

  return (
    <div className="bg-surface-1 rounded-2xl px-6 py-5 animate-fade-in">
      {/* Desktop layout */}
      <div className="hidden sm:flex items-stretch gap-0">
        {/* Hero metric */}
        <div className="flex flex-col gap-1.5 pr-6 mr-6 border-r border-white/[0.06] shrink-0">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Receita Bruta</p>
          <p className="text-[2.125rem] font-bold tracking-tight tabular-nums leading-none text-brand animate-value-pop">
            {fmt(overview.total_volume)}
          </p>
          <p className="text-[11px] text-white/30">transações concluídas</p>
        </div>

        {/* Supporting metrics */}
        <div className="flex flex-1 items-start divide-x divide-white/[0.06]">
          {supporting.map((c, i) => (
            <div
              key={c.label}
              className="flex-1 px-5 first:pl-0 last:pr-0 flex flex-col gap-1.5 min-w-0 animate-fade-in"
              style={{ animationDelay: `${(i + 1) * 40}ms` }}
            >
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{c.label}</p>
              <p className={`text-xl font-semibold tracking-tight tabular-nums leading-none ${c.valueColor ?? 'text-white/80'}`}>
                {c.value}
              </p>
              {c.sub && <p className="text-[11px] text-white/30">{c.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col gap-5 sm:hidden">
        {/* Hero */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Receita Bruta</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums leading-none text-brand">
            {fmt(overview.total_volume)}
          </p>
          <p className="text-[11px] text-white/30">transações concluídas</p>
        </div>

        <div className="border-t border-white/[0.06]" />

        {/* Supporting 2-col grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {supporting.map((c) => (
            <div key={c.label} className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{c.label}</p>
              <p className={`text-lg font-semibold tracking-tight tabular-nums leading-none ${c.valueColor ?? 'text-white/80'}`}>
                {c.value}
              </p>
              {c.sub && <p className="text-[11px] text-white/30">{c.sub}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
