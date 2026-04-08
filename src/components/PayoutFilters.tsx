import type { AdminPayoutsFilters } from '../api/client';

interface Shop {
  id: number;
  name: string;
}

interface PayoutFiltersProps {
  filters: AdminPayoutsFilters;
  shops: Shop[];
  onFiltersChange: (filters: AdminPayoutsFilters) => void;
  onClear: () => void;
}

const inputCls =
  'bg-surface-2 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

const labelCls = 'text-[11px] font-semibold text-white/40 uppercase tracking-widest';

export function PayoutFilters({ filters, shops, onFiltersChange, onClear }: PayoutFiltersProps) {
  return (
    <div className="bg-surface-1 rounded-2xl px-5 py-4 flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>User ID</label>
        <input
          type="number"
          placeholder="Buscar por ID..."
          value={filters.user_id ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onFiltersChange({ ...filters, user_id: val ? Number(val) : undefined, page: 1 });
          }}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Loja</label>
        <select
          value={filters.shop_id ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, shop_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })
          }
          className={inputCls}
        >
          <option value="">Todas as lojas</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Tipo</label>
        <select
          value={filters.type ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              type: (e.target.value as AdminPayoutsFilters['type']) || undefined,
              page: 1,
            })
          }
          className={inputCls}
        >
          <option value="">Todos</option>
          <option value="withdrawal">Saque</option>
          <option value="adjustment">Ajuste</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>De</label>
        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value || undefined, page: 1 })}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Até</label>
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value || undefined, page: 1 })}
          className={inputCls}
        />
      </div>

      <button
        type="button"
        onClick={onClear}
        className="px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 bg-white/[0.04] transition-colors"
      >
        Limpar
      </button>
    </div>
  );
}
