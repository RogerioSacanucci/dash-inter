import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  total: number;
  completed: number;
}

export default function OrdersDonutChart({ total, completed }: Props) {
  const remainder = Math.max(0, total - completed);

  const chartData = total > 0
    ? [
        { value: completed, color: '#E8552A' },
        { value: remainder, color: '#202020'  },
      ]
    : [{ value: 1, color: '#202020' }];

  return (
    <div className="bg-surface-1 rounded-2xl p-5 flex flex-col gap-4 animate-fade-in h-full justify-center">
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Pedidos</p>

      <div className="flex items-center justify-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0 w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="88%"
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                paddingAngle={completed > 0 && remainder > 0 ? 2 : 0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white tabular-nums leading-none">{total}</span>
            <span className="text-[10px] text-white/30 mt-1">total</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-bold text-white tabular-nums">{total}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Completos</span>
            <span className="text-2xl font-bold text-brand tabular-nums">{completed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
