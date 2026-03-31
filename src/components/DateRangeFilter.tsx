import DatePicker from 'react-datepicker';
import { periodToDates } from '../utils/dates';

const QUICK_PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

const UTC_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12); // -12 to +14

function formatUtcLabel(offset: number): string {
  if (offset === 0) return 'UTC+0';
  return offset > 0 ? `UTC+${offset}` : `UTC${offset}`;
}

interface DateRangeFilterProps {
  period: string;
  dateFrom: string;
  dateTo: string;
  utcOffset: number;
  onPeriodChange: (period: string, from: string, to: string) => void;
  onCustomDatesChange: (from: string, to: string) => void;
  onUtcOffsetChange: (offset: number) => void;
}

const btnBase =
  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0';
const btnActive = 'bg-surface-2 text-white shadow-sm';
const btnInactive = 'text-white/40 hover:text-white/70';

export default function DateRangeFilter({
  period,
  dateFrom,
  dateTo,
  utcOffset,
  onPeriodChange,
  onCustomDatesChange,
  onUtcOffsetChange,
}: DateRangeFilterProps) {
  const isCustom = period === 'custom';

  function handleQuickPeriod(value: string) {
    const { from, to } = periodToDates(value, utcOffset);
    onPeriodChange(value, from, to);
  }

  function handleCustom() {
    onPeriodChange('custom', '', '');
  }

  function handleUtcChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const offset = Number(e.target.value);
    localStorage.setItem('utc_offset', String(offset));
    onUtcOffsetChange(offset);
  }

  // Parse YYYY-MM-DD strings to Date objects for react-datepicker
  const startDate = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
  const endDate = dateTo ? new Date(dateTo + 'T00:00:00') : null;

  function handleDatePickerChange(dates: [Date | null, Date | null]) {
    const [start, end] = dates;
    const from = start ? start.toISOString().slice(0, 10) : '';
    const to = end ? end.toISOString().slice(0, 10) : '';
    onCustomDatesChange(from, to);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period buttons */}
      <div className="flex bg-surface-1 border border-white/[0.06] rounded-lg p-1 gap-0.5">
        {QUICK_PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handleQuickPeriod(p.value)}
            className={`${btnBase} ${
              period === p.value && !isCustom ? btnActive : btnInactive
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustom}
          className={`${btnBase} ${isCustom ? btnActive : btnInactive}`}
        >
          Personalizado
        </button>
      </div>

      {/* UTC offset dropdown */}
      <select
        value={utcOffset}
        onChange={handleUtcChange}
        aria-label="Fuso horário UTC"
        className="bg-surface-1 border border-white/[0.06] rounded-lg px-2 py-1.5 text-sm text-white/70 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
      >
        {UTC_OFFSETS.map((o) => (
          <option key={o} value={o}>
            {formatUtcLabel(o)}
          </option>
        ))}
      </select>

      {/* react-datepicker range picker (custom mode only) */}
      {isCustom && (
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={handleDatePickerChange}
          dateFormat="yyyy-MM-dd"
          placeholderText="Selecione o período"
          className="bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/50 transition-colors w-52"
          calendarClassName="!bg-surface-1 !border !border-white/[0.08] !rounded-xl !shadow-xl"
          dayClassName={() =>
            '!text-white/70 hover:!bg-surface-2 !rounded-md'
          }
          wrapperClassName="inline-block"
          isClearable={false}
        />
      )}
    </div>
  );
}
