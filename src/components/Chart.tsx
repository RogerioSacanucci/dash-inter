import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const BRAND  = '#14b8a6';
const INDIGO = '#6366f1';

interface DataPoint {
  date?: string;
  hour?: string;
  transactions: number;
  volume: number;
}

interface Props {
  data: DataPoint[];
  hourly?: boolean;
  secondaryLabel?: string;
  currencySymbol?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, hourly, secondaryLabel, currencySymbol }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-white/[0.08] rounded-xl shadow-xl p-3 text-sm">
      <p className="font-semibold text-white/60 mb-2 text-xs uppercase tracking-wide">
        {hourly ? label : formatDate(label)}
      </p>
      <p className="text-brand font-bold">
        {currencySymbol} {(payload[0]?.value ?? 0).toFixed(2).replace('.', ',')}
      </p>
      <p className="text-white/40 text-xs mt-0.5">{payload[1]?.value ?? 0} {secondaryLabel}</p>
    </div>
  );
}

export default function Chart({ data, hourly = false, secondaryLabel = 'transações', currencySymbol = '€' }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-white/20 text-sm">
        Sem dados para o período selecionado
      </div>
    );
  }

  const xKey = hourly ? 'hour' : 'date';
  const totalVolume = data.reduce((s, d) => s + d.volume, 0).toFixed(2).replace('.', ',');
  const totalTx     = data.reduce((s, d) => s + d.transactions, 0);
  const ariaLabel   = `Gráfico de pagamentos: ${currencySymbol}${totalVolume} em volume, ${totalTx} ${secondaryLabel}`;

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BRAND} stopOpacity={0.25} />
              <stop offset="95%" stopColor={BRAND} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey={xKey}
            tickFormatter={hourly ? (v) => v : formatDate}
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'Outfit' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'Outfit' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${currencySymbol}${v}`}
          />
          <Tooltip content={<CustomTooltip hourly={hourly} secondaryLabel={secondaryLabel} currencySymbol={currencySymbol} />} />
          <Area
            type="monotone"
            dataKey="volume"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#volGrad)"
          />
          <Area
            type="monotone"
            dataKey="transactions"
            stroke={INDIGO}
            strokeWidth={1.5}
            fill="transparent"
            strokeDasharray="4 2"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
