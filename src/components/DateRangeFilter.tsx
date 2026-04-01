import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-datepicker/dist/react-datepicker.css';
import { periodToDates } from '../utils/dates';

registerLocale('pt-BR', ptBR);

const QUICK_PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

const UTC_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12);

function formatUtcLabel(offset: number): string {
  if (offset === 0) return 'UTC+0';
  return offset > 0 ? `UTC+${offset}` : `UTC${offset}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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

export default function DateRangeFilter({
  period,
  dateFrom,
  dateTo,
  utcOffset,
  onPeriodChange,
  onCustomDatesChange,
  onUtcOffsetChange,
}: DateRangeFilterProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startDate = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
  const endDate = dateTo ? new Date(dateTo + 'T00:00:00') : null;

  function handleQuickPeriod(value: string) {
    const { from, to } = periodToDates(value, utcOffset);
    onPeriodChange(value, from, to);
    setPickerOpen(false);
  }

  function handleUtcChange(e: ChangeEvent<HTMLSelectElement>) {
    const offset = Number(e.target.value);
    localStorage.setItem('utc_offset', String(offset));
    onUtcOffsetChange(offset);
    if (period && period !== 'custom') {
      const { from, to } = periodToDates(period, offset);
      onPeriodChange(period, from, to);
    }
  }

  function handleDatePickerChange(dates: [Date | null, Date | null]) {
    const [start, end] = dates;
    const from = start ? start.toISOString().slice(0, 10) : '';
    const to = end ? end.toISOString().slice(0, 10) : '';
    onPeriodChange('custom', from, to);
    if (start && end) {
      setPickerOpen(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [pickerOpen]);

  const displayLabel =
    dateFrom && dateTo
      ? dateFrom === dateTo
        ? formatDisplayDate(dateFrom)
        : `${formatDisplayDate(dateFrom)} – ${formatDisplayDate(dateTo)}`
      : 'Selecione';

  const periodLabel = QUICK_PERIODS.find((p) => p.value === period)?.label;

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setPickerOpen(!pickerOpen)}
        className="flex items-center gap-2 bg-surface-1 border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
        </svg>
        <span>{periodLabel ?? displayLabel}</span>
        <span className="text-white/30 text-xs">{formatUtcLabel(utcOffset)}</span>
        <svg className={`w-3.5 h-3.5 text-white/30 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Popover */}
      {pickerOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-surface-1 border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden w-[340px]">
          {/* Quick periods + UTC row */}
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <div className="flex gap-1">
              {QUICK_PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleQuickPeriod(p.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    period === p.value
                      ? 'bg-brand text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <select
              value={utcOffset}
              onChange={handleUtcChange}
              aria-label="Fuso horário UTC"
              className="bg-surface-2 border border-white/[0.06] rounded-md px-2 py-1 text-xs text-white/60 outline-none focus:border-brand/50 transition-colors shrink-0"
            >
              {UTC_OFFSETS.map((o) => (
                <option key={o} value={o}>
                  {formatUtcLabel(o)}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Calendar */}
          <div className="date-range-popover">
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleDatePickerChange}
              inline
              locale="pt-BR"
            />
          </div>
        </div>
      )}
    </div>
  );
}
