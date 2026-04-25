import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

interface Props {
  dateFrom: string;
  dateTo: string;
  userId?: string;
}

export default function TiktokRoasCard({ dateFrom, dateTo, userId }: Props) {
  const params = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      user_id: userId ? Number(userId) : undefined,
    }),
    [dateFrom, dateTo, userId],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["tiktok-roas", params],
    queryFn: () => api.tiktokRoas(params),
    retry: 0,
    staleTime: 60_000,
  });

  if (error) {
    // Silent: dashboard ignores ROAS card if backend errors (e.g., user has no connection)
    return null;
  }

  const r = data?.data;

  // Hide entirely when there's nothing to show (no spend AND no revenue from TikTok side)
  if (!isLoading && r && r.total_spend === 0 && r.total_revenue === 0) {
    return null;
  }

  return (
    <div className="bg-surface-1 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-white">TikTok · ROAS</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Gasto na TikTok × receita
          </p>
        </div>
        <span className="bg-surface-2 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60">
          {r?.currency ?? "USD"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric
          label="ROAS"
          value={
            r?.roas !== null && r?.roas !== undefined
              ? `${r.roas.toFixed(2)}x`
              : "—"
          }
          tone={
            r && r.roas !== null && r.roas >= 1
              ? "good"
              : r && r.roas !== null
                ? "warn"
                : "neutral"
          }
        />
        <Metric
          label="Gasto"
          value={
            isLoading
              ? "…"
              : `${r?.currency ?? "$"} ${(r?.total_spend ?? 0).toFixed(2)}`
          }
        />
        <Metric
          label="Receita"
          value={
            isLoading
              ? "…"
              : `${r?.currency ?? "$"} ${(r?.total_revenue ?? 0).toFixed(2)}`
          }
        />
        <Metric
          label="Pedidos"
          value={isLoading ? "…" : String(r?.orders ?? 0)}
        />
      </div>

      {r && r.by_advertiser.length > 0 && (
        <div className="mt-5 border-t border-white/[0.04] pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
            Por advertiser
          </div>
          <div className="flex flex-wrap gap-2">
            {r.by_advertiser.map((a) => (
              <span
                key={`${a.connection_id}:${a.advertiser_id}`}
                className="inline-flex items-center gap-2 bg-surface-2 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs"
              >
                <span className="text-white/60 truncate max-w-[180px]">
                  {a.name}
                </span>
                <span className="font-semibold tabular-nums text-white/80">
                  {a.currency} {a.spend.toFixed(2)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "neutral";
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-white";
  return (
    <div className="bg-surface-2 border border-white/[0.04] rounded-xl px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}
