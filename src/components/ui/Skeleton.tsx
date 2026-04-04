export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-white/[0.06] ${className ?? ''}`}
      style={style}
    />
  );
}

/* ── StatsCards skeleton (5 cells, desktop row + mobile 2-col grid) ── */

function SkeletonMetricCellBase({ hasSub = true }: { hasSub?: boolean }) {
  return (
    <div className="flex-1 px-5 first:pl-0 last:pr-0 flex flex-col gap-1.5 min-w-0">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
      {hasSub && <Skeleton className="h-3 w-16" />}
    </div>
  );
}

export function SkeletonStatsCards() {
  return (
    <div className="bg-surface-1 rounded-2xl px-6 py-5">
      {/* Desktop */}
      <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonMetricCellBase key={i} />
        ))}
      </div>
      {/* Mobile */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonMetricCellBase key={i} />
        ))}
      </div>
    </div>
  );
}

/* ── CartpandaStatsCards skeleton (4 groups × 2 metrics) ── */

function SkeletonCartpandaGroup() {
  return (
    <>
      {/* Heading */}
      <Skeleton className="h-2.5 w-14" />
      {/* Two metrics side-by-side */}
      <div className="flex divide-x divide-white/[0.06]">
        {[0, 1].map((mi) => (
          <div
            key={mi}
            className={`flex flex-col gap-1 min-w-0 flex-1 ${mi === 0 ? 'pr-4' : 'pl-4'}`}
          >
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        ))}
      </div>
    </>
  );
}

export function SkeletonCartpandaStats() {
  return (
    <div className="bg-surface-1 rounded-2xl px-6 py-5">
      {/* Desktop */}
      <div className="hidden sm:grid grid-cols-4 divide-x divide-white/[0.10]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="px-5 first:pl-0 last:pr-0 flex flex-col gap-3"
          >
            <SkeletonCartpandaGroup />
          </div>
        ))}
      </div>
      {/* Mobile */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <SkeletonCartpandaGroup />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Table rows skeleton ── */

export function SkeletonTableRows({
  rows = 5,
  cols,
}: {
  rows?: number;
  cols: number[];
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-white/[0.06] last:border-0">
          {cols.map((width, ci) => (
            <td key={ci} className="px-4 py-3">
              <Skeleton className="h-4" style={{ width: `${width}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Chart skeleton ── */

export function SkeletonChart() {
  return <Skeleton className="h-[240px] w-full rounded-xl" />;
}

/* ── CartpandaShopDetail metric cells (3 inline cells) ── */

export function SkeletonMetricCells() {
  return (
    <div className="bg-surface-1 rounded-2xl border border-white/[0.06] px-6 py-5">
      {/* Desktop */}
      <div className="hidden sm:flex items-start divide-x divide-white/[0.06]">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonMetricCellBase key={i} hasSub={false} />
        ))}
      </div>
      {/* Mobile */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonMetricCellBase key={i} hasSub={false} />
        ))}
      </div>
    </div>
  );
}
