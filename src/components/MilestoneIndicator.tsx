import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Player } from '@lordicon/react';
import { Check } from 'lucide-react';
import rankIcon from '../icons/rank.json';
import { api } from '../api/client';

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function MilestoneIndicator() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rankPlayerRef = useRef<Player>(null);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['milestone-progress'],
    queryFn: () => api.getMilestoneProgress(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!data) return null;

  const progressPct = data.next_milestone?.progress_pct ?? 100;
  const achievedIds = new Set(data.achieved.map((a) => a.id));
  const achievedMap = new Map(data.achieved.map((a) => [a.id, a.achieved_at]));

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Compact trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => rankPlayerRef.current?.playFromBeginning()}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg fine-hover:bg-white/[0.04] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Player
          ref={rankPlayerRef}
          icon={rankIcon}
          size={22}
          colorize="#E8552A"
        />
        <span className="text-[15px] font-semibold text-white/80">
          {formatCurrency(data.total)}
        </span>
        {/* Progress bar — option B: % overlaid in center */}
        <div className="relative w-28 h-[14px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white leading-none">
            {Math.round(progressPct)}%
          </span>
        </div>
      </button>

      {/* Tooltip / Popover */}
      <div
        className={`absolute top-full right-0 mt-2 w-72 bg-surface-1 border border-white/[0.08] rounded-2xl shadow-xl z-50 transition-all duration-150 origin-top-right ${
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">
            Marcos de Faturamento
          </p>

          <div className="flex flex-col gap-1">
            {data.all_milestones.map((m) => {
              const isAchieved = achievedIds.has(m.id);
              const isNext = data.next_milestone?.id === m.id;

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {isAchieved ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                    ) : isNext ? (
                      <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center">
                        <Player icon={rankIcon} size={12} colorize="#E8552A" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/[0.06]" />
                    )}
                  </div>

                  {/* Value + date */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] font-medium ${
                        isAchieved
                          ? 'text-white/70'
                          : isNext
                            ? 'text-brand'
                            : 'text-white/30'
                      }`}
                    >
                      {formatCurrency(m.value)}
                    </p>
                    {isAchieved && achievedMap.get(m.id) && (
                      <p className="text-[11px] text-white/40">
                        {formatDate(achievedMap.get(m.id)!)}
                      </p>
                    )}
                  </div>

                  {/* Progress for next milestone */}
                  {isNext && (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-brand">
                        {Math.round(progressPct)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Total acumulado</span>
            <span className="text-[13px] font-semibold text-white/80">
              {formatCurrency(data.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
